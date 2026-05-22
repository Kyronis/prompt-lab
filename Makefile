# Prompt Lab - Makefile
# Quick commands for development, build, test, and deployment

.PHONY: help ensure-env install dev dev-all dev-backend dev-web build \
        build-shared build-backend build-web test test-backend test-web \
        lint format clean db-up db-down db-logs db-generate db-push db-migrate \
        db-seed db-studio db-reset docker-up docker-down docker-build docker-logs \
        docker-logs-web docker-logs-backend setup

# Default target
help: ## Show this help message
	@echo "Prompt Lab - Available Commands"
	@echo "================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Environment ──
ensure-env: ## Ensure backend .env file exists
	@if [ ! -f packages/backend/.env ]; then \
		echo "📄 Creating packages/backend/.env from .env.example"; \
		cp .env.example packages/backend/.env; \
	fi

# ── Dependencies ──
install: ## Install all dependencies
	pnpm install

# ── Development ──
dev: ## Start both backend and web (requires tmux or two terminals)
	@echo "Please run in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-web"
	@echo "  Or use: make dev-all"

dev-all: ensure-env ## Start backend and web simultaneously (Ctrl+C to stop both)
	@echo "🔍 Checking for existing services..."
	@for port in 3000 4000; do \
		pid=$$(lsof -ti:$$port 2>/dev/null); \
		if [ -n "$$pid" ]; then \
			echo "  Killing process on port $$port (PID: $$pid)"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@sleep 1
	@echo "🚀 Starting backend (port 4000) and web (port 3000)..."
	@echo "   Press Ctrl+C to stop both services"
	@bash -c 'trap "kill 0" INT; \
		pnpm --filter @prompt-lab/backend dev & \
		pnpm --filter @prompt-lab/web dev & \
		wait'

dev-backend: ensure-env ## Start backend dev server (port 4000)
	@pid=$$(lsof -ti:4000 2>/dev/null); \
	if [ -n "$$pid" ]; then \
		echo "Killing process on port 4000 (PID: $$pid)"; \
		kill -9 $$pid 2>/dev/null || true; \
		sleep 1; \
	fi
	pnpm --filter @prompt-lab/backend dev

dev-web: ## Start web dev server (port 3000)
	@pid=$$(lsof -ti:3000 2>/dev/null); \
	if [ -n "$$pid" ]; then \
		echo "Killing process on port 3000 (PID: $$pid)"; \
		kill -9 $$pid 2>/dev/null || true; \
		sleep 1; \
	fi
	pnpm --filter @prompt-lab/web dev

# ── Build ──
build: ## Build all packages
	pnpm -r run build

build-shared: ## Build shared package (required before building others)
	pnpm --filter @prompt-lab/shared build

build-backend: ## Build backend package
	pnpm --filter @prompt-lab/backend build

build-web: ## Build web package
	pnpm --filter @prompt-lab/web build

# ── Test ──
test: ## Run all tests
	pnpm test

test-backend: ## Run backend tests
	pnpm --filter @prompt-lab/backend test

test-web: ## Run web tests
	pnpm --filter @prompt-lab/web test:run

# ── Code Quality ──
lint: ## Lint all packages
	pnpm -r run lint

format: ## Format code with Prettier
	npx prettier --write "**/*.{ts,tsx,js,json,md}"

# ── Clean ──
clean: ## Remove all build artifacts
	pnpm -r run clean
	find . -type d -name "node_modules" -prune -o -type f -name "*.log" -delete

# ── Database ──
db-up: ## Start PostgreSQL database
	docker compose -f third-party/docker-compose.yml up -d postgres

db-down: ## Stop PostgreSQL database
	docker compose -f third-party/docker-compose.yml down

db-logs: ## Show database logs
	docker compose -f third-party/docker-compose.yml logs -f postgres

db-generate: ## Generate Prisma Client
	pnpm --filter @prompt-lab/backend db:generate

db-push: ## Push schema to database (prototype stage)
	pnpm --filter @prompt-lab/backend db:push

db-migrate: ## Create and apply database migration
	pnpm --filter @prompt-lab/backend db:migrate

db-seed: ## Seed database with initial data
	pnpm --filter @prompt-lab/backend db:seed

db-studio: ## Open Prisma Studio
	pnpm --filter @prompt-lab/backend db:studio

db-reset: ## Reset database (down, up, generate, push)
	make db-down
	make db-up
	@echo "Waiting for database to be ready..."
	@sleep 3
	make db-generate
	make db-push

# ── Docker Deployment ──
docker-up: ## Start full stack with Docker Compose
	docker compose up --build -d

docker-down: ## Stop full stack
	docker compose down

docker-build: ## Build all Docker images
	docker compose build

docker-logs: ## Show Docker Compose logs
	docker compose logs -f

docker-logs-web: ## Show web container logs
	docker compose logs -f web

docker-logs-backend: ## Show backend container logs
	docker compose logs -f backend

# ── Setup ──
setup: ## One-click setup development environment
	bash scripts/setup-dev.sh

