#!/usr/bin/env bun
/**
 * Unified launcher for Docker infrastructure + all Onyx services.
 *
 * Usage:
 *   bun run app:full --dev         # docker-compose up (infra) + dev services with watch
 *   bun run app:full --production  # docker-compose.deploy up (infra + apps) + build + start
 */

const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isProd = args.includes("--production");

if (!isDev && !isProd) {
  console.error("Usage: bun run app:full --dev | --production");
  process.exit(1);
}

if (isDev && isProd) {
  console.error("Cannot specify both --dev and --production");
  process.exit(1);
}

const root = new URL("..", import.meta.url).pathname;

interface Service {
  name: string;
  cwd: string;
  cmd: string[];
}

function devServices(): Service[] {
  return [
    {
      name: "api",
      cwd: `${root}apps/api`,
      cmd: ["bun", "--env-file=../../.env", "run", "--watch", "src/index.ts"],
    },
    {
      name: "worker",
      cwd: `${root}apps/worker`,
      cmd: ["bun", "--env-file=../../.env", "run", "--watch", "src/index.ts"],
    },
    {
      name: "web",
      cwd: `${root}apps/web`,
      cmd: ["bunx", "vite"],
    },
    {
      name: "mcp",
      cwd: `${root}apps/mcp`,
      cmd: ["bun", "--env-file=../../.env", "run", "src/index.ts"],
    },
  ];
}

function prodServices(): Service[] {
  return [
    {
      name: "api",
      cwd: `${root}apps/api`,
      cmd: ["bun", "--env-file=../../.env", "run", "dist/index.js"],
    },
    {
      name: "worker",
      cwd: `${root}apps/worker`,
      cmd: ["bun", "--env-file=../../.env", "run", "dist/index.js"],
    },
    {
      name: "web",
      cwd: `${root}apps/web`,
      cmd: ["bunx", "vite", "preview"],
    },
    {
      name: "mcp",
      cwd: `${root}apps/mcp`,
      cmd: ["bun", "--env-file=../../.env", "run", "dist/index.js"],
    },
  ];
}

const COLORS: Record<string, string> = {
  docker: "\x1b[34m",  // blue
  api: "\x1b[36m",     // cyan
  worker: "\x1b[33m",  // yellow
  web: "\x1b[35m",     // magenta
  mcp: "\x1b[32m",     // green
};
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function prefix(name: string, line: string): string {
  const color = COLORS[name] ?? "";
  const padded = name.padEnd(7);
  return `${color}[${padded}]${RESET} ${line}`;
}

function pipeOutput(name: string, stream: ReadableStream<Uint8Array>, target: "stdout" | "stderr") {
  const write = target === "stdout" ? console.log : console.error;
  (async () => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) {
        write(prefix(name, line));
      }
    }
    if (buffer) write(prefix(name, buffer));
  })();
}

function spawnService(svc: Service): Bun.Subprocess {
  const proc = Bun.spawn(svc.cmd, {
    cwd: svc.cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  pipeOutput(svc.name, proc.stdout, "stdout");
  pipeOutput(svc.name, proc.stderr, "stderr");

  return proc;
}

/** Start Docker Compose and wait for health checks to pass. */
async function startDocker(): Promise<void> {
  const composeFile = isDev ? "docker-compose.yml" : "docker-compose.deploy.yml";
  console.log(prefix("docker", `starting ${composeFile}...`));

  const up = Bun.spawn(
    ["docker", "compose", "-f", composeFile, "up", "-d", "--wait"],
    {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  pipeOutput("docker", up.stdout, "stdout");
  pipeOutput("docker", up.stderr, "stderr");

  const exitCode = await up.exited;
  if (exitCode !== 0) {
    console.error(prefix("docker", `docker compose up failed (exit ${exitCode})`));
    process.exit(exitCode);
  }
  console.log(prefix("docker", "all containers healthy\n"));
}

/** Run DB migrations after Docker is ready (dev only — deploy compose handles its own). */
async function runMigrations(): Promise<void> {
  console.log(prefix("docker", "running database migrations..."));
  const migrate = Bun.spawn(["bun", "run", "db:push"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });

  pipeOutput("docker", migrate.stdout, "stdout");
  pipeOutput("docker", migrate.stderr, "stderr");

  const exitCode = await migrate.exited;
  if (exitCode !== 0) {
    console.error(prefix("docker", `db:push failed (exit ${exitCode})`));
    process.exit(exitCode);
  }
  console.log(prefix("docker", "migrations complete\n"));
}

/** Stop Docker Compose containers. */
async function stopDocker(): Promise<void> {
  const composeFile = isDev ? "docker-compose.yml" : "docker-compose.deploy.yml";
  console.log(prefix("docker", `stopping ${composeFile}...`));
  const down = Bun.spawn(["docker", "compose", "-f", composeFile, "down"], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  await down.exited;
}

async function main() {
  const mode = isDev ? "development" : "production";
  console.log(`${BOLD}Starting all services in ${mode} mode${RESET}\n`);

  // 1. Start Docker infrastructure
  await startDocker();

  // 2. Run DB migrations (dev only — prod containers handle their own setup)
  if (isDev) {
    await runMigrations();
  }

  // 3. Build workspaces (production only)
  if (isProd) {
    console.log(`${BOLD}Building all workspaces...${RESET}\n`);
    const build = Bun.spawn(["bun", "run", "build"], {
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    });
    const exitCode = await build.exited;
    if (exitCode !== 0) {
      console.error("\nBuild failed. Aborting.");
      process.exit(exitCode);
    }
    console.log(`\n${BOLD}Build complete. Starting services...${RESET}\n`);
  }

  // 4. Start application services
  const services = isDev ? devServices() : prodServices();
  const procs = services.map((svc) => {
    console.log(prefix(svc.name, `starting (${mode})...`));
    return { svc, proc: spawnService(svc) };
  });

  console.log("");

  // 5. Graceful shutdown — stop app processes then Docker
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n${BOLD}Shutting down all services...${RESET}`);
    for (const { svc, proc } of procs) {
      console.log(prefix(svc.name, "stopping..."));
      proc.kill("SIGTERM");
    }

    // Give processes 5s to exit gracefully
    setTimeout(() => {
      for (const { proc } of procs) {
        try { proc.kill("SIGKILL"); } catch {}
      }
    }, 5000);

    // Wait for all app processes to exit
    await Promise.allSettled(procs.map(({ proc }) => proc.exited));

    // Stop Docker containers
    await stopDocker();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Wait for all processes — if any exits unexpectedly, log it
  await Promise.all(
    procs.map(async ({ svc, proc }) => {
      const code = await proc.exited;
      console.log(prefix(svc.name, `exited with code ${code}`));
    })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
