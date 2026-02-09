import { OnyxClient } from "@onyx/sdk";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const API_URL = process.env.ONYX_API_URL ?? "http://localhost:3000";
const API_TOKEN = process.env.ONYX_API_TOKEN;

if (!API_TOKEN) {
  console.error("ONYX_API_TOKEN is required for perf test");
  process.exit(1);
}

const MAX_FILES = parseInt(process.env.PERF_MAX_FILES ?? "30", 10);
const MAX_FILE_BYTES = parseInt(process.env.PERF_MAX_FILE_BYTES ?? "20000", 10);
const DOC_COUNT = parseInt(process.env.PERF_DOC_COUNT ?? "20", 10);
const PROJECT_SLUG = process.env.PERF_PROJECT_SLUG ?? `perf-${Date.now()}`;
const PROJECT_NAME = process.env.PERF_PROJECT_NAME ?? "Perf Test Project";

const exts = new Set([".md", ".ts", ".tsx", ".html"]);
const ignoreDirs = new Set(["node_modules", ".git", "dist", "build", "coverage", "backups"]);

const root = path.resolve(import.meta.dir, "..");

function collectFiles(dir: string, out: string[]) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (out.length >= MAX_FILES) return;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (ignoreDirs.has(entry)) continue;
      collectFiles(full, out);
    } else if (stat.isFile()) {
      if (!exts.has(path.extname(entry))) continue;
      if (stat.size > MAX_FILE_BYTES) continue;
      out.push(full);
    }
  }
}

function nowMs() {
  return Date.now();
}

async function main() {
  const client = new OnyxClient({ baseUrl: API_URL, token: API_TOKEN });

  const files: string[] = [];
  collectFiles(root, files);
  const selected = files.slice(0, DOC_COUNT);

  const project = await client.createProject({
    slug: PROJECT_SLUG,
    name: PROJECT_NAME,
    description: "Auto-generated performance test project",
  });

  const timings: Record<string, number> = {};

  const docStart = nowMs();
  for (const filePath of selected) {
    const rel = path.relative(root, filePath);
    const content = readFileSync(filePath, "utf8");
    await client.createDocument(project.id, {
      title: rel,
      type: "doc",
      content: `# ${rel}\n\n${content}`,
      tags: ["perf", "real-world"],
    });
  }
  timings.createDocumentsMs = nowMs() - docStart;

  const queries = [
    "migration",
    "search",
    "chunk",
    "token",
    "auth",
    "worker",
  ];

  const searchStart = nowMs();
  for (const query of queries) {
    await client.search(project.id, { query, limit: 10 });
  }
  timings.searchMs = nowMs() - searchStart;

  const results = {
    projectId: project.id,
    projectSlug: project.slug,
    docCount: selected.length,
    queries: queries.length,
    timings,
    timestamp: new Date().toISOString(),
  };

  mkdirSync(path.join(root, "perf-results"), { recursive: true });
  const resultPath = path.join(
    root,
    "perf-results",
    `perf-${Date.now()}.json`
  );
  writeFileSync(resultPath, JSON.stringify(results, null, 2));

  console.log("Perf test complete:", results);
  console.log("Result written to", resultPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
