import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

function fromPath() {
  const result = spawnSync("where.exe", ["php"], {
    encoding: "utf8",
    shell: false,
  });

  if (result.status === 0) {
    return result.stdout.split(/\r?\n/).find(Boolean);
  }

  return null;
}

function findPhp() {
  const candidates = [
    fromPath(),
    "C:\\xampp\\php\\php.exe",
    "C:\\tools\\php\\php.exe",
    "C:\\php\\php.exe",
    "C:\\Program Files\\PHP\\php.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

const php = findPhp();

if (!php) {
  console.error("PHP was not found. Install PHP or add it to PATH.");
  process.exit(1);
}

const child = spawn(php, process.argv.slice(2), {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
