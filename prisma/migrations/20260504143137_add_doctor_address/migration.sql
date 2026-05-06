-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "address" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_doctorId_date_idx" ON "Appointment"("doctorId", "date");
