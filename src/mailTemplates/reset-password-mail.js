const resetPasswordMail = (name, resetLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827; line-height: 1.6;">
    <h2 style="color: #111827;">Reset your password</h2>
    <p>Hi ${name || "there"},</p>
    <p>We received a request to reset your Virtual Trade Sandbox password.</p>
    <p>This link will expire in 15 minutes.</p>
    <p style="margin: 24px 0;">
      <a
        href="${resetLink}"
        style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px;"
      >
        Reset Password
      </a>
    </p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p style="font-size: 14px; color: #6b7280;">If the button does not work, open this link manually:</p>
    <p style="font-size: 14px; word-break: break-word; color: #2563eb;">${resetLink}</p>
  </div>
`;

export default resetPasswordMail;
