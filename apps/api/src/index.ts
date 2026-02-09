import app from "./app";
import { logger } from "@onyx/shared";

const port = parseInt(process.env.PORT || "8088");

logger.info({ port }, "Starting API server");

export default {
  port,
  fetch: app.fetch,
};
