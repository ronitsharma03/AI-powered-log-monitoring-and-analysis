-- CreateEnum
CREATE TYPE "logStatus" AS ENUM ('Pending', 'Failure', 'Success');

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "isAnalysed" "logStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "source" TEXT,
ALTER COLUMN "analysis" DROP NOT NULL,
ALTER COLUMN "analysis" DROP DEFAULT;
