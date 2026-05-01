-- DropIndex
DROP INDEX "request_logs_routeId_idx";

-- DropIndex
DROP INDEX "request_logs_timestamp_idx";

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "rateLimitKeyBy" TEXT,
ADD COLUMN     "rateLimitKeyHeader" TEXT,
ADD COLUMN     "rateLimitMax" INTEGER,
ADD COLUMN     "rateLimitWindowMs" INTEGER;

-- CreateIndex
CREATE INDEX "request_logs_routeId_timestamp_idx" ON "request_logs"("routeId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "request_logs_statusCode_timestamp_idx" ON "request_logs"("statusCode", "timestamp" DESC);
