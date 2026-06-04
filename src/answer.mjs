import {
  getClipboard,
  setClipboard,
  loadMemory,
  saveMemory,
  callProvider,
  showResultNotification,
  toast,
  markBotOutput,
  cleanAnswer,
  toText,
  isBadAnswer
} from "./core.mjs";

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

function pickContext(mem, direct = "") {
  const manual = String(direct || "").trim();
  if (manual) return { text: manual, source: "direct" };

  const clip = String(getClipboard() || "").trim();
  const source = String(mem.pending_source || "").toLowerCase();
  const pending = String(mem.pending_text || "").trim();
  const lastQ = String(mem.last_question || "").trim();

  const isManualClip = clip.length >= 3 && !isInternalClipboard(clip, mem) && clip !== pending;
  if (isManualClip) return { text: clip, source: "clip" };
  if (source === "clip" && pending.length >= 3) return { text: pending, source: "clip" };
  if (pending.length >= 3) return { text: pending, source: source || "pending" };
  if (lastQ.length >= 3) return { text: lastQ, source: "last_question" };
  if (clip.length >= 3 && !isInternalClipboard(clip, mem)) return { text: clip, source: "clip" };
  return { text: "", source: "none" };
}

function buildPrompt(text) {
  return `TEKS UTAMA:
${text}

TUGAS:
Jawab langsung berdasarkan TEKS UTAMA di atas.

ATURAN:
- Jika teks berupa kata/istilah, jelaskan arti dan kegunaannya.
- Jika teks berupa kode, jelaskan fungsi kode dan kegunaannya.
- Jika teks berupa soal, jawab soalnya.
- Jangan bilang tidak ada teks jika TEKS UTAMA ada.
- Jangan memperkenalkan diri.
- Jawab singkat, jelas, dan natural.`;
}

async function ask(prompt, mode = "bahas") {
  const route = ["claude", "gemini", "kimi", "chatgpt"];
  let lastError = "";

  for (const provider of route) {
    try {
      const result = await callProvider(provider, prompt, mode);
      const answer = cleanAnswer(toText(result.answer));
      const low = answer.toLowerCase();

      if (
        answer &&
        answer !== "[object Object]" &&
        !isBadAnswer(answer) &&
        !low.includes("tidak ada teks") &&
        !low.includes("silakan pilih")
      ) {
        return { provider, answer };
      }

      lastError = `Bad answer from ${provider}`;
    } catch (e) {
      lastError = e?.message || String(e);
    }
  }

  throw new Error(`Semua provider gagal. Last: ${lastError}`);
}

async function main() {
  try {
    const startTime = Date.now();
    const mem = loadMemory();
    const picked = pickContext(mem);

    if (!picked.text) {
      toast("Tidak ada teks aktif.");
      console.log("Tidak ada teks aktif.");
      return;
    }

    const mode = mem.active_mode || "bahas";
    const result = await ask(buildPrompt(picked.text), mode);

    // FIX: Check if state changed significantly during processing
    const next = loadMemory();
    const stateChanged = next.last_flow_update_at > startTime + 500; // > 500ms change
    if (stateChanged && picked.text !== next.pending_text) {
      console.log("[WARNING] State changed during answer processing. Proceeding with original context.");
    }

    next.active_flow = "idle";
    next.ocr_pending = false;
    next.clip_paused_until = 0;
    next.clip_paused_reason = "";
    next.pending_source = picked.source;
    next.pending_text = picked.text;
    next.last_question = picked.text;
    next.last_answer = result.answer;
    next.last_display = result.answer;
    next.last_reason = "";
    next.last_provider = result.provider;
    next.last_mode = mode;
    saveMemory(next);

    markBotOutput(result.answer);
    setClipboard(result.answer);
    showResultNotification({ mode, provider: result.provider, answer: result.answer, display: result.answer });
    console.log(result.answer);
  } catch (e) {
    toast(`NeuroClip error: ${e.message}`);
    console.log(e);
  }
}

main();
