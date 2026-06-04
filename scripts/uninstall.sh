#!/data/data/com.termux/files/usr/bin/bash
pkill -f watch-confirm.mjs 2>/dev/null || true
termux-wake-unlock 2>/dev/null || true
rm -rf "$HOME/.neuroclip"
rm -f "$PREFIX/bin/neuro"
rm -f "$HOME/.shortcuts"/neuro-*
echo "NeuroClip dihapus."
