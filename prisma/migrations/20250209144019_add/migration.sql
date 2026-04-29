-- DropForeignKey
ALTER TABLE `Like` DROP FOREIGN KEY `Like_photoId_fkey`;

-- DropForeignKey
ALTER TABLE `Like` DROP FOREIGN KEY `Like_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Photo` DROP FOREIGN KEY `Photo_userId_fkey`;

-- DropIndex
DROP INDEX `Like_photoId_fkey` ON `Like`;

-- DropIndex
DROP INDEX `Photo_userId_fkey` ON `Photo`;

-- AddForeignKey
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
