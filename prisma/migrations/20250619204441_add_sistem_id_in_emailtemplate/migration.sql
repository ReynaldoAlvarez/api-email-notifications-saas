-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "systemId" TEXT;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "AuthorizedSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
