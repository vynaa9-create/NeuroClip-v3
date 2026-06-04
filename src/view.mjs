import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { loadMemory, LAST_ANSWER_FILE, toast } from "./core.mjs";

const mem = loadMemory();

const text = [
  "【 NeuroClip - Jawaban Full 】",
  "",
  "Mode     : " + (mem.last_mode || "-"),
  "Provider : " + (mem.last_provider || "-"),
  "",
  "Pertanyaan:",
  mem.last_question || mem.pending_text || "-",
  "",
  "Jawaban:",
  mem.last_display || mem.last_answer || "-",
  "",
  "Alasan:",
  mem.last_reason || "-"
].join("\n");

fs.writeFileSync(LAST_ANSWER_FILE, text);

spawnSync("termux-open", [LAST_ANSWER_FILE], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});

toast("Jawaban full dibuka.");
