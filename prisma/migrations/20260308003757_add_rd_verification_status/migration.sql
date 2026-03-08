-- AlterTable
ALTER TABLE "rd_profiles" ADD COLUMN     "verification_status" TEXT NOT NULL DEFAULT 'pending_verification';
