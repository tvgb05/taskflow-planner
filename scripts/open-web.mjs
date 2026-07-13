import { execFile } from "node:child_process";

const url = process.env.WEB_URL ?? "http://localhost:3000";
const healthUrl = process.env.WEB_HEALTH_URL ?? "http://127.0.0.1:3000";
const timeoutMs = Number(process.env.WEB_OPEN_TIMEOUT_MS ?? 60000);
const intervalMs = 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForWeb() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // Next.js is still starting.
    }

    await delay(intervalMs);
  }

  throw new Error(`Timed out waiting for ${healthUrl}`);
}

function openBrowser(targetUrl) {
  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", targetUrl]);
    return;
  }

  if (process.platform === "darwin") {
    execFile("open", [targetUrl]);
    return;
  }

  execFile("xdg-open", [targetUrl]);
}

try {
  console.log(`Waiting for web server at ${healthUrl}`);
  await waitForWeb();
  console.log(`Opening ${url}`);
  openBrowser(url);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
