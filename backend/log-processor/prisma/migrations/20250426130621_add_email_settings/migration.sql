-- CreateTable
CREATE TABLE "EmailSetting" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "reportFrequency" TEXT NOT NULL,
    "reportTime" TEXT NOT NULL,
    "samplesPerModule" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSetting_pkey" PRIMARY KEY ("id")
);
