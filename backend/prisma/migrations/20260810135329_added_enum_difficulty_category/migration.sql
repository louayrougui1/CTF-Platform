/*
  Warnings:

  - Added the required column `category` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `Challenge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChallengeCategory" AS ENUM ('WEB', 'CRYPTO', 'PWN', 'REVERSE', 'FORENSICS', 'OSINT', 'MISC');

-- CreateEnum
CREATE TYPE "ChallengeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "category" "ChallengeCategory" NOT NULL,
ADD COLUMN     "difficulty" "ChallengeDifficulty" NOT NULL;
