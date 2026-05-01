-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "cbCooldownMs" INTEGER,
ADD COLUMN     "cbFailureThreshold" INTEGER,
ADD COLUMN     "cbSuccessThreshold" INTEGER,
ADD COLUMN     "cbWindowSize" INTEGER;
