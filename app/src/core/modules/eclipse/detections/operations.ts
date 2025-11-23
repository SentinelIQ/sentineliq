import { HttpError } from 'wasp/server'
import { prisma } from 'wasp/server'

/**
 * Get all alerts for the current workspace
 */
export const getWorkspaceAlerts = async (_args: void, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  // Get user's workspace IDs
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { userId: context.user.id },
    select: { workspaceId: true },
  })

  const workspaceIds = workspaceMembers.map((m) => m.workspaceId)

  if (workspaceIds.length === 0) {
    return []
  }

  // Get all alerts for user's workspaces
  const alerts = await prisma.brandAlert.findMany({
    where: {
      workspaceId: {
        in: workspaceIds,
      },
    },
    include: {
      monitor: {
        select: {
          id: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100, // Limit to recent 100 alerts
  })

  return alerts
}

/**
 * Get alerts for a specific brand monitor
 */
export const getMonitorAlerts = async (
  args: { monitorId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { monitorId } = args

  // Verify user has access to monitor's workspace
  const monitor = await prisma.brandMonitor.findUnique({
    where: { id: monitorId },
    select: { workspaceId: true },
  })

  if (!monitor) {
    throw new HttpError(404, 'Monitor not found')
  }

  const hasAccess = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: context.user.id,
        workspaceId: monitor.workspaceId,
      },
    },
  })

  if (!hasAccess) {
    throw new HttpError(403, 'Not authorized')
  }

  const alerts = await prisma.brandAlert.findMany({
    where: {
      monitorId: monitorId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return alerts
}

/**
 * Get a single alert by ID
 */
export const getAlertDetails = async (
  args: { alertId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { alertId } = args

  const alert = await prisma.brandAlert.findUnique({
    where: { id: alertId },
    include: {
      monitor: true,
      brand: true,
    },
  })

  if (!alert) {
    throw new HttpError(404, 'Alert not found')
  }

  // Verify user has access to alert's workspace
  const hasAccess = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: context.user.id,
        workspaceId: alert.workspaceId,
      },
    },
  })

  if (!hasAccess) {
    throw new HttpError(403, 'Not authorized')
  }

  return alert
}

/**
 * Update alert status
 */
export const updateAlertStatus = async (
  args: { alertId: string; status: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const { alertId, status } = args

  const alert = await prisma.brandAlert.findUnique({
    where: { id: alertId },
  })

  if (!alert) {
    throw new HttpError(404, 'Alert not found')
  }

  // Verify user has access to alert's workspace
  const hasAccess = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: context.user.id,
        workspaceId: alert.workspaceId,
      },
    },
  })

  if (!hasAccess) {
    throw new HttpError(403, 'Not authorized')
  }

  return prisma.brandAlert.update({
    where: { id: alertId },
    data: { status },
  })
}
