# Troubleshooting

## Clip/OCR status tidak sesuai

Gunakan:

```bash
neuro off
neuro clear-flow
neuro restart
neuro status
```

## Clip tidak merespons

```bash
neuro clip-off
neuro clip-on
neuro log
```

## OCR tidak merespons

```bash
neuro ocr-off
neuro ocr-on
neuro ocr-log
```

## Notifikasi tidak muncul

```bash
termux-notification --title "Test" --content "Notif jalan"
```

Pastikan izin notifikasi Termux dan Termux:API aktif.
