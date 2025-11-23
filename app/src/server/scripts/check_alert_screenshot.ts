
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const alertId = '897b46db-bec0-496e-bc9d-4519e5356daf'
  console.log(`Checking alert ${alertId}...`)

  const alert = await prisma.brandAlert.findUnique({
    where: { id: alertId },
    select: {
      id: true,
      screenshotUrl: true,
      workspaceId: true
    }
  })

  console.log('Alert:', alert)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
