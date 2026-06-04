# Provider Role

Provider diatur di `config/providers.json`.

| Provider | Peran |
|---|---|
| chatgpt | Cleaner cepat, form, pilihan ganda, fallback |
| claude | Final solver utama, OCR answer, alasan, lengkap, formal |
| copilot | Rewrite, ringkas, WhatsApp |
| gemini | Backup umum / OCR cleaner fallback |
| claude_soonex | Backup Claude |

## Route penting

```json
{
  "ocrclean": ["chatgpt", "gemini", "claude"],
  "ocranswer": ["claude", "chatgpt", "gemini"]
}
```
