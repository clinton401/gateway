-- AlterTable
ALTER TABLE "request_logs" ADD COLUMN     "circuitOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clientIdentity" TEXT,
ADD COLUMN     "rateLimited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestSize" INTEGER,
ADD COLUMN     "responseSize" INTEGER;
