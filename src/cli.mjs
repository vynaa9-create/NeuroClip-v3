const cmd = String(process.argv[2] || "help").toLowerCase();
const serviceCommands = new Set([
  "on", "start", "off", "stop", "restart", "status",
  "clip-on", "clip-off", "clip-status", "text-on", "text-off",
  "ocr-on", "ocr-off", "ocr-status", "vision-on", "vision-off",
  "clear-flow"
]);

if (serviceCommands.has(cmd)) {
  await import("./neuro-service.mjs");
} else {
  await import("./cli-base.mjs");
}
