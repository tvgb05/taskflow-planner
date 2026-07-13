import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";

const host = process.env.DB_HOST ?? "127.0.0.1";
const port = Number(process.env.DB_PORT ?? 3306);
const xamppMysql = "C:\\xampp\\mysql\\bin\\mysqld.exe";
const xamppConfig = "C:\\xampp\\mysql\\bin\\my.ini";

function canConnect() {
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

if (await canConnect()) {
  console.log(`MySQL is already running at ${host}:${port}`);
  process.exit(0);
}

if (!existsSync(xamppMysql)) {
  console.error("MySQL is not running and XAMPP mysqld.exe was not found.");
  console.error("Start MySQL manually, then run npm run dev again.");
  process.exit(1);
}

console.log("Starting XAMPP MySQL");

const child = spawn(xamppMysql, [
  `--defaults-file=${xamppConfig}`,
  "--console",
], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
