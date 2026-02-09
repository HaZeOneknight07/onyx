import type { MiddlewareHandler } from "hono";

const startTimeMs = Date.now();
let requestCount = 0;
let errorCount = 0;
let durationSumMs = 0;
const statusCounts = new Map<number, number>();

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  try {
    await next();
  } catch (err) {
    errorCount += 1;
    throw err;
  } finally {
    const duration = Date.now() - start;
    durationSumMs += duration;
    requestCount += 1;
    const status = c.res?.status ?? 500;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }
};

export function getMetricsSnapshot() {
  return {
    startTimeMs,
    requestCount,
    errorCount,
    durationSumMs,
    statusCounts: new Map(statusCounts),
  };
}
