import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const SCREENSHOT_DIRS = [
  "/sdcard/DCIM/Screenshots",
  "/sdcard/Pictures/Screenshots",
  "/sdcard/DCIM/ScreenCapture",
  "/sdcard/Pictures/ScreenCapture",
  "/storage/emulated/0/DCIM/Screenshots",
  "/storage/emulated/0/Pictures/Screenshots",
  "/storage/emulated/0/DCIM/ScreenCapture",
  "/storage/emulated/0/Pictures/ScreenCapture"
];

export const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

export function listImages(dir) {
  try {
    return fs.readdirSync(dir)
      .map(name => path.join(dir, name))
      .filter(file => {
        try {
          const stat = fs.statSync(file);
          return stat.isFile() && IMAGE_EXTS.has(path.extname(file).toLowerCase());
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
}

export function findLatestScreenshot() {
  const files = SCREENSHOT_DIRS.flatMap(listImages);
  let latest = null;

  for (const file of files) {
    const stat = fs.statSync(file);
    const item = {
      path: file,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      fingerprint: `${file}|${Math.trunc(stat.mtimeMs)}|${stat.size}`
    };

    if (!latest || item.mtimeMs > latest.mtimeMs) latest = item;
  }

  return latest;
}

export function runTesseract(imagePath) {
  const langs = process.env.NEUROCLIP_OCR_LANG || "eng+ind";

  const res = spawnSync("tesseract", [imagePath, "stdout", "-l", langs, "--psm", "6"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 60000
  });

  if (res.error) throw res.error;
  if (res.status !== 0 && !String(res.stdout || "").trim()) {
    throw new Error(String(res.stderr || "Tesseract OCR gagal").trim());
  }

  return String(res.stdout || "").trim();
}

export function normalizeOcrText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function safeFilename(file) {
  return path.basename(String(file || "screenshot"));
}
