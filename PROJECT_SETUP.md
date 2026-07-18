# Cartograph — Project Structure & Setup

## Repo layout

```
cartograph/
├── AGENTS.md
├── README.md
├── PRD_TechDebtHeatmap.md
├── docker-compose.yml
├── .gitignore
├── .env.example
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── routes/
│   │   │   ├── repos.routes.ts
│   │   │   ├── scans.routes.ts
│   │   │   ├── files.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   └── auth.routes.ts
│   │   ├── controllers/
│   │   │   ├── repos.controller.ts
│   │   │   ├── scans.controller.ts
│   │   │   ├── files.controller.ts
│   │   │   └── reports.controller.ts
│   │   ├── services/
│   │   │   ├── git/
│   │   │   │   ├── clone.service.ts
│   │   │   │   ├── churn.service.ts
│   │   │   │   └── ownership.service.ts
│   │   │   ├── analysis/
│   │   │   │   ├── complexity.service.ts
│   │   │   │   └── ast-walker.ts
│   │   │   ├── scoring/
│   │   │   │   └── risk-score.service.ts
│   │   │   ├── llm/
│   │   │   │   └── explanation.service.ts
│   │   │   └── github/
│   │   │       └── oauth.service.ts
│   │   ├── jobs/
│   │   │   ├── queue.ts
│   │   │   ├── worker.ts
│   │   │   └── scan-repo.job.ts
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── repositories/
│   │   │       ├── repo.repository.ts
│   │   │       ├── scan.repository.ts
│   │   │       └── file-score.repository.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error-handler.ts
│   │   │   └── rate-limit.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── logger.ts
│   └── tests/
│       ├── unit/
│       │   ├── churn.service.test.ts
│       │   ├── complexity.service.test.ts
│       │   └── risk-score.service.test.ts
│       └── fixtures/
│           └── sample-repo/
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── pages/
        │   ├── Dashboard.tsx
        │   ├── RepoConnect.tsx
        │   ├── ScanResults.tsx
        │   └── Report.tsx
        ├── components/
        │   ├── treemap/
        │   │   └── RiskTreemap.tsx
        │   ├── list-view/
        │   │   └── RankedFileTable.tsx
        │   ├── file-detail/
        │   │   ├── FileDetailPanel.tsx
        │   │   ├── ChurnGraph.tsx
        │   │   └── ContributorList.tsx
        │   ├── reports/
        │   │   └── ReportExport.tsx
        │   └── common/
        │       ├── Header.tsx
        │       ├── Loader.tsx
        │       └── ScoreBadge.tsx
        ├── hooks/
        │   ├── useRepoScan.ts
        │   └── useFileDetail.ts
        ├── lib/
        │   └── api-client.ts
        ├── store/
        │   └── scan-store.ts
        ├── types/
        │   └── index.ts
        └── styles/
            └── globals.css
```

Notes on the layout:

- `services/` is split by PRD signal (`git`, `analysis`, `scoring`, `llm`) so each risk-score input is independently testable — matches Section 7.2.
- `jobs/` isolates the async BullMQ pipeline since analysis is explicitly slow/background (Section 9).
- `llm/` only touches `explanation.service.ts` — keeps the LLM layer thin and swappable, consistent with "no LLM needed" for the core scoring engine.
- Frontend components map 1:1 to Section 7.3/7.4 views (treemap, ranked list, file detail, AI explanation surfaces inside `file-detail`).

---

## Setup commands

### 0. Root

```bash
mkdir cartograph && cd cartograph
git init
npx create-react-app --dry-run > /dev/null 2>&1 || true  # sanity check node/npx present
touch README.md AGENTS.md .gitignore .env.example docker-compose.yml
cp /path/to/PRD_TechDebtHeatmap.md .
```

### 1. Backend

```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install simple-git ts-morph escomplex
npm install bullmq ioredis
npm install @prisma/client
npm install -D prisma
npm install @octokit/rest @octokit/auth-oauth-app
npm install @google/genai
npm install -D typescript ts-node ts-node-dev @types/node @types/express @types/cors
npm install -D vitest supertest @types/supertest

npx tsc --init
npx prisma init --datasource-provider postgresql

cd ..
```

### 2. Frontend

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @nivo/treemap @nivo/core
npm install axios
npm install zustand
npm install recharts        # for the churn-over-time graph in file detail panel
npm install -D vitest @testing-library/react @testing-library/jest-dom

cd ..
```

### 3. Infra (local dev)

```bash
# docker-compose.yml should define postgres + redis services
docker compose up -d
```

### 4. Env vars to stub in .env.example (root) and backend/.env.example

```
DATABASE_URL=
REDIS_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_CALLBACK_URL=
GEMINI_API_KEY=
PORT=4000
FRONTEND_URL=http://localhost:5173
```

### 5. Package scripts worth wiring up early

- `backend`: `dev` (ts-node-dev on server.ts), `worker` (runs BullMQ worker separately), `test`, `prisma:migrate`
- `frontend`: `dev`, `build`, `test`
