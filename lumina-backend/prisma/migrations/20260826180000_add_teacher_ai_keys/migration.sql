-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('GEMINI', 'OPENAI', 'CLAUDE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "preferredAiProvider" "AiProvider";

-- CreateTable
CREATE TABLE "teacher_ai_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_ai_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_ai_keys_userId_provider_key" ON "teacher_ai_keys"("userId", "provider");

-- AddForeignKey
ALTER TABLE "teacher_ai_keys" ADD CONSTRAINT "teacher_ai_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
