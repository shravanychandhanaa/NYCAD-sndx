import express from "express";
import { pool } from "../db.js";
import moment from "moment";

const router = express.Router();

// Helper to get current date in YYYY-MM-DD format
const getCurrentDate = () => moment().format("YYYY-MM-DD");

// Store daily stats for trend analysis
async function storeDailyStats() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const stats = await getCurrentStats(client);

    await client.query(
      "INSERT INTO driver_trends (date, total_drivers, by_borough) VALUES ($1, $2, $3::jsonb) ON CONFLICT (date) DO NOTHING",
      [getCurrentDate(), stats.totalActiveDrivers, JSON.stringify(stats.byBorough)]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error storing daily stats:", error);
  } finally {
    client.release();
  }
}

// Get current stats (reusable for both API and trend storage)
async function getCurrentStats(client = pool) {
  const totalQ = client.query("SELECT COUNT(*)::int AS total FROM drivers WHERE active = TRUE");

  const boroughQ = client.query(`
    WITH rows AS (
      SELECT 
        COALESCE(
          NULLIF(borough, ''),
          CASE 
            WHEN base_number LIKE 'B%' THEN 'Bronx'
            WHEN base_number LIKE 'K%' THEN 'Brooklyn'
            WHEN base_number LIKE 'M%' THEN 'Manhattan'
            WHEN base_number LIKE 'Q%' THEN 'Queens'
            WHEN base_number LIKE 'R%' THEN 'Staten Island'
            ELSE NULL
          END,
          'Unknown'
        ) AS borough
      FROM drivers
      WHERE active = TRUE
    )
    SELECT borough, COUNT(*)::int AS count
    FROM rows
    GROUP BY borough
    ORDER BY borough
  `);

  const lastUpdatedQ = client.query("SELECT MAX(updated_at) AS last_updated FROM drivers");

  const [totalResult, boroughResult, lastUpdatedResult] = await Promise.all([
    totalQ,
    boroughQ,
    lastUpdatedQ,
  ]);

  return {
    totalActiveDrivers: totalResult.rows[0]?.total || 0,
    byBorough: boroughResult.rows,
    lastUpdated: lastUpdatedResult.rows[0]?.last_updated || null,
  };
}

// Get historical trends (last 30 days)
async function getTrends() {
  const result = await pool.query(
    `SELECT date, total_drivers, by_borough 
     FROM driver_trends 
     WHERE date >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY date ASC`
  );

  return result.rows.map((row) => ({
    date: row.date,
    totalDrivers: row.total_drivers,
    byBorough:
      typeof row.by_borough === "string"
        ? JSON.parse(row.by_borough)
        : row.by_borough,
  }));
}

// Main stats endpoint
router.get("/", async (req, res) => {
  try {
    const [currentStats, trends] = await Promise.all([
      getCurrentStats(),
      getTrends(),
    ]);

    const today = getCurrentDate();
    const safeTrends =
      trends && trends.length > 0
        ? trends
        : [
            {
              date: today,
              totalDrivers: currentStats.totalActiveDrivers,
              byBorough: currentStats.byBorough,
            },
          ];

    storeDailyStats().catch(console.error);

    res.json({
      ...currentStats,
      trends: {
        daily: safeTrends,
        last30Days: {
          min: safeTrends.length > 0 ? Math.min(...safeTrends.map((t) => t.totalDrivers)) : 0,
          max: safeTrends.length > 0 ? Math.max(...safeTrends.map((t) => t.totalDrivers)) : 0,
          change:
            safeTrends.length > 1 && safeTrends[0].totalDrivers > 0
              ? (
                  ((safeTrends[safeTrends.length - 1].totalDrivers -
                    safeTrends[0].totalDrivers) /
                    safeTrends[0].totalDrivers) *
                  100
                ).toFixed(1)
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error in stats endpoint:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Separate endpoint for historical data
router.get("/history", async (req, res) => {
  try {
    const trends = await getTrends();
    res.json(trends);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    res.status(500).json({ error: "Failed to fetch historical data" });
  }
});

export default router;
