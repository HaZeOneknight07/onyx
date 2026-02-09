import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;
const connection = redisUrl
  ? (() => {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 6379,
        password: url.password || undefined,
      };
    })()
  : {
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    };

export const chunkingQueue = new Queue("chunking", { connection });
export const embeddingsQueue = new Queue("embeddings", { connection });
export const urlFetchQueue = new Queue("url-fetch", { connection });
