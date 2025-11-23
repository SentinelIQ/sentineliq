
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const alertId = '5b204cda-f4d6-4013-8f7b-53ae9ccafd4b'
  console.log(`Checking alert ${alertId}...`)

  const alert = await prisma.brandAlert.findUnique({
    where: { id: alertId },
    include: { workspace: true }
  })

  if (!alert) {
    console.log('Alert not found!')
  } else {
    console.log('Alert found!')
    console.log('Workspace ID:', alert.workspaceId)
    console.log('Workspace Name:', alert.workspace.name)
    
    // Check for users in this workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: alert.workspaceId },
      include: { user: true }
    })
    
    console.log('Members:', members.map(m => ({ email: m.user.email, role: m.role })))
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
