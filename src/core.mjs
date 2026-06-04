import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const HOME = process.env.HOME || "/data/data/com.termux/files/home";
export const APP_DIR = path.join(HOME, ".neuroclip");
export const CONFIG_FILE = path.join(APP_DIR, "providers.json");
export const MEMORY_FILE = path.join(APP_DIR, "memory.json");
export const LAST_ANSWER_FILE = "/sdcard/termux/neuroclip-last-answer.txt";
export const NOTIF_PENDING_ID = "7781";
export const NOTIF_RESULT_ID = "7782";
export const NOTIF_OCR_ID = "7783";
export const APP_NAME = "NeuroClip";

export const DEFAULT_PROVIDERS = {
  claude: {
    url: "https://api.nexray.eu.cc/ai/claude",
    params: {},
    messageParam: "text",
    extract: "result"
  },
  gemini: {
    url: "https://api.nexray.eu.cc/ai/gemini",
    params: {},
    messageParam: "text",
    extract: "result"
  },
  kimi: {
    url: "https://api.nexray.eu.cc/ai/kimi",
    params: {},
    messageParam: "text",
    extract: "result"
  },
  chatgpt: {
    url: "https://api.nexray.eu.cc/ai/gpt-3.5-turbo",
    params: {},
    messageParam: "text",
    extract: "result"
  },
  copilot: {
    url: "https://api-nanzz.my.id/docs/api/ai/copilot.php",
    params: {},
    messageParam: "q",
    extract: "result.text"
  },
  claude_soonex: {
    url: "https://api.soonex.biz.id/v1/ai/claude",
    params: {},
    messageParam: "message",
    extract: "result"
  }
};

export const DEFAULT_ROUTES = {
  default: ["claude", "gemini", "kimi", "chatgpt"],
  form: ["claude", "gemini", "kimi", "chatgpt"],
  pilihanganda: ["claude", "gemini", "kimi", "chatgpt"],
  opsi: ["claude", "gemini", "kimi", "chatgpt"],
  singkat: ["claude", "gemini", "kimi", "chatgpt"],
  sedang: ["claude", "gemini", "kimi", "chatgpt"],
  lengkap: ["claude", "gemini", "kimi", "chatgpt"],
  bahas: ["claude", "gemini", "kimi", "chatgpt"],
  alasan: ["claude", "gemini", "kimi", "chatgpt"],
  sd: ["claude", "gemini", "kimi", "chatgpt"],
  smp: ["claude", "gemini", "kimi", "chatgpt"],
  sma: ["claude", "gemini", "kimi", "chatgpt"],
  formal: ["claude", "gemini", "kimi", "chatgpt"],
  code: ["claude", "gemini", "kimi", "chatgpt"],
  math: ["claude", "gemini", "kimi", "chatgpt"],
  wa: ["copilot", "claude", "kimi", "chatgpt"],
  ringkas: ["copilot", "claude", "kimi", "chatgpt"],
  rewrite: ["copilot", "claude", "kimi", "chatgpt"],
  ocrclean: ["claude", "gemini", "kimi", "chatgpt"],  // FIX: Claude first (best for JSON parsing)
  ocranswer: ["claude", "gemini", "kimi", "chatgpt"],
  ocrbahas: ["claude", "gemini", "kimi", "chatgpt"]
};

export const MODE_PROMPTS = {
  default: "Jawab singkat, jelas, dan langsung.",
  form: "Mode Google Form. Jawab sesingkat mungkin dan siap ditempel. Jika pilihan ganda, jawab opsi terbaik saja. Jika isian singkat, jawab langsung tanpa penjelasan.",
  pilihanganda: `Mode pilihan ganda. Analisis opsi yang tersedia. Balas dalam JSON valid saja:
{"answer":"huruf opsi","display":"huruf + isi opsi","reason":"alasan singkat"}
Jangan tambah teks lain di luar JSON.`,
  opsi: "Jawab hanya huruf opsi yang benar. Contoh output: B. Jangan beri alasan.",
  singkat: "Jawab sangat singkat. Maksimal 1-2 kalimat. Langsung ke inti.",
  sedang: "Jawab sedang, 2-4 kalimat. Tidak terlalu pendek dan tidak terlalu panjang.",
  lengkap: "Jawab lengkap, runtut, dan mudah dipahami. Berikan contoh jika perlu.",
  bahas: "Berikan jawaban dan pembahasan singkat yang mudah dipahami.",
  alasan: "Berikan alasan dari jawaban sebelumnya. Fokus pada kenapa jawaban itu benar. Jika ini pilihan ganda, boleh jelaskan kenapa opsi lain tidak tepat.",
  sd: "Jawab seperti anak SD. Gunakan bahasa sangat sederhana, kalimat pendek, dan mudah dipahami.",
  smp: "Jawab seperti siswa SMP. Jelas, sederhana, dan mudah dihafal.",
  sma: "Jawab seperti siswa SMA. Lebih lengkap, tapi tetap padat dan rapi.",
  formal: "Jawab dengan bahasa formal, rapi, dan sopan.",
  code: "Mode coding. Fokus pada solusi teknis. Jika relevan, beri kode siap pakai. Jangan terlalu banyak teori.",
  math: "Mode matematika. Tunjukkan langkah hitung dengan jelas dan pastikan hasil akhir benar.",
  wa: "Format jawaban agar enak dibaca di WhatsApp. Gunakan paragraf pendek atau bullet sederhana.",
  ringkas: "Ringkas teks menjadi versi pendek. Ambil inti utama saja.",
  rewrite: "Tulis ulang teks agar lebih rapi, natural, dan enak dibaca.",
  ocrclean: `Mode OCR Cleaner.
Tugasmu hanya merapikan hasil OCR dari screenshot.
- Jangan menjawab pertanyaan.
- Buang noise seperti angka poin, ikon, teks tombol, header aplikasi, jam, baterai, dan karakter rusak.
- Perbaiki typo ringan dari OCR jika konteksnya jelas.
- Jika terlihat pilihan ganda, ubah menjadi format rapi A/B/C/D.
- Jika bukan soal, rapikan sebagai teks biasa.
Balas JSON valid saja:
{"type":"pilihanganda|isian|catatan|math|code|unknown","text":"teks bersih","note":"catatan singkat jika perlu"}`,
  ocranswer: `Mode OCR Solver.
Teks yang diberikan adalah hasil OCR yang sudah dirapikan.
Jawab sebagai Claude/final solver: akurat, fleksibel, dan langsung ke inti.
Jika pilihan ganda, jawab opsi terbaik + alasan singkat.
Jika teks bukan pertanyaan, beri ringkasan/fungsi yang paling berguna.
Jangan membahas proses OCR kecuali diminta.`,
  ocrbahas: "Berikan pembahasan dari soal hasil OCR secara jelas, natural, dan mudah dipahami."
};

export function ensureDir() {
  fs.mkdirSync(APP_DIR, { recursive: true });

  // Storage Android kadang belum diberi izin. Jangan sampai watcher mati
  // hanya karena /sdcard/termux belum bisa dibuat.
  try {
    fs.mkdirSync("/sdcard/termux", { recursive: true });
  } catch {}
}

export function run(cmd, args = [], opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts
  });

  if (res.error) throw res.error;
  return String(res.stdout || "").trim();
}

export function termux(command, args = []) {
  try {
    return run(command, args);
  } catch {
    return "";
  }
}

export function getClipboard() {
  return termux("termux-clipboard-get").trim();
}

export function setClipboard(text) {
  spawnSync("termux-clipboard-set", [String(text ?? "")], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

export function toast(text) {
  spawnSync("termux-toast", [String(text ?? "")], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

export function wakeLock() {
  termux("termux-wake-lock");
}

export function wakeUnlock() {
  termux("termux-wake-unlock");
}

export function notify({ id, title, content, action = "", buttons = [] }) {
  const args = [
    "--id", String(id),
    "--title", String(title),
    "--content", String(content ?? "").slice(0, 900),
    "--priority", "max"
  ];

  if (action) {
    args.push("--action", action);
  }

  buttons.slice(0, 3).forEach((btn, i) => {
    const n = i + 1;
    args.push(`--button${n}`, String(btn.label));
    args.push(`--button${n}-action`, String(btn.action));
  });

  spawnSync("termux-notification", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

export function removeNotif(id) {
  spawnSync("termux-notification-remove", [String(id)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

export function shortcutAction(name) {
  return `bash "${HOME}/.shortcuts/${name}"`;
}

export function defaultMemory() {
  return {
    active_mode: "default",
    active_provider: "auto",

    // Flow router
    active_flow: "idle",
    pending_source: "text",
    pending_text: "",
    ocr_pending: false,
    clip_paused_until: 0,
    clip_paused_reason: "",

    // Last user / AI context
    last_question: "",
    last_answer: "",
    last_display: "",
    last_reason: "",
    last_provider: "",
    last_mode: "",
    last_user_followup: "",
    topic_summary: "",

    // Clipboard guard
    last_clip_seen: "",
    last_output_clip: "",
    last_output_at: 0,
    last_internal_clip: "",
    last_internal_clip_reason: "",
    last_internal_clip_at: 0,
    last_internal_clip_ignored_at: 0,

    // OCR context
    ocr_image_path: "",
    ocr_raw_text: "",
    ocr_clean_text: "",
    ocr_type: "",
    ocr_items: [],
    last_screenshot_seen: "",

    updated_at: 0
  };
}

export function loadMemory() {
  ensureDir();

  try {
    return { ...defaultMemory(), ...JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8")) };
  } catch {
    return defaultMemory();
  }
}

export function saveMemory(mem) {
  ensureDir();
  fs.writeFileSync(MEMORY_FILE, JSON.stringify({ ...mem, updated_at: Date.now() }, null, 2));
}

export function markBotOutput(text) {
  const mem = loadMemory();
  const value = String(text || "").trim();

  mem.last_output_clip = value;
  mem.last_output_at = Date.now();
  mem.last_internal_clip = value;
  mem.last_internal_clip_reason = "bot-output";
  mem.last_internal_clip_at = Date.now();

  // Jangan biarkan output AI dianggap input baru oleh watcher.
  mem.last_clip_seen = value;

  saveMemory(mem);
  return mem;
}

export function loadConfig() {
  ensureDir();

  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    return {
      providers: normalizeProviders(data.providers || DEFAULT_PROVIDERS),
      routes: data.routes || DEFAULT_ROUTES
    };
  } catch {
    return {
      providers: DEFAULT_PROVIDERS,
      routes: DEFAULT_ROUTES
    };
  }
}

function normalizeProviders(rawProviders) {
  const out = {};

  for (const [name, p] of Object.entries(rawProviders)) {
    out[name] = {
      url: p.url,
      params: p.params || {},
      messageParam: p.message_param || p.messageParam || "message",
      systemParam: p.system_param || p.systemParam || null,
      extract: p.extract || "",
      method: p.method || "GET"
    };
  }

  return out;
}

export function toText(input) {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean") return String(input);

  if (typeof input === "object") {
    const direct =
      input.answer ??
      input.display ??
      input.text ??
      input.result ??
      input.response ??
      input.message ??
      input.reply ??
      input.output ??
      input.content;

    if (direct != null && direct !== input) return toText(direct);

    const nested =
      input?.data?.answer ??
      input?.data?.result ??
      input?.data?.text ??
      input?.data?.response ??
      input?.result?.answer ??
      input?.result?.result ??
      input?.result?.text ??
      input?.result?.response;

    if (nested != null && nested !== input) return toText(nested);

    try {
      return JSON.stringify(input);
    } catch {
      return "";
    }
  }

  return String(input);
}

export function cleanAnswer(input) {
  let text = toText(input);

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") text = parsed;
    else text = toText(parsed);
  } catch {}

  return String(text)
    .replace(/\u001c[\s\S]*$/g, "")
    .replace(/\\u001c[\s\S]*$/g, "")
    .replace(/\s*\{['"]character_cooldown['"]:\s*true\}\s*$/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

export function getPathValue(obj, dotted) {
  if (!dotted) return undefined;

  return dotted.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

export function extractAnswer(provider, data, conf = {}) {
  const configured = getPathValue(data, conf.extract);
  if (configured != null) return configured;

  return (
    data?.result?.text ??
    data?.result?.result ??
    data?.result?.answer ??
    data?.result?.response ??
    data?.result ??
    data?.data?.answer ??
    data?.data?.result ??
    data?.data?.text ??
    data?.reply ??
    data?.answer ??
    data?.response ??
    data?.message ??
    data?.text ??
    data
  );
}

export function isBadAnswer(text) {
  if (!text || typeof text !== "string") return true;
  const t = text.trim().toLowerCase();
  if (t.length < 2) return true;
  if (t.includes("older version of the app")) return true;
  if (t.includes("update to the latest version")) return true;
  if (t.includes("undefined")) return true;
  if (t.includes("text is required")) return true;
  if (t.includes("rate limit")) return true;
  if (t.includes("too many requests")) return true;
  if (t.includes("internal server error")) return true;
  if (t.includes("cannot read")) return true;

  // Provider publik kadang mengembalikan sapaan / prompt echo.
  if (t.includes("saya akan memproses input neuroclip")) return true;
  if (t.includes("memproses input neuroclip dari android")) return true;
  if (t.includes("silakan berikan input yang ingin diproses")) return true;
  if (t.includes("berikan input yang ingin diproses")) return true;
  if (t.includes("tugasmu adalah memproses input neuroclip")) return true;
  if (t.includes("halo! saya claude")) return true;
  if (t.includes("saya claude")) return true;
  if (t.includes("asisten ai yang siap membantu")) return true;
  if (t.includes("bagaimana saya bisa membantu anda hari ini")) return true;
  if (t.includes("how can i assist you today")) return true;

  return false;
}

export function parseJsonObject(text) {
  const raw = String(text || "")
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(raw);
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  return null;
}

export function normalizeMode(input = "") {
  const raw = String(input).trim().toLowerCase();

  const map = {
    "default": "default",
    "form": "form",
    "google form": "form",
    "pilihan ganda": "pilihanganda",
    "pg": "pilihanganda",
    "pilihanganda": "pilihanganda",
    "opsi": "opsi",
    "jawaban saja": "opsi",
    "huruf saja": "opsi",
    "anak sd": "sd",
    "sd": "sd",
    "smp": "smp",
    "sma": "sma",
    "singkat": "singkat",
    "sedang": "sedang",
    "lengkap": "lengkap",
    "detail": "lengkap",
    "panjang": "lengkap",
    "formal": "formal",
    "code": "code",
    "coding": "code",
    "math": "math",
    "matematika": "math",
    "wa": "wa",
    "whatsapp": "wa",
    "ringkas": "ringkas",
    "rewrite": "rewrite",
    "alasan": "alasan",
    "bahas": "bahas"
  };

  return map[raw] || raw.replace(/[^a-z0-9]/g, "");
}

export function parseInstruction(text) {
  const raw = String(text || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return { type: "empty" };

  const resetWords = ["/reset", "reset", "clear", "hapus memory", "bersihkan memory"];
  if (resetWords.includes(lower)) return { type: "reset", full: false };

  const resetFullWords = ["/reset full", "reset full", "full reset"];
  if (resetFullWords.includes(lower)) return { type: "reset", full: true };

  if (lower.startsWith("/")) {
    const mode = normalizeMode(lower.slice(1).split(/\s+/)[0]);
    const rest = raw.split(/\s+/).slice(1).join(" ").trim();
    return { type: "mode_or_run", mode, rest };
  }

  if (lower.startsWith("mode ")) {
    const mode = normalizeMode(raw.slice(5).trim());
    return { type: "set_mode", mode };
  }

  if (["alasan", "tampilkan alasan", "kenapa", "mengapa"].includes(lower)) {
    return { type: "reason" };
  }

  return { type: "followup", instruction: raw };
}

export function resetContext({ full = false } = {}) {
  const old = loadMemory();

  if (full) {
    saveMemory(defaultMemory());
    return defaultMemory();
  }

  const mem = {
    ...old,
    active_flow: "idle",
    pending_text: "",
    pending_source: "text",
    ocr_pending: false,
    clip_paused_until: 0,
    clip_paused_reason: "",
    last_question: "",
    last_answer: "",
    last_display: "",
    last_reason: "",
    last_provider: "",
    last_mode: "",
    last_user_followup: "",
    topic_summary: "",
    last_clip_seen: "",
    last_output_clip: "",
    last_output_at: 0,
    last_internal_clip: "",
    last_internal_clip_reason: "",
    last_internal_clip_at: 0,
    ocr_image_path: "",
    ocr_raw_text: "",
    ocr_clean_text: "",
    ocr_type: "",
    ocr_items: [],
    last_screenshot_seen: ""
  };

  saveMemory(mem);
  return mem;
}

export function shouldIgnoreClipboard(text, mem) {
  const raw = String(text || "").trim();

  if (!raw) return true;
  if (raw.length < 2) return true;

  const internalClip = String(mem.last_internal_clip || "").trim();
  const internalReason = String(mem.last_internal_clip_reason || "").trim();
  const internalAge = Date.now() - (mem.last_internal_clip_at || 0);
  if (internalClip && raw === internalClip && internalReason && internalAge < 10 * 60 * 1000) return true;

  const outputAge = Date.now() - (mem.last_output_at || 0);
  if (mem.last_output_clip && raw === mem.last_output_clip && outputAge < 30000) return true;

  if (raw === String(mem.last_answer || "").trim()) return true;
  if (raw === String(mem.last_display || "").trim()) return true;
  if (raw === String(mem.last_reason || "").trim()) return true;
  if (raw === String(mem.last_clip_seen || "").trim()) return true;

  const lower = raw.toLowerCase();
  const ignored = [
    "$ ", "~/", "./", "curl ", "node ", "npm ", "pkg ", "apt ", "git ",
    "cp ", "mv ", "rm ", "mkdir ", "ls ", "cat ", "sed ", "awk ", "tail ",
    "grep ", "nano ", "vim ", "bash ", "sh ", "chmod ", "chown ", "nohup ",
    "pkill ", "pgrep ", "termux-clipboard", "termux-notification", "termux-dialog",
    "neuro ", "http://127.0.0.1"
  ];

  return ignored.some(x => lower.startsWith(x));
}

export function buildPrompt({ mode, question, extraInstruction = "", mem = {} }) {
  const activeMode = mode || "default";
  const modePrompt = MODE_PROMPTS[activeMode] || MODE_PROMPTS.default;
  const q = String(question || "").trim();

  const isShortEnglishWord =
    /^[a-zA-Z][a-zA-Z'-]{0,24}$/.test(q) &&
    q.split(/\s+/).length === 1;

  const parts = [`INPUT USER:\n${q}`];

  if (isShortEnglishWord) {
    parts.push(`TUGAS KHUSUS:
Input hanya satu kata bahasa Inggris.
Jawab arti/terjemahannya ke bahasa Indonesia.
Contoh: "from" = "dari".
Jangan memperkenalkan diri.
Jangan bertanya balik.`);
  }

  parts.push(`ATURAN WAJIB:
- Jawab langsung input user.
- Jangan ulang instruksi.
- Jangan minta input lagi.
- Jangan memperkenalkan diri sebagai AI/Claude/Gemini.
- Kalau konteks terlalu pendek, jelaskan arti paling mungkin secara singkat.`);

  parts.push(`Bahasa: Indonesia natural.`);
  parts.push(`Mode: ${activeMode}. ${modePrompt}`);

  if (extraInstruction) parts.push(`Instruksi tambahan: ${extraInstruction}`);

  if (mem.last_question || mem.last_answer || mem.last_reason) {
    parts.push(`Konteks terakhir:
Q: ${mem.last_question || "-"}
A: ${mem.last_answer || "-"}
Alasan: ${mem.last_reason || "-"}`);
  }

  return parts.join("\n\n");
}

export async function callProvider(provider, prompt, mode = "default") {
  const { providers } = loadConfig();
  const conf = providers[provider];

  if (!conf) throw new Error(`Provider tidak dikenal: ${provider}`);

  const url = new URL(conf.url);
  url.searchParams.set(conf.messageParam || "message", prompt);

  for (const [k, v] of Object.entries(conf.params || {})) {
    url.searchParams.set(k, v);
  }

  if (conf.systemParam) {
    url.searchParams.set(conf.systemParam, MODE_PROMPTS[mode] || MODE_PROMPTS.default);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    const answer = cleanAnswer(extractAnswer(provider, data, conf));
    if (!res.ok || isBadAnswer(answer)) {
      throw new Error(`Bad answer from ${provider}`);
    }

    return { provider, answer, raw: data };
  } finally {
    clearTimeout(timer);
  }
}

export async function askRouter({ mode, question, extraInstruction = "" }) {
  const mem = loadMemory();
  const { routes } = loadConfig();

  const activeMode = normalizeMode(mode || mem.active_mode || "default") || "default";
  const prompt = buildPrompt({ mode: activeMode, question, extraInstruction, mem });

  const route = mem.active_provider !== "auto"
    ? [mem.active_provider]
    : (routes[activeMode] || DEFAULT_ROUTES[activeMode] || DEFAULT_ROUTES.default);

  let lastError = "";

  for (const provider of route) {
    try {
      const result = await callProvider(provider, prompt, activeMode);
      const json = parseJsonObject(result.answer);

      let answer = result.answer;
      let display = result.answer;
      let reason = "";

      if (json && (json.answer || json.display || json.reason)) {
        answer = json.answer || json.display || result.answer;
        display = json.display || json.answer || result.answer;
        reason = json.reason || "";
      }

      if (activeMode === "form" && json?.display) answer = json.display;
      if (activeMode === "opsi" && json?.answer) answer = json.answer;
      if (activeMode === "pilihanganda" && json?.display) answer = json.display;

      const clean = cleanAnswer(answer);
      const cleanDisplay = cleanAnswer(display);
      const cleanReason = cleanAnswer(reason);

      const newMem = loadMemory();
      newMem.last_question = question;
      newMem.last_answer = clean;
      newMem.last_display = cleanDisplay;
      newMem.last_reason = cleanReason || "";
      newMem.last_provider = result.provider;
      newMem.last_mode = activeMode;
      saveMemory(newMem);

      return {
        status: true,
        mode: activeMode,
        provider: result.provider,
        answer: clean,
        display: cleanDisplay,
        reason: cleanReason
      };
    } catch (e) {
      lastError = e?.message || String(e);
    }
  }

  throw new Error(`Semua provider gagal. Last: ${lastError}`);
}

export function showPendingNotification(text) {
  const mem = loadMemory();

  notify({
    id: NOTIF_PENDING_ID,
    title: `${APP_NAME} • Mode ${mem.active_mode}`,
    content: `Teks disalin:
${String(text).slice(0, 220)}`,
    action: shortcutAction("neuro-menu"),
    buttons: [
      { label: "Jawab", action: shortcutAction("neuro-answer") },
      { label: "Balas", action: shortcutAction("neuro-reply") },
      { label: "Tutup", action: shortcutAction("neuro-close") }
    ]
  });
}

export function showOcrNotification(text, type = "unknown") {
  notify({
    id: NOTIF_OCR_ID,
    title: `${APP_NAME} OCR Siap • ${type}`,
    content: `Teks berhasil dibaca.\n\n${String(text).slice(0, 600)}\n\nPilih aksi:\n• Jawab = jawab singkat\n• Balas = instruksi manual\n• Salin = salin teks OCR`,
    action: shortcutAction("neuro-menu"),
    buttons: [
      { label: "Jawab", action: shortcutAction("neuro-answer") },
      { label: "Balas", action: shortcutAction("neuro-reply") },
      { label: "Salin", action: shortcutAction("neuro-copy-ocr") }
    ]
  });
}

export function showResultNotification(result = {}) {
  const answer = String(result.display || result.answer || "").trim();
  const clean = answer
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const makeModular = (text) => {
    const raw = String(text || "").trim();
    if (!raw) return "Jawaban kosong.";
    if (raw.includes("\n")) return raw.slice(0, 1200);

    const parts = raw
      .split(/(?<=[.!?])\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (parts.length <= 1) return raw.slice(0, 1200);

    return parts
      .slice(0, 8)
      .map((x, i) => `${i + 1}. ${x}`)
      .join("\n")
      .slice(0, 1200);
  };

  notify({
    id: NOTIF_RESULT_ID,
    title: `AI Jawaban • ${result.mode || "default"}/${result.provider || "AI"}`,
    content: `Jawaban berhasil dibuat.\n\n${makeModular(clean)}\n\nPilih aksi:\n• Lihat = buka full view\n• Balas = lanjut prompt\n• Tutup = tutup notif`,
    action: shortcutAction("neuro-view"),
    buttons: [
      { label: "Lihat", action: shortcutAction("neuro-view") },
      { label: "Balas", action: shortcutAction("neuro-reply") },
      { label: "Tutup", action: shortcutAction("neuro-close") }
    ]
  });
}
