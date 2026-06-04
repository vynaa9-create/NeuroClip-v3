import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import {
  HOME,
  APP_NAME,
  getClipboard,
  setClipboard,
  wakeLock,
  wakeUnlock,
  toast,
  askRouter,
  loadMemory,
  saveMemory,
  resetContext,
  normalizeMode,
  removeNotif,
  NOTIF_PENDING_ID,
  NOTIF_RESULT_ID,
  NOTIF_OCR_ID,
  markBotOutput
} from "./core.mjs";

const APP_DIR = path.join(HOME, ".neuroclip");
const CLIP_PID_FILE = path.join(APP_DIR, "clip-watch.pid");
const OCR_PID_FILE = path.join(APP_DIR, "ocr-watch.pid");
const CLIP_LOG_FILE = path.join(HOME, "neuroclip.log");
const OCR_LOG_FILE = path.join(APP_DIR, "ss-watch.log");

function ensureAppDir() {
  fs.mkdirSync(APP_DIR, { recursive: true });
}

function readPid(file) {
  try {
    const pid = Number(fs.readFileSync(file, "utf8").trim());
    return Number.isFinite(pid) && pid > 0 ? pid : 0;
  } catch {
    return 0;
  }
}

function writePid(file, pid) {
  ensureAppDir();
  fs.writeFileSync(file, String(pid));
}

function removePid(file) {
  try { fs.rmSync(file, { force: true }); } catch {}
}

function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function pgrep(script) {
  const r = spawnSync("pgrep", ["-f", script], { encoding: "utf8" });
  return String(r.stdout || "")
    .split(/\s+/)
    .map(x => Number(x.trim()))
    .filter(Boolean)
    .filter(pid => pid !== process.pid)[0] || 0;
}

function statusFor({ script, pidFile }) {
  let pid = readPid(pidFile);
  if (!isAlive(pid)) {
    pid = pgrep(script);
    if (pid) writePid(pidFile, pid);
  }
  return { on: isAlive(pid), pid };
}

function spawnWatchdog({ label, script, pidFile, logFile }) {
  ensureAppDir();
  const st = statusFor({ script, pidFile });
  if (st.on) return st.pid;

  const out = fs.openSync(logFile, "a");
  const command = `
echo "[WATCHDOG] ${label} started: $(date)"
while true; do
  echo "[WATCHDOG] starting ${script}: $(date)"
  node "$HOME/.neuroclip/src/${script}"
  code=$?
  echo "[WATCHDOG] ${script} exited code=$code: $(date)"
  sleep 2
done
`;

  const child = spawn("sh", ["-lc", command], {
    detached: true,
    stdio: ["ignore", out, out],
    env: process.env
  });

  child.unref();
  writePid(pidFile, child.pid);
  return child.pid;
}

function killWatchdog({ pidFile, script }) {
  const pid = readPid(pidFile);
  if (pid && isAlive(pid)) {
    try { process.kill(-pid, "SIGTERM"); }
    catch { try { process.kill(pid, "SIGTERM"); } catch {} }
  }

  removePid(pidFile);
  spawnSync("sh", ["-lc", `pkill -f '${script}' 2>/dev/null || true`], { encoding: "utf8" });
}

function startClip() {
  return spawnWatchdog({ label: "clip", script: "watch-confirm.mjs", pidFile: CLIP_PID_FILE, logFile: CLIP_LOG_FILE });
}

function startOcr() {
  return spawnWatchdog({ label: "ocr", script: "watch-screenshot.mjs", pidFile: OCR_PID_FILE, logFile: OCR_LOG_FILE });
}

function stopClip() {
  killWatchdog({ pidFile: CLIP_PID_FILE, script: "watch-confirm.mjs" });
}

function stopOcr() {
  killWatchdog({ pidFile: OCR_PID_FILE, script: "watch-screenshot.mjs" });
  spawnSync("sh", ["-lc", "pkill -f 'ss-watch.mjs' 2>/dev/null || true"], { encoding: "utf8" });
}

function clearFlow(reason = "cli") {
  const mem = loadMemory();
  mem.active_flow = "idle";
  mem.ocr_pending = false;
  mem.clip_paused_until = 0;
  mem.clip_paused_reason = "";
  mem.last_flow_clear_reason = reason;
  mem.last_flow_update_at = Date.now();
  saveMemory(mem);
}

function statusLine(label, script, pidFile) {
  const st = statusFor({ script, pidFile });
  return `${label.padEnd(5)}: ${st.on ? "ON " : "OFF"}${st.pid ? ` pid=${st.pid}` : ""}`;
}

function showStatus() {
  const mem = loadMemory();
  console.log("\nNeuroClip Status");
  console.log("----------------");
  console.log(statusLine("CLIP", "watch-confirm.mjs", CLIP_PID_FILE));
  console.log(statusLine("OCR", "watch-screenshot.mjs", OCR_PID_FILE));
  console.log(`FLOW : ${mem.active_flow || "idle"}`);
  console.log(`SRC  : ${mem.pending_source || "-"}`);
  console.log(`MODE : ${mem.active_mode || "default"}`);
  console.log("");
}

function runAction(file, args = []) {
  const res = spawnSync("node", [`${HOME}/.neuroclip/src/${file}`, ...args], {
    encoding: "utf8",
    stdio: "inherit"
  });
  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) process.exit(res.status);
}

function usage() {
  console.log(`${APP_NAME} CLI

Pakai:
  neuro on                 aktifkan Clip + OCR watcher
  neuro off                matikan Clip + OCR watcher
  neuro restart            restart semua watcher
  neuro status             cek status Clip/OCR/flow

Service:
  neuro clip-on            aktifkan clipboard watcher saja
  neuro clip-off           matikan clipboard watcher saja
  neuro ocr-on             aktifkan OCR watcher saja
  neuro ocr-off            matikan OCR watcher saja
  neuro clear-flow         reset state router OCR/clip

OCR:
  neuro ocr                proses screenshot terbaru sekali
  neuro ocr answer         jawab hasil OCR terakhir
  neuro ocr-log            lihat log OCR watcher

Clipboard:
  neuro clip               jawab isi clipboard sekali
  neuro run "teks"         jawab teks sekali
  neuro log                lihat log clipboard watcher

Mode:
  neuro mode               lihat mode aktif
  neuro mode form          mode Google Form
  neuro mode default       mode default
  neuro reset              reset konteks
  neuro reset full         reset semua memory

Notif actions:
  neuro answer             jawab pending text/OCR
  neuro reply "instruksi"  balas dengan instruksi manual
  neuro view               buka jawaban full
  neuro close              tutup notifikasi
  neuro doctor             cek dependency
`);
}

async function runOnce(text) {
  const input = String(text || getClipboard() || "").trim();
  if (!input) {
    console.log("Input kosong.");
    toast("Input kosong.");
    return;
  }

  const mem = loadMemory();
  const result = await askRouter({ mode: mem.active_mode || "default", question: input });
  markBotOutput(result.answer);
  setClipboard(result.answer);
  console.log(result.answer);
  toast("Jawaban masuk clipboard.");
}

function doctor() {
  const checks = [
    ["node", "pkg install nodejs -y"],
    ["termux-clipboard-get", "pkg install termux-api -y"],
    ["termux-clipboard-set", "pkg install termux-api -y"],
    ["termux-notification", "pkg install termux-api -y"],
    ["termux-dialog", "pkg install termux-api -y"],
    ["termux-open", "pkg install termux-api -y"],
    ["tesseract", "pkg install tesseract -y"]
  ];

  for (const [name, hint] of checks) {
    const ok = spawnSync("sh", ["-lc", `command -v ${name} >/dev/null 2>&1`]).status === 0;
    console.log(`${ok ? "OK" : "MISSING"} ${name}${ok ? "" : `  (${hint})`}`);
  }

  showStatus();
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const command = String(cmd || "help").toLowerCase();

  switch (command) {
    case "on":
    case "start": {
      wakeLock();
      const clipPid = startClip();
      const ocrPid = startOcr();
      toast("NeuroClip ON");
      console.log(`NeuroClip ON\nCLIP PID: ${clipPid}\nOCR PID: ${ocrPid}`);
      break;
    }

    case "off":
    case "stop":
      stopClip();
      stopOcr();
      clearFlow("neuro-off");
      removeNotif(NOTIF_PENDING_ID);
      removeNotif(NOTIF_RESULT_ID);
      removeNotif(NOTIF_OCR_ID);
      wakeUnlock();
      toast("NeuroClip OFF");
      console.log("NeuroClip OFF");
      break;

    case "restart":
      stopClip();
      stopOcr();
      clearFlow("restart");
      wakeLock();
      console.log(`CLIP PID: ${startClip()}`);
      console.log(`OCR PID: ${startOcr()}`);
      break;

    case "status":
      showStatus();
      break;

    case "clip-on":
    case "text-on":
      wakeLock();
      console.log(`CLIP PID: ${startClip()}`);
      break;

    case "clip-off":
    case "text-off":
      stopClip();
      console.log("CLIP OFF");
      break;

    case "ocr-on":
    case "vision-on":
      wakeLock();
      console.log(`OCR PID: ${startOcr()}`);
      break;

    case "ocr-off":
    case "vision-off":
      stopOcr();
      clearFlow("ocr-off");
      console.log("OCR OFF");
      break;

    case "clear-flow":
      clearFlow("manual-clear-flow");
      showStatus();
      break;

    case "log":
      spawnSync("tail", ["-f", CLIP_LOG_FILE], { encoding: "utf8", stdio: "inherit" });
      break;

    case "ocr-log":
    case "vision-log":
      spawnSync("tail", ["-f", OCR_LOG_FILE], { encoding: "utf8", stdio: "inherit" });
      break;

    case "text": {
      const sub = String(rest[0] || "status").toLowerCase();
      if (sub === "on" || sub === "start") { wakeLock(); console.log(`CLIP PID: ${startClip()}`); }
      else if (sub === "off" || sub === "stop") { stopClip(); console.log("CLIP OFF"); }
      else showStatus();
      break;
    }

    case "vision":
    case "screenshot": {
      const sub = String(rest[0] || "status").toLowerCase();
      if (sub === "on" || sub === "start") { wakeLock(); console.log(`OCR PID: ${startOcr()}`); }
      else if (sub === "off" || sub === "stop") { stopOcr(); clearFlow("ocr-off"); console.log("OCR OFF"); }
      else if (sub === "log") spawnSync("tail", ["-f", OCR_LOG_FILE], { encoding: "utf8", stdio: "inherit" });
      else showStatus();
      break;
    }

    case "ocr":
    case "scan": {
      const sub = String(rest[0] || "").toLowerCase();
      if (sub === "answer" || sub === "jawab") runAction("ocr-answer.mjs", rest.slice(1));
      else runAction("ocr-scan.mjs", rest);
      break;
    }

    case "doctor":
      doctor();
      break;

    case "reset": {
      const full = rest.join(" ").trim().toLowerCase() === "full";
      resetContext({ full });
      removeNotif(NOTIF_PENDING_ID);
      removeNotif(NOTIF_RESULT_ID);
      removeNotif(NOTIF_OCR_ID);
      toast(full ? "Memory full reset." : "Memory konteks dibersihkan.");
      console.log(full ? "Memory full reset." : "Memory konteks dibersihkan.");
      break;
    }

    case "mode": {
      const input = rest.join(" ").trim();
      const mem = loadMemory();
      if (!input) { console.log(mem.active_mode || "default"); return; }
      mem.active_mode = normalizeMode(input) || "default";
      saveMemory(mem);
      toast(`Mode aktif: ${mem.active_mode}`);
      console.log(`Mode aktif: ${mem.active_mode}`);
      break;
    }

    case "run":
      await runOnce(rest.join(" ").trim());
      break;

    case "clip":
      await runOnce("");
      break;

    case "answer":
    case "jawab":
      runAction("smart-answer.mjs", rest);
      break;

    case "reply":
    case "balas":
      runAction("reply.mjs", rest);
      break;

    case "reason":
    case "alasan":
      runAction("reason.mjs", rest);
      break;

    case "view":
    case "lihat":
      runAction("view.mjs", rest);
      break;

    case "close":
    case "tutup":
      runAction("close.mjs", rest);
      break;

    case "menu":
      runAction("menu.mjs", rest);
      break;

    case "commands":
    case "command":
    case "help":
    case "info":
    case "--help":
    case "-h":
    default:
      usage();
      break;
  }
}

main().catch(e => {
  console.error(e);
  toast(`NeuroClip error: ${e.message}`);
});
