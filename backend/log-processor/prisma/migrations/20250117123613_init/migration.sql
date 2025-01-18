-- CreateEnum
CREATE TYPE "logStatus" AS ENUM ('Pending', 'Failure', 'Success');

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "logMessage" TEXT NOT NULL,
    "analysis" TEXT,
    "isAnalysed" "logStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);
