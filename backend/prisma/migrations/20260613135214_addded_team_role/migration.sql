/*
  Warnings:

  - The `role` column on the `TeamMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('CAPTAIN', 'MEMBER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'LEADER';

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "role",
ADD COLUMN     "role" "TeamRole" NOT NULL DEFAULT 'MEMBER';
