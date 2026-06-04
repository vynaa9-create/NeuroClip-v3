import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { HOME, APP_NAME, notify, NOTIF_PENDING_ID, loadMemory, saveMemory, removeNotif, NOTIF_OCR_ID } from "./core.mjs";

const APP_DIR = path.join(HOME, ".neuroclip");
const SRC_DIR = path.join(APP_DIR, "src");
const STATE_FILE = path.join(APP_DIR, "service-state.json");
const SUP_PID = path.join(APP_DIR, "supervisor.pid");
const CLIP_PID = path.join(APP_DIR, "clip-watch.pid");
const OCR_PID = path.join(APP_DIR, "ocr-watch.pid");
const LOG_FILE = path.join(HOME, "neuroclip.log");
const OCR_LOG_FILE = path.join(APP_DIR, "ss-watch.log");

let clipChild = null;
let ocrChild = null;

fs.mkdirSync(APP_DIR, { recursive: true });
fs.writeFileSync(SUP_PID, String(process.pid));

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); }
  catch { return { clip_enabled: true, ocr_enabled: true }; }
}
function alive(child) { return child && !child.killed && child.exitCode === null && child.signalCode === null; }
function start(name, script, pidFile, logFile) {
  const current = name === "clip" ? clipChild : ocrChild;
  if (alive(current)) return;
  const out = fs.openSync(logFile, "a");
  const child = spawn("node", [path.join(SRC_DIR, script)], {
    detached: true,
    stdio: ["ignore", out, out],
    env: process.env
  });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
  child.on("exit", () => { try { fs.rmSync(pidFile, { force: true }); } catch {} });
  if (name === "clip") clipChild = child;
  else ocrChild = child;
}
function stop(name, pidFile) {
  const child = name === "clip" ? clipChild : ocrChild;
  if (alive(child)) {
    try { process.kill(child.pid, "SIGTERM"); } catch {}
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
  }
  try { fs.rmSync(pidFile, { force: true }); } catch {}
  if (name === "clip") clipChild = null;
  else ocrChild = null;
}
function tick() {
  const st = readState();
  
  if (st.clip_enabled) {
    start("clip", "watch-confirm.mjs", CLIP_PID, LOG_FILE);
  } else {
    stop("clip", CLIP_PID);
  }
  
  if (st.ocr_enabled) {
    start("ocr", "watch-screenshot.mjs", OCR_PID, OCR_LOG_FILE);
  } else {
    stop("ocr", OCR_PID);
    
    // FIX: Clear OCR pending state when OCR watcher is disabled/stopped
    try {
      const mem = loadMemory();
      if (mem.ocr_pending || mem.active_flow === "ocr_pending") {
        console.log("[SUPERVISOR] Clearing OCR pending state on watcher stop");
        mem.ocr_pending = false;
        mem.active_flow = "idle";
        mem.pending_source = "clip";
        mem.last_flow_clear_reason = "supervisor-watcher-stop";
        mem.last_flow_update_at = Date.now();
        saveMemory(mem);
        removeNotif(NOTIF_OCR_ID);
      }
    } catch (e) {
      console.log("[SUPERVISOR] Error clearing OCR state:", e?.message);
    }
  }
}

notify({ id: NOTIF_PENDING_ID, title: `${APP_NAME} Aktif`, content: "Service controller aktif. Clip/OCR dikontrol dari neuro on/off/status.", buttons: [] });
console.log(`[SUPERVISOR] ${APP_NAME} started pid=${process.pid}`);
setInterval(tick, 2500);
tick();

process.on("SIGTERM", () => { stop("clip", CLIP_PID); stop("ocr", OCR_PID); process.exit(0); });
process.on("SIGINT", () => { stop("clip", CLIP_PID); stop("ocr", OCR_PID); process.exit(0); });
