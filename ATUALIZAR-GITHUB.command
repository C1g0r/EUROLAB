#!/bin/bash
# Publica alteracoes locais conscientemente; nao corre em segundo plano.
set -e
cd "$(dirname "$0")"
printf '
=== EUROLAB: ATUALIZAR GITHUB ===
'
echo "Verifica os ficheiros alterados antes de publicar."
git status --short
if [ -z "$(git status --porcelain)" ]; then
  echo "Sem alteracoes locais para publicar."
  read -r -p 'Enter para terminar...' _
  exit 0
fi
read -r -p 'Mensagem da alteracao (obrigatoria): ' MESSAGE
if [ -z "$MESSAGE" ]; then echo 'Cancelado: sem mensagem'; exit 1; fi
read -r -p 'Confirmas a publicacao de todos os ficheiros listados? (escreve PUBLICAR): ' APPROVAL
if [ "$APPROVAL" != 'PUBLICAR' ]; then echo 'Cancelado'; exit 1; fi
git add -A
git commit -m "$MESSAGE"
git push origin main
echo 'Alteracoes publicadas no GitHub.'
read -r -p 'Enter para terminar...' _
