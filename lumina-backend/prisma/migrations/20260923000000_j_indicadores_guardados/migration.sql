-- CreateTable
CREATE TABLE "indicadores_guardados" (
    "id" TEXT NOT NULL,
    "desempenoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicadores_guardados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indicadores_guardados_desempenoId_idx" ON "indicadores_guardados"("desempenoId");

-- AddForeignKey
ALTER TABLE "indicadores_guardados" ADD CONSTRAINT "indicadores_guardados_desempenoId_fkey" FOREIGN KEY ("desempenoId") REFERENCES "desempenos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
