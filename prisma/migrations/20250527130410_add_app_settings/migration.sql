-- CreateTable
CREATE TABLE "ApplicationSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "comingSoon" BOOLEAN NOT NULL DEFAULT false,
    "maintenance" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApplicationSettings_pkey" PRIMARY KEY ("id")
);
