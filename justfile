###############################################################
# Minimal commands to develop, build, test, and deploy
###############################################################
# just docs: https://github.com/casey/just
set shell                          := ["bash", "-c"]
set dotenv-load                    := true

# vite needs an extra memory boost
vite                               := "NODE_OPTIONS='--max_old_space_size=16384' ./node_modules/vite/bin/vite.js"
# minimal formatting, bold is very useful
bold                               := '\033[1m'
normal                             := '\033[0m'
green                              := "\\e[32m"
yellow                             := "\\e[33m"
blue                               := "\\e[34m"
magenta                            := "\\e[35m"
grey                               := "\\e[90m"

# If not in docker, get inside
@_help:
    echo -e ""
    just --list --unsorted --list-heading $'🌱 Commands:\n\n'
    echo -e ""
    echo -e "    Github  URL 🔗 {{green}}$(cat package.json | jq -r '.repository.url'){{normal}}"
    echo -e "    Publish URL 🔗 {{green}}https://$(cat package.json | jq -r '.name' | sd '@metapages/metaframe-' '').mtfm.io/{{normal}}"
    echo -e ""

# Run the dev server. Opens the web app in browser.
dev: _ensure_npm_modules
    #!/usr/bin/env bash
    set -euo pipefail
    yarn install
    {{vite}} --clearScreen false

# build the browser app in ./docs (default for github pages)
build: _ensure_npm_modules
    {{vite}} build

deploy: _ensure_deployctl
  #!/usr/bin/env bash
  set -euo pipefail
  # build the client in editor/dist
  just build
  rm -rf deploy
  mkdir -p deploy
  cp -r dist deploy/
  cp -r server.ts deploy/
  cd deploy
  deployctl deploy --project=metaframe-aws-s3-explorer --prod server.ts

# Test: currently bare minimum: only building. Need proper test harness.
@test: build
    npm run lint

@clean:
    rm -rf dist

@_ensure_npm_modules:
    if [ ! -f "./node_modules/vite/bin/vite.js" ]; then yarn install; fi

# vite builder commands
@_vite +args="":
    {{vite}} {{args}}

@_ensure_deployctl:
    if ! command -v deployctl &> /dev/null; then echo '‼️ deployctl is being installed ‼️'; deno install -gArf jsr:@deno/deployctl; fi
