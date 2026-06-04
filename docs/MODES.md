# Modes

Mode umum:

```txt
default
form
pilihanganda
opsi
sd
smp
sma
singkat
sedang
lengkap
formal
code
math
wa
ringkas
rewrite
```

Mode OCR:

```txt
ocrclean
ocranswer
ocrbahas
```

## ocrclean

Dipakai otomatis setelah Tesseract membaca screenshot.

Tugas:

- Rapikan teks OCR.
- Hapus noise UI.
- Deteksi tipe teks.
- Jangan menjawab pertanyaan.

## ocranswer

Dipakai ketika user menekan Jawab pada hasil OCR.

Tugas:

- Menjawab teks hasil OCR yang sudah dirapikan.
- Claude menjadi provider utama.
- Jika pilihan ganda, jawab opsi terbaik dan alasan singkat.

## Set mode

```bash
neuro mode form
neuro mode sd
neuro mode pilihanganda
```
