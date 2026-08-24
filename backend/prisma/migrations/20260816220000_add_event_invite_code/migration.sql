-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "inviteCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_inviteCode_key" ON "Event"("inviteCode");