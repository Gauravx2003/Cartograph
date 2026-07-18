/*
  Warnings:

  - You are about to drop the `Repos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Repos";

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);
