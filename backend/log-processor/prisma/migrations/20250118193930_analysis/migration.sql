/*
  Warnings:

  - The `analysis` column on the `Log` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Log" ALTER COLUMN "timestamp" DROP NOT NULL,
DROP COLUMN "analysis",
ADD COLUMN     "analysis" JSONB,
ALTER COLUMN "isAnalysed" DROP NOT NULL;
