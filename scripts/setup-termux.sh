#!/data/data/com.termux/files/usr/bin/bash
set -e

APP_NAME="NeuroClip"
APP_VERSION="4.0.1"
APP_DIR="$HOME/.neuroclip"
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"

R="\033[1;31m"
G="\033[1;32m"
Y="\033[1;33m"
C="\033[1;36m"
W="\033[1;37m"
N="\033[0m"

banner() {
  clear 2>/dev/null || true
  printf "${C}"
  cat <<'ART'
 _   _                 ____ _ _       
| \ | | ___ _   _ _ __/ ___| (_)_ __  
|  \| |/ _ \ | | | '__| |   | | | '_ \ 
| |\  |  __/ |_| | |  | |___| | | |_) |
|_| \_|\___|\__,_|_|   \____|_|_| .__/ 
                                |_|    
ART
  printf "${N}\n"
  printf "${G}[+]${N} ${APP_NAME} v${APP_VERSION} — Clipboard + OCR AI Agent\n"
  printf "${G}[+]${N} Creator: ${Y}rhmt${N}\n\n"
}

fail_box() {
  printf "\n${R}[!] Setup gagal.${N}\n"
  printf "${Y}Cek error di atas lalu ulangi:${N} ${C}bash scripts/setup-termux.sh${N}\n\n"
}
trap fail_box ERR

step() { printf "${R}[%02d]${N} ${Y}%-34s${N}" "$1" "$2"; }
ok() { printf "${G}[OK]${N}\n"; }
warn() { printf "${Y}[WARN]${N} %s\n" "$1"; }

need_cmd() {
  local cmd="$1" pkg="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf "\n${R}[!] Command '%s' belum ada.${N}\n" "$cmd"
    printf "${Y}Install dulu:${N} ${C}pkg install %s -y${N}\n\n" "$pkg"
    exit 1
  fi
}

soft_cmd() {
  local cmd="$1" pkg="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    warn "Command '$cmd' belum ada. Install: pkg install $pkg -y"
  fi
}

write_shortcut() {
  local name="$1"
  local body="$2"
  cat > "$HOME/.shortcuts/$name" <<SHORTCUT
#!/data/data/com.termux/files/usr/bin/bash
$body
SHORTCUT
  chmod +x "$HOME/.shortcuts/$name"
}

check_js_file() {
  local file="$1"
  if [ -f "$APP_DIR/src/$file" ]; then
    node --check "$APP_DIR/src/$file" >/dev/null
  fi
}

install_files() {
  step 1 "Checking requirements"
  need_cmd node nodejs
  soft_cmd termux-clipboard-get termux-api
  soft_cmd termux-clipboard-set termux-api
  soft_cmd termux-notification termux-api
  soft_cmd termux-notification-remove termux-api
  soft_cmd termux-toast termux-api
  soft_cmd termux-dialog termux-api
  soft_cmd termux-open termux-api
  soft_cmd tesseract tesseract
  ok

  step 2 "Checking source"
  test -d "$SRC_DIR/src"
  test -f "$SRC_DIR/src/cli.mjs"
  test -f "$SRC_DIR/src/core.mjs"
  test -f "$SRC_DIR/config/providers.json"
  ok

  step 3 "Preparing directory"
  pkill -f watch-confirm.mjs 2>/dev/null || true
  pkill -f watch-screenshot.mjs 2>/dev/null || true
  pkill -f ss-watch.mjs 2>/dev/null || true
  pkill -f supervisor.mjs 2>/dev/null || true
  rm -rf "$APP_DIR/src"
  mkdir -p "$APP_DIR/src" "$APP_DIR/config" "$HOME/.shortcuts"
  mkdir -p /sdcard/termux 2>/dev/null || true
  ok

  step 4 "Copying files"
  cp -f "$SRC_DIR/src/"*.mjs "$APP_DIR/src/"
  cp -f "$SRC_DIR/config/providers.json" "$APP_DIR/providers.json"
  cp -f "$SRC_DIR/config/providers.json" "$APP_DIR/config/providers.json"
  ok

  step 5 "Checking syntax"
  for f in core.mjs cli.mjs cli-base.mjs neuro-service.mjs supervisor.mjs watch-confirm.mjs watch-screenshot.mjs ss-watch.mjs flow-state.mjs copy-ocr.mjs ocr-utils.mjs ocr-scan.mjs ocr-answer.mjs answer.mjs smart-answer.mjs reply.mjs reason.mjs menu.mjs view.mjs close.mjs reset.mjs mode.mjs; do
    check_js_file "$f"
  done
  ok

  step 6 "Installing neuro command"
  mkdir -p "$PREFIX/bin"
  cat > "$PREFIX/bin/neuro" <<'NEURO'
#!/data/data/com.termux/files/usr/bin/bash
node "$HOME/.neuroclip/src/cli.mjs" "$@"
NEURO
  chmod +x "$PREFIX/bin/neuro"
  ok

  step 7 "Creating notification actions"
  write_shortcut "neuro-answer" 'node "$HOME/.neuroclip/src/smart-answer.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-reply" 'node "$HOME/.neuroclip/src/reply.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-copy-ocr" 'node "$HOME/.neuroclip/src/copy-ocr.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-reason" 'node "$HOME/.neuroclip/src/reason.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-menu" 'node "$HOME/.neuroclip/src/menu.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-view" 'node "$HOME/.neuroclip/src/view.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-close" 'node "$HOME/.neuroclip/src/close.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-reset" 'node "$HOME/.neuroclip/src/reset.mjs" >> "$HOME/neuroclip.log" 2>&1'
  write_shortcut "neuro-on" 'neuro on'
  write_shortcut "neuro-off" 'neuro off'
  ok
}

success_screen() {
  printf "\n${G}[+]${N} Installation finished.\n\n"
  printf "${C}Command utama:${N}\n"
  printf "  ${C}neuro on${N}          aktifkan Clip + OCR watcher\n"
  printf "  ${C}neuro off${N}         matikan semua watcher\n"
  printf "  ${C}neuro status${N}      cek status Clip/OCR\n"
  printf "  ${C}neuro clip-on${N}     aktifkan Clip saja\n"
  printf "  ${C}neuro ocr-on${N}      aktifkan OCR saja\n"
  printf "  ${C}neuro ocr${N}         scan screenshot terbaru sekali\n"
  printf "  ${C}neuro run \"teks\"${N} jawab sekali\n\n"
  printf "${G}Flow:${N} copy text / screenshot -> notif -> Jawab/Balas/Salin -> clipboard\n\n"
}

banner
install_files
success_screen
