import { Hono } from "hono";
import { getMetricsSnapshot } from "../middleware/metrics";

export const metricsRoutes = new Hono().get("/metrics", (c) => {
  const { startTimeMs, requestCount, errorCount, durationSumMs, statusCounts } =
    getMetricsSnapshot();

  const uptimeSeconds = Math.floor((Date.now() - startTimeMs) / 1000);

  const lines: string[] = [];
  lines.push("# HELP onyx_uptime_seconds Uptime in seconds");
  lines.push("# TYPE onyx_uptime_seconds gauge");
  lines.push(`onyx_uptime_seconds ${uptimeSeconds}`);

  lines.push("# HELP onyx_http_requests_total Total HTTP requests");
  lines.push("# TYPE onyx_http_requests_total counter");
  lines.push(`onyx_http_requests_total ${requestCount}`);

  lines.push("# HELP onyx_http_errors_total Total HTTP errors");
  lines.push("# TYPE onyx_http_errors_total counter");
  lines.push(`onyx_http_errors_total ${errorCount}`);

  lines.push("# HELP onyx_http_request_duration_ms_sum Sum of request durations in ms");
  lines.push("# TYPE onyx_http_request_duration_ms_sum counter");
  lines.push(`onyx_http_request_duration_ms_sum ${durationSumMs}`);

  lines.push("# HELP onyx_http_request_duration_ms_count Count of request durations");
  lines.push("# TYPE onyx_http_request_duration_ms_count counter");
  lines.push(`onyx_http_request_duration_ms_count ${requestCount}`);

  lines.push("# HELP onyx_http_responses_total Total HTTP responses by status code");
  lines.push("# TYPE onyx_http_responses_total counter");
  for (const [status, count] of statusCounts.entries()) {
    lines.push(`onyx_http_responses_total{status=\"${status}\"} ${count}`);
  }

  return c.text(lines.join("\n"));
});
