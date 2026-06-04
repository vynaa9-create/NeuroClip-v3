import { loadMemory, saveMemory, getClipboard } from "./core.mjs";

const cmd = process.argv[2] || "status";
const reason = process.argv[3] || cmd;
const now = Date.now();
const mem = loadMemory();

function printState() {
  console.log(JSON.stringify({
    active_flow: mem.active_flow || "idle",
    pending_source: mem.pending_source || "",
    ocr_pending: !!mem.ocr_pending,
    clip_paused_until: mem.clip_paused_until || 0,
    last_internal_clip_reason: mem.last_internal_clip_reason || ""
  }, null, 2));
}

switch (cmd) {
  case "ocr-pending":
    mem.active_flow = "ocr_pending";
    mem.pending_source = "ocr";
    mem.ocr_pending = true;
    mem.clip_paused_until = 0;
    mem.clip_paused_reason = "";
    mem.last_flow_update_at = now;
    break;

  case "clear":
  case "idle":
    mem.active_flow = "idle";
    mem.ocr_pending = false;
    mem.clip_paused_until = 0;
    mem.clip_paused_reason = "";
    mem.last_flow_clear_reason = reason;
    mem.last_flow_update_at = now;
    break;

  case "mark-internal-clip": {
    const clip = String(getClipboard() || "").trim();
    mem.last_internal_clip = clip;
    mem.last_internal_clip_reason = reason || "internal";
    mem.last_internal_clip_at = now;
    break;
  }

  case "status":
  default:
    printState();
    process.exit(0);
}

saveMemory(mem);
printState();
