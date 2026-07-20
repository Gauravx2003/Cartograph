# Cartograph 🗺️

**Cartograph** is an engineering intelligence tool that connects to a GitHub repository and automatically generates a visual "risk heatmap" of the codebase. It combines code churn, cyclomatic complexity, and ownership data to surface the most fragile, poorly understood, and dangerous-to-touch files in your repository.

No more tribal knowledge—Cartograph makes technical debt and bus-factor risks visible.

## 🚀 Key Features

- **Risk Scoring Engine**: Computes a definitive risk score per file based on Churn (commit frequency), Complexity (AST static analysis), and Ownership (bus-factor from `git blame`).
- **Interactive Visualizations**: View your codebase as a color-coded **Treemap** or dive into a **Ranked List** of problem files.
- **AI-Powered Explanations**: Uses the Google Gemini API to generate plain-English explanations for the top riskiest files, grounded in actual repo metrics.
- **Security First**: Private repositories can be safely analyzed by logging in with GitHub OAuth.
- **Fast and Focused**: Designed to analyze mid-size repos (~500 files) in under 2 minutes.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Nivo (for Treemaps).
- **Backend**: Node.js, Express, TypeScript, BullMQ (async job queue), Prisma (ORM), PostgreSQL, Redis.
- **Git Analysis**: `simple-git` for log/blame extraction, `ts-morph` for AST walking.
- **AI Layer**: `@google/genai` (Gemini API) for focused insights.

## 📦 Prerequisites

To run Cartograph locally, you'll need:
- Node.js (v20+ recommended)
- PostgreSQL
- Redis
- A GitHub OAuth App (for authentication and private repo access)
- Google Gemini API Key

*Tip: A `docker-compose.yml` is included to easily spin up local PostgreSQL and Redis instances.*

## ⚙️ Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Cartograph
   ```

2. **Start Database and Redis:**
   ```bash
   docker-compose up -d
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   npm install
   
   # Copy environment variables and configure them
   cp .env.example .env
   
   # Run database migrations
   npm run db:migrate
   
   # Start the development server and the background worker
   npm run dev:all
   ```

4. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   
   # Copy environment variables
   cp .env.example .env
   
   # Start the Vite development server
   npm run dev
   ```

5. **Open Cartograph:**
   Navigate to `http://localhost:5173` in your browser.

## 📖 How it Works

1. **Ingest**: You authenticate via GitHub and select a repository.
2. **Clone & Queue**: The backend clones the repo server-side and queues an analysis job via BullMQ.
3. **Analyze**: The worker analyzes the git history (`git log`, `git blame`) and parses the AST to determine cyclomatic complexity.
4. **Score**: A weighted formula computes a risk score for each file.
5. **AI Summarize**: The top flagged files are sent to Gemini to generate a human-readable summary of *why* they are risky.
6. **Visualize**: Results are served to the React frontend for exploration.
