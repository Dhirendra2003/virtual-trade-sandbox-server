import Stripe from "stripe";
import User from "../models/User.js";

const stripe = new Stripe(process.env.STR_SECRET_KEY);

// ─── Step 1: Create PaymentIntent ────────────────────────────────────────────
// Frontend calls this first to get a clientSecret for the CardElement.
export const createPaymentIntent = async (req, res) => {
  const { amount } = req.body; // amount in rupees (integer)

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const amountInPaise = Math.round(Number(amount) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPaise,
    currency: "inr",
    payment_method_types: ["card"],
    // Attach the user's id so the webhook can find them later
    metadata: { userId: String(req.user.id) },
  });

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
  });
};

// ─── Step 2a (DEV): Confirm & add funds directly ─────────────────────────────
// After stripe.confirmCardPayment succeeds on the frontend, the frontend
// calls this endpoint with the paymentIntentId. We verify it with Stripe
// (so it can't be faked) and then credit the user's actualFunds.
export const confirmPaymentAndAddFunds = async (req, res) => {
  const { paymentIntentId } = req.body;
  const userId = req.user.id;

  if (!paymentIntentId) {
    return res.status(400).json({ error: "paymentIntentId is required" });
  }

  // Verify with Stripe — never trust the frontend alone
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return res.status(400).json({
      error: `Payment not completed. Status: ${paymentIntent.status}`,
    });
  }

  const amountInRupees = paymentIntent.amount_received / 100;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Atomically increment actualFunds
  await user.increment("actualFunds", { by: amountInRupees });
  await user.increment("funds", { by: amountInRupees });
  await user.reload();

  res.status(200).json({
    success: true,
    message: `₹${amountInRupees.toLocaleString()} added to your wallet.`,
    actualFunds: Number(user.actualFunds),
  });
};

// ─── Step 2b (PROD): Stripe Webhook ──────────────────────────────────────────
// Stripe calls this endpoint automatically when a payment succeeds.
// Register this URL in your Stripe Dashboard → Developers → Webhooks.
// This is the safest approach for production.
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STR_WEBHOOK_SECRET;

  let event;
  try {
    // req.body must be the raw Buffer here (see payment.routes.js)
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata?.userId;
    const amountInRupees = paymentIntent.amount_received / 100;

    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        await user.increment("actualFunds", { by: amountInRupees });
        await user.increment("funds", { by: amountInRupees });
        console.log(
          `✅ Added ₹${amountInRupees} to user ${userId}. New funds: ${Number(user.actualFunds) + amountInRupees}`,
        );
      }
    }
  }

  // Always respond 200 quickly so Stripe doesn't retry
  res.status(200).json({ received: true });
};
