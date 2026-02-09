import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/logger";
import { metricsMiddleware } from "./middleware/metrics";
import { authMiddleware, type AuthEnv } from "./middleware/auth";
import { projectScope } from "./middleware/project-scope";
import { healthRoutes } from "./routes/health";
import { metricsRoutes } from "./routes/metrics";
import { projectRoutes } from "./routes/projects";
import { documentRoutes } from "./routes/documents";
import { taskRoutes } from "./routes/tasks";
import { searchRoutes } from "./routes/search";
import { tokenRoutes } from "./routes/tokens";
import { sourceRoutes } from "./routes/sources";
import { relationRoutes } from "./routes/relations";
import { agentEventRoutes } from "./routes/agent-events";
import { realtimeRoutes } from "./routes/realtime";
import { contextRoutes } from "./routes/context";
import { ingestRoutes } from "./routes/ingest";
import { auth } from "./lib/auth";

const app = new Hono();

// Global middleware
const webOrigin =
  process.env.WEB_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:5173";
app.use("*", cors({ origin: webOrigin, credentials: true }));
app.use("*", requestLogger);
app.use("*", metricsMiddleware);
app.onError(errorHandler);

// Public routes
app.route("/", healthRoutes);
app.route("/", metricsRoutes);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Protected API routes
const api = new Hono<AuthEnv>();
api.use("*", authMiddleware);
api.use("/projects/:projectId/*", projectScope);
api.route("/projects", projectRoutes);
api.route("/projects/:projectId/docs", documentRoutes);
api.route("/projects/:projectId/tasks", taskRoutes);
api.route("/projects/:projectId/search", searchRoutes);
api.route("/projects/:projectId/sources", sourceRoutes);
api.route("/projects/:projectId/relations", relationRoutes);
api.route("/projects/:projectId/events", agentEventRoutes);
api.route("/projects/:projectId/realtime", realtimeRoutes);
api.route("/projects/:projectId/context", contextRoutes);
api.route("/projects/:projectId/ingest", ingestRoutes);
api.route("/tokens", tokenRoutes);

app.route("/api/v1", api);

export default app;
