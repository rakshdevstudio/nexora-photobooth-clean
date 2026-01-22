-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
