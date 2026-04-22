#!/usr/bin/env bash
# start-all.sh — 一鍵啟動 VolleyTrip 前後端
# 用法：bash start-all.sh
# 按 Ctrl+C 同時關閉前後端

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 顏色輸出
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   VolleyTrip — 啟動前後端服務${NC}"
echo -e "${CYAN}========================================${NC}"

# 啟動後端（背景執行，輸出加前綴）
echo -e "${YELLOW}[Backend]${NC} 啟動中 → http://localhost:3001"
cd "$ROOT_DIR/backend"
npm run dev 2>&1 | sed "s/^/$(echo -e "${YELLOW}[Backend]${NC}") /" &
BACKEND_PID=$!

# 等後端稍微初始化
sleep 1

# 啟動前端（背景執行，輸出加前綴）
echo -e "${GREEN}[Frontend]${NC} 啟動中 → http://localhost:5173"
cd "$ROOT_DIR/frontend"
npm run dev 2>&1 | sed "s/^/$(echo -e "${GREEN}[Frontend]${NC}") /" &
FRONTEND_PID=$!

echo ""
echo -e "前端: ${GREEN}http://localhost:5173${NC}"
echo -e "後端: ${YELLOW}http://localhost:3001${NC}"
echo -e "按 ${CYAN}Ctrl+C${NC} 關閉所有服務"
echo ""

# Ctrl+C 時一併關閉兩個 process
cleanup() {
  echo ""
  echo -e "${CYAN}關閉服務中...${NC}"
  kill "$BACKEND_PID"  2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID"  2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${CYAN}已關閉。${NC}"
  exit 0
}
trap cleanup INT TERM

# 等待兩個子程序
wait "$BACKEND_PID" "$FRONTEND_PID"
