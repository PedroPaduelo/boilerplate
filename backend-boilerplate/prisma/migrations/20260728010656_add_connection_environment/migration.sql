-- CreateEnum
CREATE TYPE "ConnectionEnvironment" AS ENUM ('DEV', 'HOMOLOG', 'PRODUCTION');

-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "environment" "ConnectionEnvironment" NOT NULL DEFAULT 'PRODUCTION';
