import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";

const checks = [];

function where(command) {
  try {
    const output = execFileSync("where.exe", [command], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.split(/\r?\n/).find(Boolean) ?? null;
  } catch {
    return null;
  }
}

function findPhp() {
  const candidates = [
    where("php"),
    "C:\\xampp\\php\\php.exe",
    "C:\\tools\\php\\php.exe",
    "C:\\php\\php.exe",
    "C:\\Program Files\\PHP\\php.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function findComposer() {
  const candidates = [
    where("composer"),
    "tools\\composer.phar",
    "C:\\ProgramData\\ComposerSetup\\bin\\composer.bat",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

async function apiReachable() {
  try {
    const response = await fetch("http://127.0.0.1:8000/up", {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function tcpReachable(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

checks.push(["apps/api/.env", existsSync("apps/api/.env")]);
checks.push(["apps/web/.env.local", existsSync("apps/web/.env.local")]);
checks.push(["apps/api/vendor", existsSync("apps/api/vendor")]);
checks.push(["PHP executable", Boolean(findPhp())]);
checks.push(["Composer executable", Boolean(findComposer())]);
checks.push(["MySQL 127.0.0.1:3306", await tcpReachable("127.0.0.1", 3306)]);
checks.push(["API http://127.0.0.1:8000/up", await apiReachable()]);

let failed = false;

for (const [label, ok] of checks) {
  const marker = ok ? "OK" : "MISSING";
  console.log(`${marker.padEnd(8)} ${label}`);
  failed ||= !ok;
}

if (failed) {
  console.log("");
  console.log("Fix order:");
  console.log("1. Install PHP 8.2+ and Composer, then reopen the terminal.");
  console.log("2. Start MySQL or run: npm run dev:db");
  console.log("3. Run: npm run api:composer -- install && npm run api:migrate");
  console.log("4. Run from repo root: npm run dev");
  process.exitCode = 1;
}
