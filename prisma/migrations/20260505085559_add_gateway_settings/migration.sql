-- CreateTable
CREATE TABLE "gateway_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_settings_pkey" PRIMARY KEY ("key")
);
