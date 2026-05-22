#!/bin/bash
set -e

echo "🚀 启动 Prompt Lab 开发环境..."

# 1. 检查依赖
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm 未安装"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker 未安装"; exit 1; }

# 2. 启动数据库
docker compose -f third-party/docker-compose.yml up -d postgres
for i in {1..30}; do
  docker exec promptlab-db pg_isready -U postgres &>/dev/null && break
  sleep 1
done

# 3. 安装依赖
pnpm install

# 4. 构建 shared
pnpm --filter @prompt-lab/shared build

# 5. 配置后端环境
[ ! -f packages/backend/.env ] && cp .env.example packages/backend/.env

# 6. 初始化数据库
cd packages/backend
pnpm db:generate
pnpm db:push
# pnpm db:seed
cd ../..

echo "✅ 环境就绪！运行命令："
echo "  后端: pnpm --filter @prompt-lab/backend dev"
echo "  前端: pnpm --filter @prompt-lab/web dev"
