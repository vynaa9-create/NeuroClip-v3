import {
  loadMemory,
  setClipboard,
  notify,
  NOTIF_RESULT_ID,
  toast,
  shortcutAction,
  askRouter,
  showResultNotification,
  markBotOutput
} from "./core.mjs";

async function main() {
  try {
    const mem = loadMemory();

    if (mem.last_reason) {
      markBotOutput(mem.last_reason);
      setClipboard(mem.last_reason);

      notify({
        id: NOTIF_RESULT_ID,
        title: "AI Alasan",
        content: mem.last_reason,
        action: shortcutAction("neuro-menu"),
        buttons: [
          { label: "Lihat", action: shortcutAction("neuro-view") },
          { label: "Balas", action: shortcutAction("neuro-reply") },
          { label: "Tutup", action: shortcutAction("neuro-close") }
        ]
      });

      toast("Alasan masuk clipboard.");
      return;
    }

    const question = mem.pending_text || mem.last_question;
    const answer = mem.last_answer || mem.last_display;

    if (!question || !answer) {
      toast("Alasan belum tersedia.");
      return;
    }

    const result = await askRouter({
      mode: "alasan",
      question: `Pertanyaan awal:
${question}

Jawaban sebelumnya:
${answer}

Tugas:
Jelaskan alasan kenapa jawaban tersebut benar. Jika ini pilihan ganda, jelaskan singkat kenapa opsi lain tidak tepat.`
    });

    markBotOutput(result.answer);
    setClipboard(result.answer);
    showResultNotification({
      ...result,
      display: result.answer
    });
  } catch (e) {
    toast(`Reason error: ${e.message}`);
    console.log(e);
  }
}

main();
