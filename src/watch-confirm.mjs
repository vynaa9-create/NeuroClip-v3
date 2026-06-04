import {
  getClipboard,
  loadMemory,
  saveMemory,
  shouldIgnoreClipboard,
  showPendingNotification,
  notify,
  NOTIF_PENDING_ID,
  APP_NAME
} from "./core.mjs";

const INTERVAL_MS = Number(process.env.NEUROCLIP_INTERVAL || 1300);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTerminalCommand(text) {
  const lower = String(text || "").trim().toLowerCase();
  const cmds = [
    "$ ", "~/", "./", "curl ", "node ", "npm ", "pkg ", "apt ", "git ",
    "cp ", "mv ", "rm ", "mkdir ", "ls ", "cat ", "sed ", "awk ", "tail ",
    "grep ", "nano ", "vim ", "bash ", "sh ", "chmod ", "chown ", "nohup ",
    "pkill ", "pgrep ", "termux-clipboard", "termux-notification", "termux-dialog",
    "neuro ", "http://127.0.0.1"
  ];
  return cmds.some(c => lower.startsWith(c));
}

function isNewManualClip(clip, mem) {
  const raw = String(clip || "").trim();
  if (!raw) return false;
  if (raw === String(mem.ocr_clean_text || "").trim()) return false;
  if (raw === String(mem.last_internal_clip || "").trim()) return false;
  if (raw === String(mem.last_answer || "").trim()) return false;
  if (raw === String(mem.last_display || "").trim()) return false;
  if (raw === String(mem.last_output_clip || "").trim()) return false;
  return true;
}

async function main() {
  notify({
    id: NOTIF_PENDING_ID,
    title: `${APP_NAME} Watcher`,
    content: "Aktif. Salin teks atau ambil screenshot untuk menu AI.",
    buttons: []
  });

  console.log(`${APP_NAME} clip watcher aktif.`);

  while (true) {
    try {
      const mem = loadMemory();
      const clip = String(getClipboard() || "").trim();

      if (!shouldIgnoreClipboard(clip, mem)) {
        if (isTerminalCommand(clip)) {
          mem.last_clip_seen = clip;
          saveMemory(mem);
          console.log("[SKIP_CMD]", clip.slice(0, 80));
        } else if (isNewManualClip(clip, mem)) {
          mem.active_flow = "idle";
          mem.ocr_pending = false;
          mem.clip_paused_until = 0;
          mem.clip_paused_reason = "";
          mem.pending_source = "clip";
          mem.pending_text = clip;
          mem.last_clip_seen = clip;

          // Manual clip baru mengalahkan OCR lama.
          // Clear OCR context jika clipboard baru >= 3 chars
          // FIX: Changed from >= 10 to >= 3 for consistency with answer.mjs
          if (clip.length >= 3) {
            mem.ocr_clean_text = "";
            mem.ocr_raw_text = "";
            mem.ocr_type = "";
            mem.ocr_items = [];
          }

          mem.last_question = clip;
          mem.last_answer = "";
          mem.last_display = "";
          mem.last_reason = "";
          mem.last_provider = "";
          mem.last_mode = "";

          saveMemory(mem);
          showPendingNotification(clip);
          console.log("[PENDING_CLIP]", clip.slice(0, 120));
        }
      }
    } catch (e) {
      console.log("[WATCH ERROR]", e?.message || String(e));
    }

    await sleep(INTERVAL_MS);
  }
}

main();
