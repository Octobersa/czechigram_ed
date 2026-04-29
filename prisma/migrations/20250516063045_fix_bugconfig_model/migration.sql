/*
  Warnings:

  - You are about to drop the column `isActive` on the `BugConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `BugConfig` DROP COLUMN `isActive`,
    ADD COLUMN `isFixed` BOOLEAN NULL;
