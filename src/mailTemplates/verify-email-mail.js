const verifyEmailMail = (name, verifyLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827; line-height: 1.6;">
    <h2 style="color: #111827;">Verify your email address</h2>
    <p>Hi ${name || "there"},</p>
    <p>Thank you for registering with Virtual Trade Sandbox. Please verify your email address to activate your account.</p>
    <p>This link will expire in 24 hours.</p>
    <p style="margin: 24px 0;">
      <a
        href="${verifyLink}"
        style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px;"
      >
        Verify Email
      </a>
    </p>
    <p>If you did not create an account, you can safely ignore this email.</p>
    <p style="font-size: 14px; color: #6b7280;">If the button does not work, open this link manually:</p>
    <p style="font-size: 14px; word-break: break-word; color: #2563eb;">${verifyLink}</p>
  </div>
`;

export default verifyEmailMail;
