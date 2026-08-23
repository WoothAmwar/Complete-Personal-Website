// Runs `next dev` and the mock backend (server.js) together, pointed at each other, so
// `npm run dev:mock` works with zero .env.local setup. Uses only built-in Node modules.

const { spawn } = require("child_process");
const path = require("path");

process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.MOCK_PORT || 5050}`;
process.env.NEXT_PUBLIC_USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH || "1";

const nextBin = path.join(__dirname, "..", "node_modules", ".bin", "next");

const mock = spawn("node", [path.join(__dirname, "server.js")], { stdio: "inherit", env: process.env });
const next = spawn(nextBin, ["dev"], { stdio: "inherit", env: process.env });

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  mock.kill();
  next.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
mock.on("exit", shutdown);
next.on("exit", shutdown);
