import {
  resetContext,
  removeNotif,
  NOTIF_PENDING_ID,
  NOTIF_RESULT_ID,
  NOTIF_OCR_ID,
  toast
} from "./core.mjs";

const full = process.argv.includes("--full");

resetContext({ full });
removeNotif(NOTIF_PENDING_ID);
removeNotif(NOTIF_RESULT_ID);
removeNotif(NOTIF_OCR_ID);

toast(full ? "Memory full reset." : "Memory konteks dibersihkan.");
console.log(full ? "Memory full reset." : "Memory konteks dibersihkan.");
