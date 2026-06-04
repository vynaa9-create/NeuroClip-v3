import {
  loadMemory,
  saveMemory,
  setClipboard,
  callProvider,
  showResultNotification,
  toast,
  markBotOutput,
  cleanAnswer,
  toText,
  isBadAnswer
} from "./core.mjs";

function pickBestText(mem) {
  const candidates = [mem.ocr_clean_text, mem.pending_source === "ocr" ? mem.pending_text : "", mem.last_question]
    .map(x => String(x || "").trim())
    .filter(Boolean);
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0] || "";
}

async function askFinal(prompt) {
  // Route: claude dulu, lalu fallback. Tambah kimi sebelum chatgpt.
  const route = ["claude", "gemini", "kimi", "chatgpt"];
  let lastError = "";

  for (const provider of route) {
    try {
      const result = await callProvider(provider, prompt, "ocranswer");
      const raw = toText(result.answer);
      const answer = cleanAnswer(raw);

      if (
        answer &&
        answer.length >= 2 &&
        answer !== "[object Object]" &&
        !isBadAnswer(answer) &&
        !answer.toLowerCase().includes("silakan berikan input") &&
        !answer.toLowerCase().includes("saya akan memproses input") &&
        !answer.toLowerCase().includes("please provide") &&
        !answer.toLowerCase().includes("input tidak")
      ) {
        return { provider, answer };
      }

      lastError = `Bad answer from ${provider}: ${answer?.slice(0, 60)}`;
    } catch (e) {
      lastError = e?.message || String(e);
      console.log(`[ocr-answer] ${provider} error:`, lastError);
    }
  }

  throw new Error(`Semua provider gagal. Last: ${lastError}`);
}

function buildPrompt(text) {
  return `Jawab soal berikut secara langsung.

Aturan:
- Jangan membuka dengan perkenalan atau ucapan sapaan.
- Jangan minta input lagi atau bilang soal tidak lengkap.
- Jika formatnya Betul/Salah, jawab semua nomor dengan format "N. A. Betul" atau "N. B. Salah".
- Jika ada beberapa nomor, jawab SEMUA nomor yang terlihat.
- Jika pilihan ganda A/B/C/D, jawab huruf + isi opsi singkat.
- Jika ragu, gunakan pengetahuan umum terbaik.
- Output ringkas dan siap ditempel.

Teks soal:
${text}

Contoh format output Betul/Salah:
7. A. Betul
8. B. Salah
9. A. Betul

Contoh format output pilihan ganda:
1. C. Majapahit
2. A. 1945`;
}

async function main() {
  try {
    const startTime = Date.now();
    const mem = loadMemory();
    const direct = process.argv.slice(2).join(" ").trim();
    const text = direct || pickBestText(mem);

    if (!text || text.length < 3) {
      toast("Tidak ada hasil OCR pending.");
      console.log("Tidak ada hasil OCR pending.");
      return;
    }

    console.log("[ocr-answer] Solving:", text.slice(0, 80));

    const result = await askFinal(buildPrompt(text));

    // FIX: Check if state changed during processing
    const next = loadMemory();
    const stateChanged = next.last_flow_update_at > startTime + 500; // > 500ms change
    if (stateChanged) {
      console.log("[WARNING] State changed during OCR answer processing.");
    }

    next.active_flow = "idle";
    next.ocr_pending = false;
    next.clip_paused_until = 0;
    next.clip_paused_reason = "";
    next.pending_source = "ocr";
    next.ocr_clean_text = text;
    next.pending_text = text;
    next.last_question = text;
    next.last_answer = result.answer;
    next.last_display = result.answer;
    next.last_reason = "";
    next.last_provider = result.provider;
    next.last_mode = "ocranswer";
    saveMemory(next);

    markBotOutput(result.answer);
    setClipboard(result.answer);

    showResultNotification({
      status: true,
      mode: "ocranswer",
      provider: result.provider,
      answer: result.answer,
      display: result.answer,
      reason: ""
    });

    console.log(result.answer);
  } catch (e) {
    toast(`OCR answer error: ${e.message}`);
    console.log(e);
  }
}

main();
