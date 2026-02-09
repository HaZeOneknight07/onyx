import { Hono } from "hono";

export const healthRoutes = new Hono().get("/health", (c) => {
  return c.json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
