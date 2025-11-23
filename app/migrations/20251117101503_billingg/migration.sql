-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT DEFAULT 'BR',
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "billingZipCode" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "stateRegistration" TEXT;
