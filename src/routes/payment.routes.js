import express from "express";
import {
  createPaymentIntent,
  confirmPaymentAndAddFunds,
  stripeWebhook,
} from "../controller/payment.controller.js";
import checkLoggedIn from "../middleware/auth.middleware.js";

const router = express.Router();

// Step 1 — create intent (requires login)
router.post("/create-payment-intent", checkLoggedIn, createPaymentIntent);

// Step 2 (DEV) — verify with Stripe & credit funds (requires login)
router.post("/confirm-payment", checkLoggedIn, confirmPaymentAndAddFunds);

// Step 2 (PROD) — Stripe webhook (raw body required, no auth middleware)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

export default router;
