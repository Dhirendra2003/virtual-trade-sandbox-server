import moment from "moment";
import User from "../../models/User.js";
import { getLTP } from "../../services/upstox.service.js";
import dbManager from "../../config/DatabaseManager.js";
import { sendEmail } from "../../services/mailService.js";
import weeklyReportMail from "../../mailTemplates/weekly-report-mail.js";
import getGeminiResponse from "../../services/gemini.service.js";
import logger from "../../utils/errorLogger.js";

// ── Helper: build portfolio stats for a single user (mirrors getPortfolioStats) ──
const buildPortfolioStats = async (userId, userFunds, userActualFunds) => {
  try {
    const currentFunds = parseFloat(userFunds);
    const INITIAL_FUNDS = parseFloat(userActualFunds);

    const [trades] = await dbManager
      .getInstance()
      .query(`select * from get_user_open_trades_report(${userId})`);

    const intraday = trades[0].get_user_open_trades_report?.intraday || [];
    const delivery = trades[0].get_user_open_trades_report?.delivery || [];

    const allPositions = [...intraday, ...delivery];
    const uniqueKeys = [...new Set(allPositions.map((p) => p.instrument_key))];

    let ltpMap = {};
    if (uniqueKeys.length > 0) {
      const ltpData = await getLTP(uniqueKeys);
      if (ltpData?.data) {
        Object.values(ltpData.data).forEach((quote) => {
          ltpMap[quote.instrument_token] = quote.last_price;
        });
      }
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;

    allPositions.forEach((position) => {
      const ltp = ltpMap[position.instrument_key] || 0;
      const qty = parseFloat(position.qty) || 0;
      const investment = parseFloat(position.investment) || 0;
      const currentValue = qty * ltp;
      totalInvested += investment;
      totalCurrentValue += currentValue;
    });

    const unrealizedPnl = totalCurrentValue - totalInvested;
    const overallPnl = currentFunds + totalInvested - INITIAL_FUNDS;

    return {
      current_funds: parseFloat(currentFunds.toFixed(2)),
      total_invested: parseFloat(totalInvested.toFixed(2)),
      total_current_value: parseFloat(totalCurrentValue.toFixed(2)),
      unrealized_pnl: parseFloat(unrealizedPnl.toFixed(2)),
      overall_pnl: parseFloat(overallPnl.toFixed(2)),
      positions_count: allPositions.length,
    };
  } catch (err) {
    logger.error(
      `[WeeklyReport] buildPortfolioStats failed for user ${userId}:`,
      err,
    );
    return null;
  }
};

// ── Helper: build analytics data for a single user (mirrors getUserAnalytics) ──
const buildAnalyticsData = async (userId) => {
  try {
    const [trades] = await dbManager.getInstance().query(`
      SELECT sp_pnl_analytics(${userId});
      SELECT sp_trade_insights(${userId});
      SELECT sp_portfolio_distribution(${userId});
      SELECT sp_consistency_heatmap(${userId});
    `);

    return {
      pnl_bar_chart: trades[0].sp_pnl_analytics,
      trade_rankings_table: trades[1].sp_trade_insights,
      distribution_pie_chart: trades[2].sp_portfolio_distribution,
      consistency_heatmap: trades[3].sp_consistency_heatmap,
    };
  } catch (err) {
    logger.error(
      `[WeeklyReport] buildAnalyticsData failed for user ${userId}:`,
      err,
    );
    return null;
  }
};

// ── Helper: generate Gemini AI weekly summary for a user ──
const buildGeminiSummary = async (portfolioStats, analyticsData) => {
  try {
    const topTrades =
      analyticsData?.trade_rankings_table?.top_profit_amount?.slice(0, 3) ?? [];
    const mostTraded =
      analyticsData?.trade_rankings_table?.most_traded?.slice(0, 3) ?? [];

    const prompt = `
You are an expert trading coach analysing a week of virtual paper trading.

Portfolio snapshot:
- Net Worth: ₹${portfolioStats?.current_funds + portfolioStats?.total_invested}
- Available Cash: ₹${portfolioStats?.current_funds}
- Total Invested: ₹${portfolioStats?.total_invested}
- Unrealized P&L: ₹${portfolioStats?.unrealized_pnl}
- Realized P&L (overall): ₹${portfolioStats?.overall_pnl}
- Open Positions: ${portfolioStats?.positions_count}

Top performing trades this week: ${JSON.stringify(topTrades)}
Most traded stocks: ${JSON.stringify(mostTraded)}

Write a SHORT (3–5 sentences), encouraging, and actionable weekly summary for the trader. 
Highlight their strongest move, note any risk if overall P&L is negative, and give one concrete tip to improve next week.
Return a plain text string only — no JSON, no markdown, no bullet points.
    `.trim();

    const raw = await getGeminiResponse(prompt);
    // Gemini returns JSON string due to responseMimeType — try to parse
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") return parsed;
      if (typeof parsed?.summary === "string") return parsed.summary;
      if (typeof parsed?.text === "string") return parsed.text;
      return String(Object.values(parsed)[0] ?? raw);
    } catch {
      return raw?.trim() ?? "";
    }
  } catch (err) {
    logger.error("[WeeklyReport] Gemini summary failed:", err);
    return "Your trading journey continues! Review your trades this week and look for patterns — consistency is the key to long-term success.";
  }
};

// ── Main export ──────────────────────────────────────────────────────────────
export const sendWeeklyReports = async () => {
  // console.log("[WeeklyReport] Starting weekly report job...");

  // Week range label  e.g. "Apr 28 – May 2, 2026"
  const weekStart = moment().subtract(7, "days").format("MMM D");
  const weekEnd = moment().format("MMM D, YYYY");
  const weekRange = `${weekStart} – ${weekEnd}`;

  // Fetch all verified users who have weekly/monthly summary enabled
  const users = await User.findAll({
    attributes: ["id", "name", "email", "funds", "actualFunds", "preferences"],
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    // Respect user mail preferences — check monthlySummary flag
    const prefs = user.preferences ?? {};
    const mailsEnabled = prefs?.mailsPreference?.monthlySummary !== false;
    if (!mailsEnabled) {
      skipped++;
      continue;
    }

    try {
      logger.info(
        `[WeeklyReport] Processing user ${user.id} (${user.email})...`,
      );

      // 1. Portfolio stats
      const portfolioStats = await buildPortfolioStats(
        user.id,
        user.funds,
        user.actualFunds,
      );

      // 2. Analytics data
      const analyticsData = await buildAnalyticsData(user.id);

      // 3. Gemini AI summary
      const geminiSummary = await buildGeminiSummary(
        portfolioStats,
        analyticsData,
      );

      // 4. Render HTML
      const html = weeklyReportMail({
        userName: user.name,
        portfolioStats,
        analyticsData,
        geminiSummary,
        weekRange,
      });

      // 5. Send email
      await sendEmail(
        user.email,
        `📊 Your Weekly Trading Report — ${weekRange}`,
        `Weekly Trading Report for ${user.name} | ${weekRange}`,
        html,
      );

      sent++;
      logger.info(`[WeeklyReport] ✓ Sent to ${user.email}`);
    } catch (err) {
      failed++;
      logger.error(
        `[WeeklyReport] ✗ Failed for user ${user.id} (${user.email}):`,
        err,
      );
    }
  }

  logger.info(
    `[WeeklyReport] Done — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`,
  );
};
