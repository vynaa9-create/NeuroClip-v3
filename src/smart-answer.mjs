import { spawnSync } from "node:child_process";
import { loadMemory, getClipboard, toast } from "./core.mjs";

const HOME = process.env.HOME || "/data/data/com.termux/files/home";

function isInternalClipboard(clip, mem) {
  const raw = String(clip || "").trim();
  if (!raw) return true;
  return (
    raw === String(mem.last_internal_clip || "").trim() ||
    raw === String(mem.last_output_clip || "").trim() ||
    raw === String(mem.last_answer || "").trim() ||
    raw === String(mem.last_display || "").trim()
  );
}

function shouldUseOcr(mem) {
  const clip = String(getClipboard() || "").trim();
  const ocr = String(mem.ocr_clean_text || "").trim();
  const pending = String(mem.pending_text || "").trim();
  const source = String(mem.pending_source || "").toLowerCase();
  const flow = String(mem.active_flow || "").toLowerCase();

  const manualClip =
    clip.length >= 3 &&
    !isInternalClipboard(clip, mem) &&
    clip !== ocr &&
    clip !== pending;

  if (manualClip) return false;
  if ((flow === "ocr_pending" || source === "ocr") && ocr.length >= 3) return true;
  if (source === "ocr" && pending.length >= 3) return true;
  return false;
}

function run(file, args = []) {
  const res = spawnSync("node", [`${HOME}/.neuroclip/src/${file}`, ...args], {
    stdio: "inherit",
    encoding: "utf8"
  });
  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) process.exit(res.status);
}

try {
  const mem = loadMemory();
  run(shouldUseOcr(mem) ? "ocr-answer.mjs" : "answer.mjs");
} catch (e) {
  toast(`smart-answer error: ${e.message}`);
  console.error(e);
  process.exit(1);
}
