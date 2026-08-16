/*
  Warnings:

  - You are about to drop the column `status` on the `Submission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[challengeId,teamId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teamId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "status",
ADD COLUMN     "teamId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SubmissionStatus";

-- CreateIndex
CREATE INDEX "Submission_teamId_idx" ON "Submission"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_challengeId_teamId_key" ON "Submission"("challengeId", "teamId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
