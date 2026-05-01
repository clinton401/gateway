-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "requestBodyTransform" JSONB,
ADD COLUMN     "requestHeaderTransform" JSONB,
ADD COLUMN     "requestPathTransform" JSONB,
ADD COLUMN     "responseBodyTransform" JSONB,
ADD COLUMN     "responseHeaderTransform" JSONB;
