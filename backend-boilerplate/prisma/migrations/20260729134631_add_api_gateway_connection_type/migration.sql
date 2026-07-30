-- AlterEnum
ALTER TYPE "ConnectionType" ADD VALUE 'API_GATEWAY';

-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "base_url" TEXT;
