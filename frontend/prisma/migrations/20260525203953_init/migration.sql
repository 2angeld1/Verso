-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "targetVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "filesTotal" INTEGER NOT NULL DEFAULT 0,
    "filesDone" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);
