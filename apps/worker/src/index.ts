import { Worker } from "bullmq";
import { logger } from "@onyx/shared";
import { processChunking } from "./processors/chunking";
import { processEmbeddings } from "./processors/embeddings";
import { processUrlFetch } from "./processors/url-fetch";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
};

const chunkingWorker = new Worker("chunking", processChunking, { connection });
const embeddingsWorker = new Worker("embeddings", processEmbeddings, { connection });
const urlFetchWorker = new Worker("url-fetch", processUrlFetch, { connection });

const workers = [chunkingWorker, embeddingsWorker, urlFetchWorker];

logger.info("Workers ready: chunking, embeddings, url-fetch");

async function shutdown() {
  logger.info("Shutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
