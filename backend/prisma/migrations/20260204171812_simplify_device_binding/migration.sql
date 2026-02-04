-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_deviceId_fkey";

-- DropIndex
DROP INDEX "License_deviceId_key";
