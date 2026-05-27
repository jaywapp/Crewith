-- AlterTable: add password_hash to users
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT NOT NULL DEFAULT '';

-- AlterTable: add last_fee_status to club_members
ALTER TABLE "club_members" ADD COLUMN "last_fee_status" "FeePaymentStatus" NOT NULL DEFAULT 'unpaid';
