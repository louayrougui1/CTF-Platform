/*
  Warnings:

  - A unique constraint covering the columns `[userId,eventId]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `TeamMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TeamMember_eventId_idx" ON "TeamMember"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_eventId_key" ON "TeamMember"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
