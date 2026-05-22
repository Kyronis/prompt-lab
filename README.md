# Prompt Lab

An open-source prompt engineering, tuning, and evaluation platform.

## Features

- **Prompt Management**: Create, version, and organize prompts into projects
- **Version Control**: Automatic versioning every time you update a prompt
- **Project Organization**: Group related prompts into projects
- **Public/Private Prompts**: Share prompts publicly or keep them private
- **REST API**: Full-featured Fastify backend with OpenAPI documentation
- **Web UI**: Modern Next.js frontend for browsing and managing prompts
- **CLI Tool**: Command-line interface for power users

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces |
| Frontend | Next.js 16 + React 19 + Tailwind CSS v4 |
| Backend | Fastify 5 + Prisma 6 + PostgreSQL 16 |
| Shared | Zod schemas + TypeScript types |
| CLI | Commander.js |
| Testing | Vitest |

## Project Structure

```
prompt-lab/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── cli/          # CLI tool
├── packages/
│   ├── backend/      # Fastify API server (port 4000)
│   └── shared/       # Shared schemas and types
├── third-party/
│   └── docker-compose.yml  # Local PostgreSQL
├── docker-compose.yml      # Full stack Docker deployment
└── scripts/
    └── setup-dev.sh        # One-click dev setup
```

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker

### Development Setup

```bash
# One-click setup (install deps, start DB, build shared, init schema)
./scripts/setup-dev.sh

# Terminal 1: Start backend
pnpm --filter @prompt-lab/backend dev

# Terminal 2: Start frontend
pnpm --filter @prompt-lab/web dev
```

### Docker Deployment (Local)

```bash
# Start the full stack with Docker Compose
docker compose up --build

# Services:
# - Web: http://localhost:3000
# - API: http://localhost:4000
# - API Docs: http://localhost:4000/documentation
# - DB:  localhost:5432
```

### Manual Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
pnpm --filter @prompt-lab/shared build

# 3. Start PostgreSQL
docker compose -f third-party/docker-compose.yml up -d

# 4. Setup backend
cp .env.example packages/backend/.env
cd packages/backend
pnpm db:generate
pnpm db:push
cd ../..

# 5. Start dev servers
pnpm --filter @prompt-lab/backend dev
pnpm --filter @prompt-lab/web dev
```

## Environment Variables

Copy `.env.example` to `packages/backend/.env` and adjust as needed:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `PORT` | Backend server port (default: 4000) |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/prompts` | List prompts |
| GET | `/api/prompts/:id` | Get prompt details |
| POST | `/api/prompts` | Create prompt |
| PATCH | `/api/prompts/:id` | Update prompt |
| DELETE | `/api/prompts/:id` | Delete prompt |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create project |

## Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm -r run build

# Run tests
pnpm test

# Lint all packages
pnpm -r run lint

# Database operations (in packages/backend)
pnpm db:generate    # Generate Prisma Client
pnpm db:push        # Push schema to database
pnpm db:migrate     # Create migration
pnpm db:studio      # Open Prisma Studio
```

## License

MIT
