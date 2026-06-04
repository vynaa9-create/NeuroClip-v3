import {
  loadMemory,
  saveMemory,
  normalizeMode,
  toast
} from "./core.mjs";

const input = process.argv.slice(2).join(" ").trim();

if (!input) {
  const mem = loadMemory();
  console.log(mem.active_mode || "default");
  process.exit(0);
}

const mode = normalizeMode(input) || "default";
const mem = loadMemory();
mem.active_mode = mode;
saveMemory(mem);

toast(`Mode aktif: ${mode}`);
console.log(`Mode aktif: ${mode}`);
