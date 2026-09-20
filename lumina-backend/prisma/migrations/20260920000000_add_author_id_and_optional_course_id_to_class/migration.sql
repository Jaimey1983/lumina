-- AlterTable
ALTER TABLE "classes" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "classes" ADD COLUMN "authorId" TEXT;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
