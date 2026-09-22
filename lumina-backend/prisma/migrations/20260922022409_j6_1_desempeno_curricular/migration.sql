-- DropForeignKey
ALTER TABLE "classes" DROP CONSTRAINT "classes_courseId_fkey";

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "caminoCurricular" TEXT,
ADD COLUMN     "contextoClase" JSONB,
ADD COLUMN     "dbaSeleccionado" JSONB,
ADD COLUMN     "desempenoId" TEXT,
ADD COLUMN     "ebcSeleccionado" JSONB,
ADD COLUMN     "indicadores" JSONB;

-- CreateTable
CREATE TABLE "desempenos" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "componenteEbc" TEXT NOT NULL,
    "competenciaIcfes" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desempenos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "desempenos_courseId_idx" ON "desempenos"("courseId");

-- AddForeignKey
ALTER TABLE "desempenos" ADD CONSTRAINT "desempenos_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_desempenoId_fkey" FOREIGN KEY ("desempenoId") REFERENCES "desempenos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
