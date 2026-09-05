#!/usr/bin/env bash
#
# FORJA 3.0 · Publicar la app en GitHub Pages (rama gh-pages del repo forja-v3).
#   npm run publicar
# Requiere que el repositorio remoto exista. La rama gh-pages se reescribe
# entera en cada publicación: solo contiene el resultado compilado.

set -euo pipefail

REPO="${FORJA_REPO:-https://github.com/Millonaris/forja-v3.git}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

npm test
npm run iconos
npm run build

cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git config http.postBuffer 157286400
git add -A
git commit -q -m "Publicar $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$REPO" gh-pages

echo
echo "Publicado. Tarda hasta un minuto en refrescarse."
