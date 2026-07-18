-- DropForeignKey
ALTER TABLE "repos" DROP CONSTRAINT "repos_connectedById_fkey";

-- AlterTable
ALTER TABLE "repos" ALTER COLUMN "connectedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "scans" ADD COLUMN     "explanationsRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestedById" TEXT,
ADD COLUMN     "requesterIp" TEXT;

-- AddForeignKey
ALTER TABLE "repos" ADD CONSTRAINT "repos_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
