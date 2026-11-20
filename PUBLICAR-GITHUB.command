#!/bin/bash
# Publicação segura do EUROLAB v1.2 num repositório que foi inicialmente preenchido com o ZIP.
# Preserva o histórico remoto, não usa force e não pede tokens.
set -euo pipefail
cd "$(dirname "$0")"
REMOTE="git@github.com:C1g0r/EUROLAB.git"
EXPECTED_ZIP="EUROLAB_GitHub_v1.2_pronto_a_publicar.zip"
printf '\n=== EUROLAB: PUBLICACAO CORRIGIDA ===\n'
if [ ! -d .git ] || [ ! -f index.html ] || [ ! -f assets/app.js ]; then
  echo 'ERRO: o atalho tem de estar dentro da pasta EUROLAB do projeto completo.'
  exit 1
fi
if ! command -v git >/dev/null; then echo 'ERRO: git nao esta instalado.'; exit 1; fi
if [ -n "$(git status --porcelain)" ]; then
  echo 'ERRO: ha alteracoes locais nao guardadas. Publicacao interrompida para evitar perda de trabalho.'
  git status --short
  exit 1
fi
if git remote get-url origin >/dev/null 2>&1; then
  ACTUAL="$(git remote get-url origin)"
  if [ "$ACTUAL" != "$REMOTE" ]; then
    echo "ERRO: remoto diferente do esperado: $ACTUAL"
    exit 1
  fi
else
  git remote add origin "$REMOTE"
fi
printf 'A consultar o estado de %s...\n' "$REMOTE"
git fetch origin main
if git merge-base --is-ancestor origin/main HEAD; then
  echo 'O historico remoto ja esta incorporado localmente.'
elif git merge-base --is-ancestor HEAD origin/main; then
  echo 'ERRO: o projeto local esta atras do GitHub. Nada foi alterado.'
  exit 1
else
  # Nao ignorar alteracoes remotas desconhecidas: permitir apenas o README inicial e o ZIP enviado.
  while IFS= read -r name; do
    case "$name" in
      README.md|"$EXPECTED_ZIP") ;;
      *) echo "ERRO: ficheiro remoto nao esperado: $name"; echo 'Nada foi alterado. Pede uma verificacao antes de continuar.'; exit 1;;
    esac
  done < <(git ls-tree -r --name-only origin/main)
  echo 'Historicos diferentes detetados. Vou uni-los mantendo os ficheiros da aplicacao.'
  git merge --allow-unrelated-histories -s ours -m 'Integrar historico remoto inicial e publicar codigo EUROLAB v1.2' origin/main
fi
printf '\nA enviar a aplicacao para o GitHub...\n'
git push -u origin main
if git show-ref --verify --quiet refs/tags/v1.2.0; then
  if git ls-remote --tags --exit-code origin refs/tags/v1.2.0 >/dev/null 2>&1; then
    echo 'A tag v1.2.0 ja existe no GitHub.'
  else
    git push origin v1.2.0
  fi
fi
printf '\nPUBLICACAO CONCLUIDA. Verifica: https://github.com/C1g0r/EUROLAB\n'
echo 'Deves ver index.html, assets/, data/ e os restantes ficheiros na raiz.'
if command -v open >/dev/null; then open 'https://github.com/C1g0r/EUROLAB'; fi
read -r -p 'Enter para terminar...' _
