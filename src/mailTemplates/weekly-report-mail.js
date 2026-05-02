/**
 * Weekly Report Mail Template
 *
 * @param {object} params
 * @param {string} params.userName       - User's display name
 * @param {object} params.portfolioStats - Data from getPortfolioStats controller
 *   { current_funds, total_invested, total_current_value, unrealized_pnl, overall_pnl, positions_count }
 * @param {object} params.analyticsData  - Data from getUserAnalytics controller
 *   { pnl_bar_chart, trade_rankings_table, distribution_pie_chart, consistency_heatmap }
 * @param {string} params.geminiSummary  - AI-generated weekly summary text
 * @param {string} params.weekRange      - e.g. "Apr 28 – May 2, 2026"
 */
const weeklyReportMail = ({
  userName,
  portfolioStats,
  analyticsData,
  geminiSummary,
  weekRange,
}) => {
  // ── Portfolio Stats ─────────────────────────────────────────────────────────
  const currentFunds = portfolioStats?.current_funds ?? 0;
  const totalInvested = portfolioStats?.total_invested ?? 0;
  const totalCurrentValue = portfolioStats?.total_current_value ?? 0;
  const unrealizedPnl = portfolioStats?.unrealized_pnl ?? 0;
  const overallPnl = portfolioStats?.overall_pnl ?? 0;
  const positionsCount = portfolioStats?.positions_count ?? 0;
  const netWorth = currentFunds + totalInvested;

  const unrealizedPnlPercent =
    totalInvested > 0
      ? ((unrealizedPnl / totalInvested) * 100).toFixed(2)
      : "0.00";

  const overallPnlPercent =
    currentFunds + totalInvested - overallPnl > 0
      ? (
          (overallPnl / (currentFunds + totalInvested - overallPnl)) *
          100
        ).toFixed(2)
      : "0.00";

  const pnlColor = (val) => (val >= 0 ? "#22c55e" : "#ef4444");
  const pnlArrow = (val) => (val >= 0 ? "▲" : "▼");
  const fmt = (val) =>
    Math.abs(val).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  // ── PnL Bar Chart (QuickChart) ───────────────────────────────────────────────
  // pnl_bar_chart.all_trades: [{ id, profit, profit_perc, createdAt }]
  const pnlTrades = analyticsData?.pnl_bar_chart?.all_trades ?? [];

  const barChartConfig = encodeURIComponent(
    JSON.stringify({
      type: "bar",
      data: {
        // x-axis label = trade index (1, 2, 3 …)
        labels: pnlTrades.map((_, i) => String(i + 1)),
        datasets: [
          {
            label: "P&L (₹)",
            data: pnlTrades.map((t) => parseFloat(t.profit ?? 0).toFixed(2)),
            backgroundColor: pnlTrades.map((t) =>
              parseFloat(t.profit ?? 0) >= 0
                ? "rgba(34,197,94,0.8)"
                : "rgba(239,68,68,0.8)",
            ),
            borderRadius: 4,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "All Trades — P&L (₹)",
            color: "#ffffff",
            font: { size: 14, weight: "bold" },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Trade #", color: "#FFFFFF" },
            ticks: { color: "#FFFFFF" },
            grid: { color: "rgba(255,255,255,0.2)" },
          },
          y: {
            ticks: { color: "#FFFFFF" },
            grid: { color: "rgba(255,255,255,0.2)" },
          },
        },
      },
    }),
  );
  const barChartUrl = `https://quickchart.io/chart?c=${barChartConfig}&width=540&height=260&backgroundColor=rgba(15,23,42,0.95)`;

  // ── Distribution Pie Chart (QuickChart) ──────────────────────────────────────
  // distribution_pie_chart.delivery_allocation: [{ name, total, trade_duration }]
  const distData =
    analyticsData?.distribution_pie_chart?.delivery_allocation ?? [];
  const pieLabels = distData.map((d) => d.name ?? "Unknown");
  const pieValues = distData.map((d) => parseFloat(d.total ?? 0).toFixed(2));

  const pieChartConfig = encodeURIComponent(
    JSON.stringify({
      type: "doughnut",
      data: {
        labels: pieLabels.length > 0 ? pieLabels : ["No Data"],
        datasets: [
          {
            data: pieValues.length > 0 ? pieValues : [1],
            backgroundColor: [
              "#8b5cf6",
              "#6366f1",
              "#22c55e",
              "#f59e0b",
              "#ef4444",
              "#06b6d4",
              "#ec4899",
            ],
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            position: "right",
            labels: { color: "#FFFFFF", font: { size: 11 } },
          },
          title: {
            display: true,
            text: "Portfolio Distribution",
            color: "#FFFFFF",
            font: { size: 14, weight: "bold" },
          },
        },
      },
    }),
  );
  const pieChartUrl = `https://quickchart.io/chart?c=${pieChartConfig}&width=400&height=260&backgroundColor=rgba(15,23,42,0.95)`;

  // ── Top Ranked Trades Table ───────────────────────────────────────────────────
  // trade_rankings_table.top_profit_amount: [{ name, trade_count, profit, profit_perc }]
  const topTrades =
    analyticsData?.trade_rankings_table?.top_profit_amount?.slice(0, 5) ?? [];

  const topTradesRows =
    topTrades.length > 0
      ? topTrades
          .map(
            (t) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e2e8f0; font-size: 13px;">${t.name ?? "-"}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #a1a1aa; font-size: 13px; text-align:center;">${t.trade_count ?? 0}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: ${pnlColor(parseFloat(t.profit ?? 0))}; font-size: 13px; text-align:right; font-weight:600;">
          ${pnlArrow(parseFloat(t.profit ?? 0))} ₹${fmt(parseFloat(t.profit ?? 0))}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: ${pnlColor(parseFloat(t.profit_perc ?? 0))}; font-size: 13px; text-align:right;">
          ${parseFloat(t.profit_perc ?? 0).toFixed(2)}%
        </td>
      </tr>`,
          )
          .join("")
      : `<tr><td colspan="4" style="padding:20px; text-align:center; color:#a1a1aa; font-size:13px;">No closed trades this week</td></tr>`;

  // ── Most Traded Table ─────────────────────────────────────────────────────────
  const mostTraded =
    analyticsData?.trade_rankings_table?.most_traded?.slice(0, 5) ?? [];
  const mostTradedRows =
    mostTraded.length > 0
      ? mostTraded
          .map(
            (t, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color:#8b5cf6; font-size:13px; font-weight:700;">#${i + 1}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color:#e2e8f0; font-size:13px;">${t.name ?? "-"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color:#a1a1aa; font-size:13px; text-align:right;">${t.trade_count ?? 0} trades</td>
      </tr>`,
          )
          .join("")
      : `<tr><td colspan="3" style="padding:20px; text-align:center; color:#a1a1aa; font-size:13px;">No trades recorded</td></tr>`;

  // ── Gemini AI Summary ─────────────────────────────────────────────────────────
  const aiSummaryText =
    geminiSummary || "No AI summary available for this week.";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Your Weekly Trading Report — Virtual Trade Sandbox</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style type="text/css">
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
      body {
        height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important;
        background: linear-gradient(to top right, #05203e 10%, #000 70%, #2c2041 100%) !important;
        color: #ffffff;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .glass-card { background-color: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
      .stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; }
      .accent-purple { color: #8b5cf6; }
      .cta-button { background: linear-gradient(135deg, #8b5cf6 0%, #504dbb 100%); color: #ffffff !important; padding: 14px 36px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: 700; font-size: 15px; box-shadow: 0 8px 20px rgba(80,77,187,0.4); }
      @media screen and (max-width: 600px) {
        .container { width: 100% !important; max-width: 100% !important; }
        .content-padding { padding: 16px !important; }
        .stat-col { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0;">
    <center>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(to top right, #05203e 10%, #000 70%, #2c2041 100%);">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;" class="container">

              <!-- ── Header ── -->
              <tr>
                <td align="center" style="padding: 48px 0 16px 0;">
                  <img src="https://res.cloudinary.com/digbazqis/image/upload/v1777061000/sy3rl84kbmgh0sfuqz3r_elfe7x.webp"
                    width="64" height="64" alt="VTS Logo" style="border-radius:14px;" />
                  <h1 style="margin:14px 0 0 0; font-size:19px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#ffffff;">
                    Virtual Trade <span class="accent-purple">Sandbox</span>
                  </h1>
                  <p style="margin:6px 0 0 0; color:#a1a1aa; font-size:13px;">Weekly Performance Report</p>
                </td>
              </tr>

              <!-- ── Greeting ── -->
              <tr>
                <td class="content-padding" style="padding: 12px 28px 24px 28px;">
                  <div class="glass-card" style="padding: 24px 28px;">
                    <h2 style="margin:0 0 6px 0; font-size:24px; font-weight:800; color:#ffffff;">
                      Hey ${(userName || "Trader").toUpperCase()} 👋
                    </h2>
                    <p style="margin:0; color:#a1a1aa; font-size:14px; line-height:22px;">
                      Here's your trading performance snapshot for the week of <strong style="color:#e2e8f0;">${weekRange}</strong>.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- ── Portfolio Overview Stats ── -->
              <tr>
                <td class="content-padding" style="padding: 0 28px 24px 28px;">
                  <h3 style="margin:0 0 14px 0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#8b5cf6;">
                    Portfolio Overview
                  </h3>
                  <!-- Row 1: Net Worth + Available Cash -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
                    <tr>
                      <td width="48%" class="stat-col" valign="top" style="padding-right:8px;">
                        <div class="stat-card">
                          <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#6b7280;">Net Worth</p>
                          <p style="margin:0; font-size:26px; font-weight:900; color:#22c55e; letter-spacing:-0.5px;">
                            ₹${fmt(netWorth)}
                          </p>
                          <p style="margin:6px 0 0 0; font-size:12px; color:#6b7280;">${positionsCount} open position${positionsCount !== 1 ? "s" : ""}</p>
                        </div>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" class="stat-col" valign="top">
                        <div class="stat-card">
                          <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#6b7280;">Available Cash</p>
                          <p style="margin:0; font-size:26px; font-weight:900; color:#e2e8f0; letter-spacing:-0.5px;">
                            ₹${fmt(currentFunds)}
                          </p>
                          <p style="margin:6px 0 0 0; font-size:12px; color:#6b7280;">Invested: ₹${fmt(totalInvested)}</p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Row 2: Current Value + Unrealized PnL -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
                    <tr>
                      <td width="48%" class="stat-col" valign="top" style="padding-right:8px;">
                        <div class="stat-card">
                          <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#6b7280;">Current Value</p>
                          <p style="margin:0; font-size:22px; font-weight:800; color:#e2e8f0; letter-spacing:-0.5px;">
                            ₹${fmt(totalCurrentValue)}
                          </p>
                        </div>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" class="stat-col" valign="top">
                        <div class="stat-card">
                          <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#6b7280;">Unrealized P&amp;L</p>
                          <p style="margin:0; font-size:22px; font-weight:800; color:${pnlColor(unrealizedPnl)}; letter-spacing:-0.5px;">
                            ${pnlArrow(unrealizedPnl)} ₹${fmt(unrealizedPnl)}
                          </p>
                          <p style="margin:4px 0 0 0; font-size:12px; color:${pnlColor(unrealizedPnl)};">${unrealizedPnlPercent}%</p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Row 3: Realized PnL full-width -->
                  <div class="stat-card">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="middle">
                          <p style="margin:0 0 2px 0; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#6b7280;">Realized P&amp;L (Overall)</p>
                          <p style="margin:0; font-size:24px; font-weight:900; color:${pnlColor(overallPnl)}; letter-spacing:-0.5px;">
                            ${pnlArrow(overallPnl)} ₹${fmt(overallPnl)}
                          </p>
                        </td>
                        <td valign="middle" align="right">
                          <span style="display:inline-block; background:${overallPnl >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}; border:1px solid ${overallPnl >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}; color:${pnlColor(overallPnl)}; font-size:13px; font-weight:700; padding:8px 16px; border-radius:50px;">
                            ${pnlArrow(overallPnl)} ${overallPnlPercent}%
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- ── AI Gemini Summary ── -->
              <tr>
                <td class="content-padding" style="padding: 0 28px 24px 28px;">
                  <div style="background: linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%); border: 1px solid rgba(139,92,246,0.3); border-radius: 16px; padding: 22px 24px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" width="32" style="padding-right:12px;">
                          <div style="width:32px; height:32px; background:linear-gradient(135deg,#8b5cf6,#6366f1); border-radius:8px; text-align:center; line-height:32px; font-size:16px;">✨</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0 0 8px 0; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#8b5cf6;">AI Weekly Insight</p>
                          <p style="margin:0; color:#d1d5db; font-size:14px; line-height:22px;">${aiSummaryText}</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- ── Bar Chart: Last 10 Trades P&L ── -->
              <tr>
                <td class="content-padding" style="padding: 0 28px 24px 28px;">
                  <h3 style="margin:0 0 14px 0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#8b5cf6;">
                    Trade P&amp;L Trend
                  </h3>
                  <div class="glass-card" style="padding:16px; overflow:hidden; text-align:center;">
                    ${
                      pnlTrades.length > 0
                        ? `<img src="${barChartUrl}" width="540" style="width:100%; border-radius:10px;" alt="P&L Bar Chart" />`
                        : `<p style="color:#a1a1aa; font-size:14px; padding:40px 0;">No trade data available for this period</p>`
                    }
                  </div>
                </td>
              </tr>

              <!-- ── Pie Chart: Portfolio Distribution ── -->
              <tr>
                <td class="content-padding" style="padding: 0 28px 24px 28px;">
                  <h3 style="margin:0 0 14px 0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#8b5cf6;">
                    Portfolio Distribution
                  </h3>
                  <div class="glass-card" style="padding:16px; overflow:hidden; text-align:center;">
                    ${
                      distData.length > 0
                        ? `<img src="${pieChartUrl}" width="400" style="max-width:100%; border-radius:10px;" alt="Portfolio Distribution Pie Chart" />`
                        : `<p style="color:#a1a1aa; font-size:14px; padding:40px 0;">No open holdings to display</p>`
                    }
                  </div>
                </td>
              </tr>

              <!-- ── Top Performing Trades Table ── -->
              <tr>
                <td class="content-padding" style="padding: 0 28px 24px 28px;">
                  <h3 style="margin:0 0 14px 0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#8b5cf6;">
                    Top Performing Trades
                  </h3>
                  <div class="glass-card" style="overflow:hidden;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr style="background: rgba(139,92,246,0.1);">
                        <th style="padding:12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b5cf6;">Stock</th>
                        <th style="padding:12px; text-align:center; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b5cf6;">Trades</th>
                        <th style="padding:12px; text-align:right; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b5cf6;">Profit</th>
                        <th style="padding:12px; text-align:right; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b5cf6;">%</th>
                      </tr>
                      ${topTradesRows}
                    </table>
                  </div>
                </td>
              </tr>

              <!-- ── Most Traded Stocks Table ── -->
              <tr>
                <td class="content-padding" style="padding: 0 28px 24px 28px;">
                  <h3 style="margin:0 0 14px 0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#8b5cf6;">
                    Most Traded Stocks
                  </h3>
                  <div class="glass-card" style="overflow:hidden;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr style="background: rgba(139,92,246,0.1);">
                        <th style="padding:12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b5cf6;">#</th>
                        <th style="padding:12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b5cf6;">Stock</th>
                        <th style="padding:12px; text-align:right; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b5cf6;">Activity</th>
                      </tr>
                      ${mostTradedRows}
                    </table>
                  </div>
                </td>
              </tr>

              <!-- ── CTA ── -->
              <tr>
                <td align="center" class="content-padding" style="padding: 8px 28px 52px 28px;">
                  <a href="${process.env.FRONTEND_URL || "https://yourapp.com"}/app/analytics" class="cta-button">
                    View Full Analytics →
                  </a>
                  <p style="color:#6b7280; font-size:12px; margin-top:16px;">
                    Keep learning. Keep trading. Zero risk, maximum growth.
                  </p>
                </td>
              </tr>

              <!-- ── Footer ── -->
              <tr>
                <td align="center" style="padding: 32px 28px; border-top: 1px solid rgba(255,255,255,0.08);">
                  <p style="color:#6b7280; font-size:12px; margin:0 0 8px 0;">
                    You're receiving this because weekly reports are enabled in your preferences.
                  </p>
                  <p style="font-weight:700; margin:0; font-size:14px; color:#ffffff;">Team Virtual Trade Sandbox</p>
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

export default weeklyReportMail;
