-- Rename body to content in messages table (preserving existing data)
ALTER TABLE "messages" RENAME COLUMN "body" TO "content";

-- Add reason column to student_points table
ALTER TABLE "student_points" ADD COLUMN "reason" TEXT;
