-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('QUEUED', 'CLONING', 'ANALYZING', 'SCORING', 'GENERATING_EXPLANATIONS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'LINK');

-- CreateTable
CREATE TABLE "Repos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "accessTokenEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repos" (
    "id" TEXT NOT NULL,
    "githubRepoId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "connectedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'QUEUED',
    "commitSha" TEXT,
    "churnWindowMonths" INTEGER NOT NULL DEFAULT 6,
    "fileCount" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_scores" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "churnCount" INTEGER NOT NULL,
    "complexityCyclomatic" INTEGER NOT NULL,
    "complexityMaxNesting" INTEGER NOT NULL,
    "fileLengthLines" INTEGER NOT NULL,
    "uniqueContributors" INTEGER NOT NULL,
    "topContributorPct" DOUBLE PRECISION NOT NULL,
    "normalizedChurn" DOUBLE PRECISION NOT NULL,
    "normalizedComplexity" DOUBLE PRECISION NOT NULL,
    "busFactorPenalty" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_contributors" (
    "id" TEXT NOT NULL,
    "fileScoreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "commitCount" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "file_contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "repos_githubRepoId_key" ON "repos"("githubRepoId");

-- CreateIndex
CREATE INDEX "repos_connectedById_idx" ON "repos"("connectedById");

-- CreateIndex
CREATE INDEX "scans_repoId_createdAt_idx" ON "scans"("repoId", "createdAt");

-- CreateIndex
CREATE INDEX "file_scores_scanId_riskScore_idx" ON "file_scores"("scanId", "riskScore");

-- CreateIndex
CREATE UNIQUE INDEX "file_scores_scanId_filePath_key" ON "file_scores"("scanId", "filePath");

-- CreateIndex
CREATE INDEX "file_contributors_fileScoreId_idx" ON "file_contributors"("fileScoreId");

-- CreateIndex
CREATE INDEX "reports_scanId_idx" ON "reports"("scanId");

-- AddForeignKey
ALTER TABLE "repos" ADD CONSTRAINT "repos_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_scores" ADD CONSTRAINT "file_scores_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_contributors" ADD CONSTRAINT "file_contributors_fileScoreId_fkey" FOREIGN KEY ("fileScoreId") REFERENCES "file_scores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
