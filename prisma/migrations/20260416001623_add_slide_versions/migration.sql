-- CreateTable
CREATE TABLE "slide_versions" (
    "id" TEXT NOT NULL,
    "slideId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slide_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "slide_versions_slideId_createdAt_idx" ON "slide_versions"("slideId", "createdAt");

-- AddForeignKey
ALTER TABLE "slide_versions" ADD CONSTRAINT "slide_versions_slideId_fkey" FOREIGN KEY ("slideId") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
