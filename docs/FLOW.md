# NeuroClip V4 Flow

## Clip Flow

```txt
User copy text
-> watch-confirm.mjs
-> pending_source = clip
-> notification: Jawab / Balas / Tutup
-> answer.mjs or reply.mjs
-> result to clipboard
```

## OCR Flow

```txt
User screenshot
-> watch-screenshot.mjs
-> ocr-scan.mjs
-> Tesseract OCR
-> AI Cleaner
-> pending_source = ocr
-> active_flow = ocr_pending
-> notification: Jawab / Balas / Salin
```

OCR tidak langsung menjawab otomatis. Jawaban hanya diproses setelah user memilih Jawab/Balas.

## Router Rule

```txt
Manual clipboard baru menang dari OCR lama.
Clipboard dari AI output diabaikan.
Clipboard dari tombol Salin OCR diabaikan.
```
