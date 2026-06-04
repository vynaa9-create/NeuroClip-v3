# NeuroClip V4.0.1

Clipboard + Screenshot OCR AI Agent untuk Android Termux.

NeuroClip bisa membaca teks dari clipboard atau screenshot, lalu menampilkan menu notifikasi untuk menjawab, membalas dengan instruksi manual, atau menyalin hasil OCR. Versi ini memakai service controller baru agar Clip dan OCR tidak saling bentrok.

## Fitur utama

- Clipboard watcher: salin teks lalu muncul menu AI.
- Screenshot OCR watcher: screenshot langsung diproses menjadi teks bersih.
- OCR tidak langsung menjawab otomatis.
- Menu OCR: **Jawab**, **Balas**, **Salin**.
- Menu hasil jawaban: **Lihat**, **Balas**, **Tutup**.
- Router Clip/OCR: teks OCR, teks clipboard, dan output AI dibedakan lewat state internal.
- Salin OCR tidak memicu clipboard watcher.
- Manual clipboard baru tetap bisa mengalahkan konteks OCR lama.
- Supervisor service: `neuro on/off/status` mengontrol Clip + OCR sekaligus.
- Modular notification: jawaban panjang dipreview lebih rapi.

## Kebutuhan

Install di Termux:

```bash
pkg update -y
pkg install nodejs termux-api tesseract -y
termux-setup-storage
```

Pastikan aplikasi **Termux:API** sudah terpasang dan izin notifikasi/storage aktif.

## Instalasi

```bash
git clone https://github.com/rhteaster-ui/Agen-clipboard.git
cd Agen-clipboard
bash scripts/setup-termux.sh
```

Atau jika dari ZIP:

```bash
unzip neuroclip-v4-ready.zip
cd neuroclip-v4-ready
bash scripts/setup-termux.sh
```

Cek instalasi:

```bash
neuro doctor
neuro status
```

## Command utama

```bash
neuro on          # aktifkan Clip + OCR watcher
neuro off         # matikan Clip + OCR watcher
neuro restart     # restart semua watcher
neuro status      # cek status Clip/OCR/router
```

Service terpisah:

```bash
neuro clip-on
neuro clip-off
neuro ocr-on
neuro ocr-off
neuro clear-flow
```

Aksi manual:

```bash
neuro run "teks"
neuro clip
neuro ocr
neuro ocr answer
neuro reply "jelaskan singkat"
neuro view
neuro close
neuro log
neuro ocr-log
```

Mode jawaban:

```bash
neuro mode default
neuro mode singkat
neuro mode lengkap
neuro mode form
neuro mode opsi
neuro mode pilihanganda
neuro mode sd
neuro mode smp
neuro mode sma
neuro mode code
```

## Flow Clipboard

```txt
Salin teks
→ NeuroClip mendeteksi clipboard baru
→ notifikasi muncul
→ pilih Jawab / Balas / Tutup
→ hasil masuk clipboard dan tampil di notifikasi
```

Catatan:

- Clipboard dari jawaban AI sendiri akan diabaikan.
- Clipboard dari tombol Salin OCR akan diabaikan.
- Clipboard manual baru tetap diproses normal.

## Flow OCR

```txt
Screenshot
→ OCR scan
→ teks dibersihkan
→ notifikasi OCR siap
→ pilih Jawab / Balas / Salin
```

Catatan:

- OCR tidak menjawab otomatis.
- Jawab = jawab hasil OCR langsung.
- Balas = beri instruksi manual seperti “jawab detail tapi singkat”.
- Salin = salin teks OCR tanpa memicu mode clipboard.

## Router Clip/OCR

NeuroClip membedakan sumber teks dengan state internal:

```json
{
  "active_flow": "idle",
  "pending_source": "clip",
  "pending_text": "...",
  "ocr_clean_text": "...",
  "last_internal_clip_reason": "ocr-copy"
}
```

Aturan utama:

- `pending_source=clip` untuk teks salinan user.
- `pending_source=ocr` untuk teks hasil screenshot.
- `last_internal_clip_reason=ocr-copy` untuk teks dari tombol Salin OCR.
- Output AI juga ditandai agar tidak dijawab ulang oleh watcher.

## Status service

```bash
neuro status
```

Contoh output:

```txt
NeuroClip Status
----------------
CORE : ON  pid=12345
CLIP : ON  pid=12346
OCR  : ON  pid=12347
WANT : clip=on ocr=on
FLOW : idle
SRC  : clip
MODE : default
```

Jika Clip atau OCR mati sendiri, supervisor akan mencoba menyalakannya kembali selama mode service masih aktif.

## Troubleshooting

Matikan semua service:

```bash
neuro off
```

Bersihkan state nyangkut:

```bash
neuro clear-flow
```

Restart semua:

```bash
neuro restart
neuro status
```

Lihat log clipboard:

```bash
neuro log
```

Lihat log OCR:

```bash
neuro ocr-log
```

Jika notifikasi tidak muncul:

```bash
termux-notification --title "Test" --content "Notif jalan"
```

Jika command tidak ditemukan:

```bash
bash scripts/setup-termux.sh
```

## Struktur penting

```txt
src/core.mjs              core helper, provider, memory, notif
src/cli.mjs               command wrapper
src/cli-base.mjs          command lama/non-service
src/neuro-service.mjs     controller on/off/status
src/supervisor.mjs        penjaga Clip + OCR watcher
src/watch-confirm.mjs     clipboard watcher
src/watch-screenshot.mjs  screenshot OCR watcher
src/ocr-scan.mjs          OCR scan + cleaner
src/ocr-answer.mjs        jawab OCR
src/answer.mjs            jawab clipboard
src/reply.mjs             balas dengan instruksi manual
src/copy-ocr.mjs          salin OCR tanpa trigger clipboard
```

## Catatan versi

V4.0.1 fokus pada stabilitas Clip/OCR:

- Fix Clip watcher yang mati atau status tidak konsisten.
- Tambah supervisor service.
- `neuro off` sekarang mematikan Clip dan OCR.
- `neuro status` menampilkan CORE, CLIP, OCR, WANT, FLOW, SRC, MODE.
- OCR dan Clip tidak saling kunci total.
