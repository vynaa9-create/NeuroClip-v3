import {
  loadMemory,
  saveMemory,
  askRouter,
  parseJsonObject,
  cleanAnswer,
  showOcrNotification,
  toast
} from "./core.mjs";
import {
  findLatestScreenshot,
  fileExists,
  runTesseract,
  normalizeOcrText,
  safeFilename
} from "./ocr-utils.mjs";

function pickImage() {
  const arg = process.argv.slice(2).find(x => !x.startsWith("--"));
  if (arg && fileExists(arg)) {
    return { path: arg, fingerprint: `${arg}|manual|${Date.now()}` };
  }
  return findLatestScreenshot();
}

export async function processScreenshot(image = null, { silent = false } = {}) {
  const item = image || pickImage();

  if (!item?.path) {
    toast("Screenshot tidak ditemukan.");
    throw new Error("Screenshot tidak ditemukan");
  }

  if (!silent) toast("OCR membaca screenshot...");

  const raw = normalizeOcrText(runTesseract(item.path));
  if (!raw) {
    toast("OCR kosong.");
    throw new Error("OCR kosong");
  }

  const cleaned = await askRouter({
    mode: "ocrclean",
    question: `Nama file: ${safeFilename(item.path)}\n\nHasil OCR mentah:\n${raw}`
  });

  const json = parseJsonObject(cleaned.answer);
  const cleanText = cleanAnswer(json?.text || cleaned.answer || raw);
  const type = cleanAnswer(json?.type || "unknown");
  const note = cleanAnswer(json?.note || "");

  const mem = loadMemory();
  mem.active_flow = "ocr_pending";
  mem.pending_source = "ocr";
  mem.ocr_pending = true;
  mem.clip_paused_until = 0;
  mem.clip_paused_reason = "";
  mem.pending_text = cleanText;
  mem.ocr_image_path = item.path;
  mem.ocr_raw_text = raw;
  mem.ocr_clean_text = cleanText;
  mem.ocr_type = type;
  mem.last_screenshot_seen = item.fingerprint || mem.last_screenshot_seen;
  mem.last_question = "";
  mem.last_answer = "";
  mem.last_display = "";
  mem.last_reason = "";
  mem.last_provider = cleaned.provider || "";
  mem.last_mode = "ocrclean";
  saveMemory(mem);

  showOcrNotification(cleanText, type);

  console.log(JSON.stringify({
    status: true,
    image: item.path,
    type,
    note,
    text: cleanText
  }, null, 2));

  return { image: item.path, raw, cleanText, type, note };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processScreenshot().catch(e => {
    toast(`OCR error: ${e.message}`);
    console.error(e);
    process.exit(1);
  });
}
