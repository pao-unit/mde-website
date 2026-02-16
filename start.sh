#!/bin/bash
set -e

cd "$(dirname "$0")"

# フロントエンドビルド
echo "Building frontend..."
(cd frontend && pnpm build)

# バックエンド起動
echo "Starting backend..."
(cd backend && uv run fastapi run main.py) &
BACKEND_PID=$!

# Caddy起動
echo "Starting Caddy..."
caddy run --config Caddyfile &
CADDY_PID=$!

# Ctrl+Cで両方停止
trap "kill $BACKEND_PID $CADDY_PID 2>/dev/null; exit" INT TERM

echo "Ready: http://$(ipconfig getifaddr en0):80"
wait
