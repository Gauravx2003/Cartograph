-- AlterTable
ALTER TABLE "file_scores" ADD COLUMN     "churnHistory" JSONB;

-- CreateTable
CREATE TABLE "file_dependencies" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_dependencies_scanId_fromPath_idx" ON "file_dependencies"("scanId", "fromPath");

-- CreateIndex
CREATE INDEX "file_dependencies_scanId_toPath_idx" ON "file_dependencies"("scanId", "toPath");

-- AddForeignKey
ALTER TABLE "file_dependencies" ADD CONSTRAINT "file_dependencies_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
