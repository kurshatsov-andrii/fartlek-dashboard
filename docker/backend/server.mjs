/**
 * Легкий сервіс у Docker Compose для маршрутизації через NGINX
 * (перевірка БД та шаблон окремого бекенду).
 * Основні API проєкту залишаються в Next.js: префікс /api/.
 */
import express from "express";
import pg from "pg";

const app = express();
const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

app.get("/health", async (_req, res) => {
  let db = "not_configured";
  if (pool) {
    try {
      await pool.query("SELECT 1 AS ok");
      db = "up";
    } catch {
      db = "down";
    }
  }

  res.json({
    ok: true,
    service: "fartlek-docker-backend",
    database: db,
  });
});

app.get("/health/ready", async (_req, res) => {
  if (!pool) {
    return res.status(503).json({
      ok: false,
      reason: "DATABASE_URL is not set",
    });
  }
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(503).json({ ok: false, error: message });
  }
});

const port = Number.parseInt(process.env.PORT ?? "4000", 10) || 4000;
const host = process.env.HOST ?? "0.0.0.0";

app.listen(port, host, () => {
  console.log(`[backend] http://${host}:${port}`);
});
