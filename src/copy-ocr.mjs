import { loadMemory, saveMemory, setClipboard, toast, run } from "./core.mjs";

const mem = loadMemory();
const text = String(mem.ocr_clean_text || mem.pending_text || mem.last_question || "").trim();

if (!text) {
  toast("Belum ada teks OCR.");
  console.log("Belum ada teks OCR.");
  process.exit(1);
}

mem.last_internal_clip = text;
mem.last_internal_clip_reason = "ocr-copy";
mem.last_internal_clip_at = Date.now();
mem.active_flow = "idle";
mem.ocr_pending = false;
mem.clip_paused_until = 0;
mem.clip_paused_reason = "";
mem.last_flow_clear_reason = "ocr-copy";
saveMemory(mem);

setClipboard(text);
toast("Teks OCR disalin.");

try {
  run("termux-notification", [
    "--id", "8878",
    "--title", "NeuroClip",
    "--content", "Teks OCR disalin. Clip watcher tidak akan menjawab teks ini.",
    "--priority", "high"
  ]);
} catch {}

console.log(text);
