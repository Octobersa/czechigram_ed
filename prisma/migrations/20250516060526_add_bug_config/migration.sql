-- AlterTable
ALTER TABLE `Report` MODIFY `reason` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `BugConfig` (
    `bugId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NULL,

    PRIMARY KEY (`bugId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
