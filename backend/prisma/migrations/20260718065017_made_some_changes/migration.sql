-- AlterTable
ALTER TABLE "scans" ADD COLUMN     "previousScanId" TEXT;

-- AddForeignKey
ALTER TABLE "scans" ADD CONSTRAINT "scans_previousScanId_fkey" FOREIGN KEY ("previousScanId") REFERENCES "scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
