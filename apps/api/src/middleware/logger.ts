import { logger as honoLogger } from "hono/logger";
import { logger } from "@onyx/shared";

export const requestLogger = honoLogger((message, ...rest) => {
  logger.info({ rest }, message);
});
