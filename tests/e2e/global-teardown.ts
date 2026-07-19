import { readFile, rm } from "node:fs/promises";
import path from "node:path";

const workerPidFile = path.join(process.cwd(), "test-results", "worker.pid");

export default async function globalTeardown() {
  let pid: number | undefined;

  try {
    const state = JSON.parse(await readFile(workerPidFile, "utf8")) as {
      pid?: number;
    };
    pid = state.pid;
  } catch {
    return;
  }

  if (typeof pid !== "number") {
    return;
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch (error) {
    if (!isMissingProcessError(error)) {
      throw error;
    }
  }

  await waitForExit(pid);
  await rm(workerPidFile, { force: true });
}

async function waitForExit(pid: number) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      process.kill(-pid, 0);
    } catch (error) {
      if (isMissingProcessError(error)) {
        return;
      }

      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  try {
    process.kill(-pid, "SIGKILL");
  } catch (error) {
    if (!isMissingProcessError(error)) {
      throw error;
    }
  }
}

function isMissingProcessError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ESRCH"
  );
}
