-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "tokenFamilyId" UUID,
ADD COLUMN "rotatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "sessions_tokenFamilyId_idx" ON "sessions"("tokenFamilyId");
