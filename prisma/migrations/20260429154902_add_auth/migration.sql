-- CreateEnum
CREATE TYPE "AuthMode" AS ENUM ('none', 'apiKey', 'jwt');

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "authJwtRequiredClaims" JSONB,
ADD COLUMN     "authJwtSecret" TEXT,
ADD COLUMN     "authKeyHeader" TEXT,
ADD COLUMN     "authMode" TEXT NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "routeScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");
