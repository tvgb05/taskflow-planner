import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

function where(command) {
  const result = spawnSync("where.exe", [command], {
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

const php = findPhp();
const composer = findComposer();

if (!composer) {
  console.error("Composer was not found. Install Composer or run the local Composer installer.");
  process.exit(1);
}

const args = process.argv.slice(2);
const command = composer.endsWith(".phar")
  ? { bin: php, args: [composer, ...args] }
  : { bin: composer, args };

if (!command.bin) {
  console.error("PHP was not found, so the Composer PHAR cannot run.");
  process.exit(1);
}

const child = spawn(command.bin, command.args, {
  stdio: "inherit",
  shell: composer.endsWith(".bat"),
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
