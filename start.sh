#!/bin/bash
set -e

cd "$(dirname "$0")"

# フロントエンドビルド
echo "Building frontend..."
(cd frontend && pnpm build)

# バックエンド起動 (PYTHON_GIL=0 must be set at interpreter startup for free-threaded scaling)
echo "Starting backend..."
(cd backend && PYTHON_GIL=0 uv run fastapi run main.py) &
BACKEND_PID=$!

# Caddy起動
echo "Starting Caddy..."
caddy run --config Caddyfile &
CADDY_PID=$!

# Cloudflare Tunnel 起動
echo "Starting Cloudflare Tunnel..."
cloudflared tunnel --config "$HOME/.cloudflared/config.yml" run mde &
CF_PID=$!

# Ctrl+Cで全部停止
trap "kill $BACKEND_PID $CADDY_PID $CF_PID 2>/dev/null; exit" INT TERM

echo "Ready: https://mde.temma.dev"
wait
