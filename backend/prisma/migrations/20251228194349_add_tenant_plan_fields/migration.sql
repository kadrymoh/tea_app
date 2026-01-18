-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "maxOrders" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN     "maxRooms" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "maxUsers" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 99.00,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'basic',
ADD COLUMN     "subscriptionEnd" TIMESTAMP(3),
ADD COLUMN     "totalOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");
