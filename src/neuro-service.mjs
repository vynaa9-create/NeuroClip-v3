import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { HOME, APP_NAME, loadMemory, saveMemory, removeNotif, NOTIF_PENDING_ID, NOTIF_RESULT_ID, NOTIF_OCR_ID, wakeLock, wakeUnlock, toast } from "./core.mjs";

const APP_DIR = path.join(HOME, ".neuroclip");
const SRC_DIR = path.join(APP_DIR, "src");
const STATE_FILE = path.join(APP_DIR, "service-state.json");
const SUP_PID = path.join(APP_DIR, "supervisor.pid");
const CLIP_PID = path.join(APP_DIR, "clip-watch.pid");
const OCR_PID = path.join(APP_DIR, "ocr-watch.pid");
const LOG_FILE = path.join(HOME, "neuroclip.log");
const OCR_LOG_FILE = path.join(APP_DIR, "ss-watch.log");

function ensureDir() { fs.mkdirSync(APP_DIR, { recursive: true }); }
function readJson(file, fallback = {}) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJson(file, data) { ensureDir(); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function readPid(file) { try { const pid = Number(fs.readFileSync(file, "utf8").trim()); return Number.isFinite(pid) && pid > 0 ? pid : 0; } catch { return 0; } }
function remove(file) { try { fs.rmSync(file, { force: true }); } catch {} }
function alive(pid) { if (!pid) return false; try { process.kill(pid, 0); return true; } catch { return false; } }
function pgrep(pattern) {
  const r = spawnSync("pgrep", ["-f", pattern], { encoding: "utf8" });
  return String(r.stdout || "").split(/\s+/).map(x => Number(x.trim())).filter(Boolean).filter(pid => pid !== process.pid)[0] || 0;
}
function killPidFile(file) {
  const pid = readPid(file);
  if (pid && alive(pid)) {
    try { process.kill(pid, "SIGTERM"); } catch {}
    try { process.kill(-pid, "SIGTERM"); } catch {}
  }
  remove(file);
}
function clearFlow(reason = "service") {
  const mem = loadMemory();
  mem.active_flow = "idle";
  mem.ocr_pending = false;
  mem.clip_paused_until = 0;
  mem.clip_paused_reason = "";
  mem.last_flow_clear_reason = reason;
  mem.last_flow_update_at = Date.now();
  saveMemory(mem);
}
function serviceState() {
  return {
    clip_enabled: false,
    ocr_enabled: false,
    updated_at: Date.now(),
    ...readJson(STATE_FILE, {})
  };
}
function saveServiceState(next) { writeJson(STATE_FILE, { ...serviceState(), ...next, updated_at: Date.now() }); }
function supervisorPid() {
  let pid = readPid(SUP_PID);
  if (!alive(pid)) {
    pid = pgrep("supervisor.mjs");
    if (pid) fs.writeFileSync(SUP_PID, String(pid));
  }
  return alive(pid) ? pid : 0;
}
function ensureSupervisor() {
  ensureDir();
  const pid = supervisorPid();
  if (pid) return pid;
  const out = fs.openSync(LOG_FILE, "a");
  const child = spawn("node", [path.join(SRC_DIR, "supervisor.mjs")], {
    detached: true,
    stdio: ["ignore", out, out],
    env: process.env
  });
  child.unref();
  fs.writeFileSync(SUP_PID, String(child.pid));
  return child.pid;
}
function stopSupervisor() {
  killPidFile(SUP_PID);
  spawnSync("sh", ["-lc", "pkill -f 'supervisor.mjs' 2>/dev/null || true"], { encoding: "utf8" });
}
function stopWatchers() {
  killPidFile(CLIP_PID);
  killPidFile(OCR_PID);
  spawnSync("sh", ["-lc", "pkill -f 'watch-confirm.mjs' 2>/dev/null || true; pkill -f 'watch-screenshot.mjs' 2>/dev/null || true; pkill -f 'ss-watch.mjs' 2>/dev/null || true"], { encoding: "utf8" });
}
function watcherStatus(label, file, pattern) {
  let pid = readPid(file);
  if (!alive(pid)) {
    pid = pgrep(pattern);
    if (pid) fs.writeFileSync(file, String(pid));
  }
  return `${label.padEnd(5)}: ${alive(pid) ? "ON " : "OFF"}${pid ? ` pid=${pid}` : ""}`;
}
function showStatus() {
  const state = serviceState();
  const mem = loadMemory();
  const sup = supervisorPid();
  console.log(`\n${APP_NAME} Status`);
  console.log("----------------");
  console.log(`CORE : ${sup ? "ON " : "OFF"}${sup ? ` pid=${sup}` : ""}`);
  console.log(watcherStatus("CLIP", CLIP_PID, "watch-confirm.mjs"));
  console.log(watcherStatus("OCR", OCR_PID, "watch-screenshot.mjs"));
  console.log(`WANT : clip=${state.clip_enabled ? "on" : "off"} ocr=${state.ocr_enabled ? "on" : "off"}`);
  console.log(`FLOW : ${mem.active_flow || "idle"}`);
  console.log(`SRC  : ${mem.pending_source || "-"}`);
  console.log(`MODE : ${mem.active_mode || "default"}`);
  console.log("");
}

const cmd = String(process.argv[2] || "status").toLowerCase();

switch (cmd) {
  case "on":
  case "start":
    wakeLock();
    saveServiceState({ clip_enabled: true, ocr_enabled: true });
    console.log(`Supervisor PID: ${ensureSupervisor()}`);
    toast(`${APP_NAME} ON`);
    break;
  case "off":
  case "stop":
    saveServiceState({ clip_enabled: false, ocr_enabled: false });
    stopSupervisor();
    stopWatchers();
    clearFlow("neuro-off");
    removeNotif(NOTIF_PENDING_ID); removeNotif(NOTIF_RESULT_ID); removeNotif(NOTIF_OCR_ID);
    wakeUnlock();
    toast(`${APP_NAME} OFF`);
    console.log(`${APP_NAME} OFF`);
    break;
  case "restart":
    saveServiceState({ clip_enabled: true, ocr_enabled: true });
    stopSupervisor(); stopWatchers(); clearFlow("restart"); wakeLock();
    console.log(`Supervisor PID: ${ensureSupervisor()}`);
    break;
  case "clip-on":
  case "text-on":
    wakeLock(); saveServiceState({ clip_enabled: true }); console.log(`Supervisor PID: ${ensureSupervisor()}`); break;
  case "clip-off":
  case "text-off":
    saveServiceState({ clip_enabled: false }); killPidFile(CLIP_PID); spawnSync("sh", ["-lc", "pkill -f 'watch-confirm.mjs' 2>/dev/null || true"], { encoding: "utf8" }); console.log("CLIP OFF"); break;
  case "ocr-on":
  case "vision-on":
    wakeLock(); saveServiceState({ ocr_enabled: true }); console.log(`Supervisor PID: ${ensureSupervisor()}`); break;
  case "ocr-off":
  case "vision-off":
    saveServiceState({ ocr_enabled: false }); killPidFile(OCR_PID); spawnSync("sh", ["-lc", "pkill -f 'watch-screenshot.mjs' 2>/dev/null || true; pkill -f 'ss-watch.mjs' 2>/dev/null || true"], { encoding: "utf8" }); clearFlow("ocr-off"); console.log("OCR OFF"); break;
  case "clear-flow":
    clearFlow("manual-clear-flow"); showStatus(); break;
  case "status":
  case "clip-status":
  case "ocr-status":
    showStatus(); break;
  default:
    console.error(`Unknown service command: ${cmd}`);
    process.exit(1);
}
