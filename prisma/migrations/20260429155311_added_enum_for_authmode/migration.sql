/*
  Warnings:

  - The `authMode` column on the `routes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "routes" DROP COLUMN "authMode",
ADD COLUMN     "authMode" "AuthMode" NOT NULL DEFAULT 'none';
