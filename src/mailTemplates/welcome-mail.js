const welcomMail = (userName) => {
  const APP_BASE_URL = process.env.FRONTEND_URL;
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Welcome to Virtual Trade Sandbox</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
      /* Layout Reset */
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        border-collapse: collapse !important;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        display: block;
      }

      body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background: #000000;
        background: linear-gradient(
          to top right,
          #05203e 10%,
          #000 70%,
          #2c2041 100%
        ) !important;
        color: #ffffff;
        font-family:
          "Inter",
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Roboto,
          Helvetica,
          Arial,
          sans-serif;
      }

      /* Mobile Styles */
      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          max-width: 100% !important;
        }
        .content-padding {
          padding: 20px !important;
        }
        .mobile-stack {
          display: block !important;
          width: 100% !important;
          padding: 10px 0 !important;
          text-align: left !important;
        }
        .mobile-image {
          width: 100% !important;
          max-width: 100% !important;
          margin-bottom: 20px !important;
        }
        .mobile-center {
          text-align: center !important;
        }
      }

      /* Glassmorphism Classes */
      .glass-card {
        background-color: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
      }

      .cta-button {
        background: linear-gradient(135deg, #8b5cf6 0%, #504dbb 100%);
        color: #ffffff !important;
        padding: 16px 40px;
        border-radius: 12px;
        text-decoration: none;
        display: inline-block;
        font-weight: 700;
        font-size: 16px;
        box-shadow: 0 8px 20px rgba(80, 77, 187, 0.4);
      }

      .accent-purple {
        color: #8b5cf6;
      }
      .feature-title {
        font-size: 20px;
        font-weight: 800;
        margin: 0 0 10px 0;
        color: #ffffff;
      }
      .feature-text {
        color: #d1d1d6;
        font-size: 14px;
        line-height: 22px;
        margin: 0;
      }
      .motivation-quote {
        font-style: italic;
        color: #a1a1aa;
        font-size: 16px;
        border-left: 3px solid #8b5cf6;
        padding-left: 15px;
        margin: 20px 0;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0">
    <center>
      <table
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        style="
          background: linear-gradient(
            to top right,
            #05203e 10%,
            #000 70%,
            #2c2041 100%
          );
        "
      >
        <tr>
          <td align="center">
            <table
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              style="max-width: 600px"
              class="container"
            >
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 50px 0 20px 0">
                  <img
                    src="https://res.cloudinary.com/digbazqis/image/upload/v1777061000/sy3rl84kbmgh0sfuqz3r_elfe7x.webp"
                    width="70"
                    height="70"
                    alt="VTS Logo"
                    style="border-radius: 16px"
                  />
                  <h1
                    style="
                      margin: 15px 0 0 0;
                      font-size: 20px;
                      font-weight: 800;
                      letter-spacing: 1px;
                      text-transform: uppercase;
                      color: #ffffff;
                    "
                  >
                    Virtual Trade <span class="accent-purple">Sandbox</span>
                  </h1>
                </td>
              </tr>

              <!-- Motivation Section -->
              <tr>
                <td
                  class="content-padding"
                  style="padding: 20px 30px 40px 30px"
                >
                  <h2 style="font-size: 28px; line-height: 36px; margin: 0; color: #ffffff;">
                    Welcome aboard, ${userName.toUpperCase()} 🚀
                  </h2>
                   <p style="text-align: center; margin: 16px 0 0 0;">
                    <span style="display: inline-block; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; font-size: 13px; font-weight: 600; padding: 8px 20px; border-radius: 50px; white-space: nowrap;">Your email address has been verified successfully.</span>
                  </p>
                  <div class="motivation-quote">
                    "Trading isn't just about the charts; it's about the
                    discipline to follow your plan. Practice here, so you can
                    perform there."
                  </div>
                  <p style="color: #d1d1d6; line-height: 24px">
                    We've built this platform to give you a real-world trading
                    experience with zero financial risk. Whether you're testing
                    a new strategy or learning the ropes, VTS is your ultimate
                    training ground.
                  </p>
                </td>
              </tr>

              <!-- Feature 1: Advanced Trading (Text Left, Image Right) -->
              <tr>
                <td class="content-padding" style="padding: 0 30px 40px 30px">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                  >
                    <tr>
                      <td
                        width="55%"
                        class="mobile-stack"
                        valign="middle"
                        style="padding-right: 20px"
                      >
                        <div class="feature-title">
                          Core Trading
                          <span class="accent-purple">Revamped</span>
                        </div>
                        <p class="feature-text">
                          Experience a fully functional trading system. Execute
                          <strong>Intraday & Delivery</strong> trades with
                          instant execution during live markets, or use
                          <strong>AMO (After Market Orders)</strong> for
                          next-day planning. Never miss an exit with
                          <strong>Auto Square-off</strong> at 3:15 PM.
                        </p>
                      </td>
                      <td width="45%" class="mobile-stack" align="center">
                        <div
                          class="glass-card"
                          style="padding: 5px; overflow: hidden"
                        >
                          <img
                            src="https://res.cloudinary.com/digbazqis/image/upload/v1777060710/z1a1hzw6wfucypm9z3nt_pk1x9s.webp"
                            width="240"
                            class="mobile-image"
                            alt="Trading Interface"
                          />
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Feature 2: Real-time Insights (Image Left, Text Right) -->
              <tr>
                <td class="content-padding" style="padding: 0 30px 40px 30px">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                  >
                    <tr>
                      <td
                        width="45%"
                        class="mobile-stack"
                        align="center"
                        style="padding-right: 20px"
                      >
                        <div
                          class="glass-card"
                          style="padding: 5px; overflow: hidden"
                        >
                          <img
                            src="https://res.cloudinary.com/digbazqis/image/upload/v1777060710/Screenshot_2026-04-25_011931_urc6dt.webp"
                            width="240"
                            class="mobile-image"
                            alt="Analytics Insights"
                          />
                        </div>
                      </td>
                      <td width="55%" class="mobile-stack" valign="middle">
                        <div class="feature-title">
                          Real-Time
                          <span class="accent-purple">Performance</span>
                        </div>
                        <p class="feature-text">
                          Watch your portfolio breathe. Get
                          <strong>Live PnL updates every 5 seconds</strong> and
                          track your order history across all statuses. Analyze
                          market trends with our integrated
                          <strong>News Carousel</strong> and custom
                          <strong>Riskometer</strong> insights for every stock.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Feature 3: Analytics & AI (Full Width Image Section) -->
              <tr>
                <td class="content-padding" style="padding: 0 30px 40px 30px">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                  >
                    <tr>
                      <td align="center">
                        <div class="feature-title" style="margin-bottom: 20px">
                          Professional Grade
                          <span class="accent-purple">Analytics</span>
                        </div>
                        <div
                          class="glass-card"
                          style="padding: 10px; margin-bottom: 20px"
                        >
                          <img
                            src="https://res.cloudinary.com/digbazqis/image/upload/v1777060711/Screenshot_2026-04-25_011900_nzybwt.webp"
                            width="540"
                            style="width: 100%"
                            alt="Full Dashboard View"
                          />
                        </div>
                        <p
                          class="feature-text"
                          style="
                            text-align: center;
                            max-width: 500px;
                            margin: 0 auto;
                          "
                        >
                          Powered by <strong>AG Charts</strong> and
                          <strong>Gemini 1.5 Flash AI</strong>. Dive deep into
                          quarterly shareholding patterns, competitor analysis,
                          and AI-driven stock recommendations to sharpen your
                          edge.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Section -->
              <tr>
                <td
                  align="center"
                  class="content-padding"
                  style="padding: 20px 30px 60px 30px"
                >
                  <a href="${APP_BASE_URL}" class="cta-button">Start Trading Now</a>
                  <p style="color: #a1a1aa; font-size: 12px; margin-top: 20px">
                    No credit card required. Pure learning.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td
                  align="center"
                  style="
                    padding: 40px 30px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                  "
                >
                  <p style="color: #a1a1aa; font-size: 14px">
                    🔔 <strong>Pro Tip:</strong> Set up your notifications to
                    receive instant trade execution alerts and login security
                    updates.
                  </p>
                  <p
                    style="
                      font-weight: bold;
                      margin: 30px 0 0 0;
                      font-size: 16px;
                      color: #ffffff;
                    "
                  >
                    Team Virtual Trade Sandbox
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;
};

export default welcomMail;
