import app from "./app";
import { logger } from "@onyx/shared";

const port = parseInt(process.env.PORT || "3000");

logger.info({ port }, "Starting API server");

export default {
  port,
  fetch: app.fetch,
};
