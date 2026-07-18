/*
  Warnings:

  - You are about to drop the `Repository` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Repository";

-- CreateTable
CREATE TABLE "repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_pkey" PRIMARY KEY ("id")
);
