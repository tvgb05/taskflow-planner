import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const key = process.env.GEMINI_API_KEY ?? process.argv[2] ?? "";

if (!key.trim()) {
  console.error("Missing Gemini key.");
  console.error("PowerShell:");
  console.error('$env:GEMINI_API_KEY="your_key"; npm run api:set-gemini');
  process.exit(1);
}

const envPath = "apps/api/.env";
const current = readFileSync(envPath, "utf8");
const next = current.match(/^GEMINI_API_KEY=/m)
  ? current.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${key.trim()}`)
  : `${current.replace(/\s*$/, "\n")}GEMINI_API_KEY=${key.trim()}\n`;

writeFileSync(envPath, next);

const clear = spawnSync(
  process.execPath,
  ["scripts/php.mjs", "apps/api/artisan", "config:clear"],
  { stdio: "inherit" },
);

if (clear.status !== 0) {
  process.exit(clear.status ?? 1);
}

console.log("Gemini key saved to apps/api/.env and Laravel config cache cleared.");
console.log("Restart npm run dev if the API server was already running.");
