import {
  removeNotif,
  NOTIF_PENDING_ID,
  NOTIF_RESULT_ID,
  NOTIF_OCR_ID,
  toast
} from "./core.mjs";

removeNotif(NOTIF_PENDING_ID);
removeNotif(NOTIF_RESULT_ID);
removeNotif(NOTIF_OCR_ID);
toast("NeuroClip ditutup.");
