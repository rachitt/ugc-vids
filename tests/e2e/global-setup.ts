import { spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const workerStateDir = path.join(process.cwd(), "test-results");
const workerPidFile = path.join(workerStateDir, "worker.pid");
const workerLogFile = path.join(workerStateDir, "worker.log");

export default async function globalSetup() {
  await mkdir(workerStateDir, { recursive: true });

  const logFd = openSync(workerLogFile, "a");
  const worker = spawn("npx", ["tsx", "worker/index.ts"], {
    cwd: process.cwd(),
    detached: true,
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgres://fastlane:fastlane@localhost:5433/fastlane",
      FASTLANE_FAKE_AI: process.env.FASTLANE_FAKE_AI ?? "1",
      FASTLANE_FAKE_SCRAPE: process.env.FASTLANE_FAKE_SCRAPE ?? "1",
      REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
      STORAGE_DRIVER: process.env.STORAGE_DRIVER ?? "local",
    },
    stdio: ["ignore", logFd, logFd],
  });
  closeSync(logFd);

  if (!worker.pid) {
    throw new Error("Could not start the render worker.");
  }

  await writeFile(workerPidFile, JSON.stringify({ pid: worker.pid }), "utf8");

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, 2_000);

    worker.once("exit", (code, signal) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Render worker exited during startup with code ${code ?? "null"} and signal ${
            signal ?? "null"
          }. See ${workerLogFile}.`,
        ),
      );
    });
  });

  worker.unref();
}
