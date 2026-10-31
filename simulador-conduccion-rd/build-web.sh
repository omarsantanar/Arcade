#!/usr/bin/env bash
set -euo pipefail
RELEASE="4.7.2-stable"
BASE="https://github.com/godotengine/godot-builds/releases/download/$RELEASE"
CACHE="/tmp/simulador-godot"
mkdir -p "$CACHE" web
echo "Descargando Godot $RELEASE..."
curl -fL --retry 3 --connect-timeout 20 "$BASE/Godot_v4.7.2-stable_linux.x86_64.zip" -o "$CACHE/editor.zip"
unzip -joq "$CACHE/editor.zip" -d "$CACHE"
GODOT_BIN="$(find "$CACHE" -maxdepth 1 -type f -name 'Godot_v*linux.x86_64' | head -n 1)"
if [ -z "$GODOT_BIN" ]; then echo "No se encontró el ejecutable"; exit 1; fi
chmod +x "$GODOT_BIN"
echo "Descargando export templates oficiales..."
curl -fL --retry 3 --connect-timeout 20 "$BASE/Godot_v4.7.2-stable_export_templates.tpz" -o "$CACHE/templates.tpz"
TEMPLATES="$HOME/.local/share/godot/export_templates/4.7.2.stable"
mkdir -p "$TEMPLATES"
unzip -joq "$CACHE/templates.tpz" 'templates/web*.zip' -d "$TEMPLATES"
echo "Importando recursos..."
"$GODOT_BIN" --headless --path . --editor --quit
echo "Exportando Godot a HTML5 y WASM..."
"$GODOT_BIN" --headless --path . --export-release "Web" web/index.html
test -s web/index.html
test -n "$(find web -maxdepth 1 -name '*.wasm' -print -quit)"
echo "OK: salida web/index.html disponible"
