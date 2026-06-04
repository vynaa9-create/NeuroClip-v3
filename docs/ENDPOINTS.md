# Endpoints

Endpoint berada di `config/providers.json` dan bisa diganti tanpa mengubah source.

## Provider aktif di build ini

```txt
chatgpt      https://api-nanzz.my.id/docs/api/ai/copilot.php?q=
claude       https://api.nexray.eu.cc/ai/claude?text=
copilot      https://api-nanzz.my.id/docs/api/ai/copilot.php?q=
gemini       https://api.soonex.biz.id/v1/ai/gemini?text=
claude_soonex https://api.soonex.biz.id/v1/ai/claude?message=
```

## Route penting

```json
{
  "ocrclean": ["chatgpt", "gemini", "claude"],
  "ocranswer": ["claude", "chatgpt", "gemini"],
  "default": ["claude", "chatgpt", "gemini"]
}
```

## Catatan

- `ocrclean` hanya merapikan hasil OCR dan tidak boleh menjawab soal.
- `ocranswer` adalah tahap jawaban akhir dan diprioritaskan ke Claude.
- Jika endpoint publik berubah, edit `config/providers.json`, lalu jalankan ulang `bash scripts/setup-termux.sh`.
