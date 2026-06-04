import { loadMemory, saveMemory, notify, NOTIF_OCR_ID, APP_NAME } from "./core.mjs";
import { findLatestScreenshot } from "./ocr-utils.mjs";
import { processScreenshot } from "./ocr-scan.mjs";

const INTERVAL_MS = Number(process.env.NEUROCLIP_SCREENSHOT_INTERVAL || 2200);
const MIN_AGE_MS = Number(process.env.NEUROCLIP_SCREENSHOT_MIN_AGE || 900);
// Setelah gagal N kali pada fingerprint yang sama, skip screenshot itu.
const MAX_FAIL_PER_FP = 2;

const failCount = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  notify({
    id: NOTIF_OCR_ID,
    title: `${APP_NAME} Vision Watcher`,
    content: "Aktif. Ambil screenshot untuk OCR.",
    buttons: []
  });

  console.log(`${APP_NAME} screenshot watcher aktif.`);

  while (true) {
    try {
      const latest = findLatestScreenshot();
      const mem = loadMemory();

      if (latest?.fingerprint && latest.fingerprint !== mem.last_screenshot_seen) {
        const age = Date.now() - latest.mtimeMs;
        const fails = failCount.get(latest.fingerprint) || 0;

        if (age >= MIN_AGE_MS) {
          if (fails >= MAX_FAIL_PER_FP) {
            // Screenshot ini sudah gagal berkali-kali — tandai skip agar tidak retry terus.
            const skip = loadMemory();
            skip.last_screenshot_seen = latest.fingerprint;
            saveMemory(skip);
            failCount.delete(latest.fingerprint);
            console.log("[OCR_SKIP] Terlalu banyak gagal, skip:", latest.path);
          } else {
            try {
              await processScreenshot(latest, { silent: true });
              // Hanya simpan fingerprint jika processScreenshot SUKSES.
              const after = loadMemory();
              after.last_screenshot_seen = latest.fingerprint;
              saveMemory(after);
              failCount.delete(latest.fingerprint);
              console.log("[OCR_SCREENSHOT]", latest.path);
            } catch (e) {
              failCount.set(latest.fingerprint, fails + 1);
              console.log("[OCR_FAIL]", latest.path, e?.message || String(e));
            }
          }
        }
      }
    } catch (e) {
      console.log("[SCREENSHOT WATCH ERROR]", e?.message || String(e));
    }

    await sleep(INTERVAL_MS);
  }
}

main();
