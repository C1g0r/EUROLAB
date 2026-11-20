#!/bin/bash
# EUROLAB v1.2 — servidor local; porta fixa preserva Cofre e configurações.
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "Erro: Python 3 não encontrado."
  read -r -p "Premir Enter para terminar..." _
  exit 1
fi
PORT=8765
URL="http://127.0.0.1:$PORT/"
if ! python3 - "$PORT" <<'PYCHECK'
import socket,sys
with socket.socket(socket.AF_INET,socket.SOCK_STREAM) as s:
 try:s.bind(('127.0.0.1',int(sys.argv[1])))
 except OSError:sys.exit(1)
PYCHECK
then
  echo "A porta $PORT já está a ser utilizada."
  if python3 - "$URL" <<'CHECK'
import sys,urllib.request
try:
 with urllib.request.urlopen(sys.argv[1], timeout=2) as response:
  content=response.read(7000).decode('utf-8','replace')
 if 'LABORATÓRIO · V1.2' in content:sys.exit(0)
except Exception:pass
sys.exit(1)
CHECK
  then
    echo "EUROLAB v1.2 já está aberto na porta $PORT."
    command -v open >/dev/null 2>&1 && open "$URL"
  else
    echo "Pode existir outra versão do EUROLAB aberta."
    echo "Fecha o Terminal do servidor anterior e volta a abrir este atalho."
    echo "Não abri a versão anterior para evitar confusão."
  fi
  read -r -p "Premir Enter para terminar..." _
  exit 1
fi
printf '\n=========================================\n'
echo " EUROLAB v1.2 — WEB APP LOCAL"
printf '=========================================\n'
echo "Pasta: $(pwd)"
echo "Abrir: $URL"
echo "Mantém esta janela aberta. Para terminar prime Control+C."
python3 -m http.server "$PORT" --bind 127.0.0.1 &
PID=$!
trap 'kill "$PID" 2>/dev/null' EXIT INT TERM
sleep 1
if command -v open >/dev/null 2>&1;then open "$URL";fi
wait "$PID"
