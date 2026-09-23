# Runbook: Local Development Setup

> **Audience**: New engineers setting up SAAR for the first time on their local machine.  
> **Time**: ~20 minutes on a fresh machine.  
> **OS**: macOS, Linux, or Windows (WSL2 recommended on Windows).

---

## Prerequisites Checklist

Before starting, verify or install each tool:

```bash
# Check versions
node  --version   # Need: v24.x.x
pnpm  --version   # Need: 12.x.x
docker --version  # Need: 24+
git   --version   # Need: 2.40+
```

---

## Step 1: Install Node.js (v24)

Use `nvm` (recommended — lets you switch Node versions per project):

```bash
# macOS / Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc  # or ~/.zshrc

nvm install 24
nvm use 24
nvm alias default 24
```

**Windows (WSL2)**: Run the same commands inside WSL2 terminal.

**Verify**:
```bash
node --version   # v24.x.x
npm  --version   # 10.x.x
```

---

## Step 2: Install pnpm (v12)

```bash
npm install -g pnpm@12
```

**Verify**:
```bash
pnpm --version  # 12.x.x
```

---

## Step 3: Install Docker Desktop

Download from: https://www.docker.com/get-started

**macOS**: DMG installer. Enable Docker in Settings → Resources → Memory: ≥ 4 GB.

**Linux**: Follow the [official install guide](https://docs.docker.com/engine/install/) for your distro. Add your user to the `docker` group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Windows**: Install Docker Desktop and enable WSL2 integration in Settings.

**Verify**:
```bash
docker --version          # Docker version 24+
docker compose version    # Docker Compose version 2+
docker run hello-world    # Should print "Hello from Docker!"
```

---

## Step 4: Clone the Repository

```bash
git clone https://github.com/your-org/saar.git
cd saar
```

If you need access, contact the engineering lead to be added to the GitHub org.

---

## Step 5: Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` in your editor. The defaults work for local development except:

| Variable | Action Required |
|----------|----------------|
| `JWT_SECRET` | Generate a random 32+ char string: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Generate another random 32+ char string |
| `ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` |
| `AI_API_KEY` | Optional for local dev. Set your OpenAI key if you want AI features. |

**Generate secrets quickly**:
```bash
openssl rand -hex 32  # Run 3 times for the 3 secrets above
```

> ⚠️ **Never commit `.env` to git.** It's in `.gitignore` but stay alert.

---

## Step 6: Start Infrastructure Services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`

Wait ~5 seconds for health checks to pass:
```bash
docker compose ps
```

You should see both services as `healthy`:
```
NAME                STATUS
saar-postgres       Up 10 seconds (healthy)
saar-redis          Up 10 seconds (healthy)
```

If not healthy after 30 seconds, check logs:
```bash
docker compose logs postgres
docker compose logs redis
```

---

## Step 7: Install Node.js Dependencies

```bash
pnpm install
```

This installs all workspace dependencies (api, worker, packages). First install takes
~60 seconds. Subsequent installs use the pnpm store cache and are much faster.

**Expected output**:
```
Packages: +387
Progress: resolved 387, reused 380, downloaded 7, added 387
Done in 12.3s
```

---

## Step 8: Generate Prisma Client

```bash
pnpm exec prisma generate
```

This generates the type-safe Prisma client from `prisma/schema.prisma`.
This step runs automatically as part of `pnpm install` (via `prepare` script),
but if you see import errors, run it manually.

---

## Step 9: Run Database Migrations

```bash
pnpm db:migrate
```

Expected output:
```
Prisma Migrate has been applied successfully!
All migrations have been applied.
```

Verify with:
```bash
pnpm exec prisma migrate status
```

---

## Step 10: Seed the Database

```bash
pnpm db:seed
```

Expected output:
```
🌱 SAAR seed starting…

✅ User created:   demo@saar.dev (id: ...)
✅ UserProfile:    id=...
✅ LifeAreas:      mind, health, career, relationships, personal, finance
✅ Goals:          10K run, 12 books, morning routine
✅ GoalMetrics:    4 metrics across 3 goals
✅ Tasks:          7 tasks (3 done, 1 in-progress, 3 pending)
✅ Routine:        "Morning Routine" (FREQ=DAILY)
✅ BehaviorEvents: task.completed, checkin.completed, routine.completed
✅ Checkin:        mood=4, energy=3 (today)
✅ Insight:        timing_pattern — "You complete tasks 2× faster before 9 AM"

─────────────────────────────────────────────
🌱 Seed complete! ...
```

**Demo credentials**:
- Email: `demo@saar.dev`
- Password: `SaarDemo#2027!`

---

## Step 11: Start the Development Server

```bash
pnpm dev
```

Expected output:
```
[NestWatchPlugin] Starting NestJS watch mode...
[Nest] LOG [NestApplication] SAAR API listening on port 3000
```

The API is now available at **http://localhost:3000**

---

## Step 12: Verify the Setup

Run these checks in a new terminal:

```bash
# Health check
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# Readiness check (DB + Redis)
curl http://localhost:3000/ready
# Expected: {"status":"ok","db":"ok","redis":"ok"}

# App metadata
curl http://localhost:3000/api/v1/meta
# Expected: {"app":"SAAR","version":"1.0.0","phase":"1"}

# Login with demo user
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@saar.dev","password":"SaarDemo#2027!"}'
# Expected: {"accessToken":"eyJ...","refreshToken":"...","user":{...}}
```

If all four commands succeed, your local setup is complete. ✅

---

## Step 13: Open Prisma Studio (Optional)

Prisma Studio is a visual database browser:

```bash
pnpm db:studio
```

Opens at **http://localhost:5555**. You'll see all tables populated by the seed.

---

## Daily Development Workflow

```bash
# Start infrastructure (if not already running)
docker compose up -d

# Start the API in watch mode
pnpm dev

# In another terminal: run tests in watch mode
pnpm test:watch
```

---

## Stopping Everything

```bash
# Stop the dev server
Ctrl+C

# Stop Docker containers (data preserved)
docker compose stop

# Stop Docker containers AND remove data (fresh start)
docker compose down -v
```

---

## Troubleshooting

### `ECONNREFUSED 127.0.0.1:5432`
PostgreSQL isn't running.
```bash
docker compose up -d postgres
docker compose logs postgres  # check for errors
```

### `P1001: Can't reach database server`
Your `DATABASE_URL` in `.env` might be wrong. Check:
```bash
cat .env | grep DATABASE_URL
# Should be: postgresql://saar:saar@localhost:5432/saar
```

### `JWT_SECRET must be at least 32 characters`
```bash
openssl rand -hex 32  # Paste output as JWT_SECRET in .env
```

### `Error: Cannot find module '@prisma/client'`
```bash
pnpm exec prisma generate
```

### `pnpm install` fails with lockfile conflicts
```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

### Port 3000 already in use
```bash
# Find what's using port 3000
lsof -i :3000      # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Or just change the port
PORT=3001 pnpm dev
```

### Docker containers not starting (Mac M1/M2/M3)
Add `platform: linux/amd64` to your docker-compose services, or use the ARM images:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    platform: linux/arm64
```

### `Error: EPERM: operation not permitted` (Windows)
Run your terminal as Administrator, or use WSL2.

### Slow `pnpm install` on first run
pnpm downloads packages to a global content-addressable store. First run is slow
(~60-120s), subsequent runs reuse the store and take ~5s.

---

## IDE Setup (VS Code Recommended)

Install these extensions for the best DX:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```

Add to `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

*If you hit a problem not listed here, open a GitHub issue with the error output.*
