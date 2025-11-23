import { HttpError } from 'wasp/server';
import type {
  EclipseBrand,
  BrandMonitor,
  BrandAlert,
  BrandInfringement,
  InfringementAction,
} from 'wasp/entities';
import { enforcePlanLimit } from '../../payment/planLimits';
import { FeatureChecker } from '../../features/FeatureChecker';
import Redis from 'ioredis';
import type {
  CreateBrandInput,
  UpdateBrandInput,
  CreateMonitorInput,
  UpdateMonitorInput,
  CreateAlertInput,
  CreateInfringementInput,
  UpdateInfringementInput,
  CreateActionInput,
  UpdateActionInput,
  BrandFilters,
  MonitorFilters,
  AlertFilters,
  InfringementFilters,
  ActionFilters,
  DashboardData,
  BrandStats,
  MonitoringMetrics,
} from './types';
import {
  createBrandSchema,
  updateBrandSchema,
  createMonitorSchema,
  updateMonitorSchema,
  createAlertSchema,
  createInfringementSchema,
  updateInfringementSchema,
  createActionSchema,
  updateActionSchema,
} from './validation';
import { checkWorkspaceAccess, canManageBrand, canManageMonitor, canManageInfringement } from './utils/permissions';
import {
  logBrandCreated,
  logBrandUpdated,
  logBrandDeleted,
  logMonitorCreated,
  logMonitorUpdated,
  logAlertCreated,
  logAlertAcknowledged,
  logAlertEscalated,
  logInfringementCreated,
  logInfringementUpdated,
  logActionCreated,
  logActionCompleted,
} from './utils/audit';
import {
  notifyBrandAlert,
  notifyInfringementCreated,
  notifyInfringementResolved,
  notifyActionAssigned,
  notifyAegisIncidentCreated,
} from './utils/notifications';
import { enqueueMonitoringTask } from './queue/producer';
import { shouldCreateAegisIncident, createAegisIncidentFromInfringement } from './integrations/aegis';
import {
  notifyBrandCreated,
  notifyBrandUpdated,
  notifyBrandDeleted,
  notifyMonitorStatusChanged,
  notifyAlertCreated,
  notifyAlertEscalated,
  notifyInfringementCreated as notifyInfringementCreatedEvent,
  notifyActionCreated as notifyActionCreatedEvent,
  notifyActionAssigned as notifyActionAssignedEvent,
  notifyBulkActionCompleted,
} from './eventBus';

// ============================================
// Brand Operations
// ============================================

export const getEclipseBrands = async (
  args: BrandFilters,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check brand monitoring feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.brand_protection'
  );

  const where: any = {
    workspaceId: args.workspaceId,
  };

  if (args.status) {
    where.status = Array.isArray(args.status) ? { in: args.status } : args.status;
  }

  if (args.priority && args.priority.length > 0) {
    where.priority = { in: args.priority };
  }

  if (args.createdAfter) {
    where.createdAt = { ...where.createdAt, gte: args.createdAfter };
  }

  if (args.createdBefore) {
    where.createdAt = { ...where.createdAt, lte: args.createdBefore };
  }

  if (args.search) {
    where.OR = [
      { name: { contains: args.search, mode: 'insensitive' } },
      { description: { contains: args.search, mode: 'insensitive' } },
    ];
  }

  const limit = args.limit || 50;
  const offset = args.offset || 0;

  const [brands, total] = await Promise.all([
    context.entities.EclipseBrand.findMany({
      where,
      include: {
        monitors: true,
        infringements: {
          where: {
            status: {
              notIn: ['resolved', 'false_positive'],
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    context.entities.EclipseBrand.count({ where }),
  ]);

  return {
    data: brands,
    total,
    limit,
    offset,
    hasMore: offset + brands.length < total,
  };
};

export const getEclipseBrandById = async (
  args: { id: string; workspaceId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const brand = await context.entities.EclipseBrand.findUnique({
    where: { id: args.id },
    include: {
      workspace: true,
      monitors: {
        include: {
          alerts: {
            where: {
              status: {
                notIn: ['dismissed', 'resolved'],
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      },
      infringements: {
        include: {
          actions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!brand) {
    throw new HttpError(404, 'Brand not found');
  }

  await checkWorkspaceAccess(context, brand.workspaceId);

  return brand;
};

export const createEclipseBrand = async (
  args: CreateBrandInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = createBrandSchema.parse(args);
  await checkWorkspaceAccess(context, validatedArgs.workspaceId);

  // 🚀 Check feature availability first
  await FeatureChecker.requireFeature(
    context,
    validatedArgs.workspaceId,
    'eclipse.brand_protection'
  );

  // ✅ Enforce plan limit for max trackers (Eclipse Brands)
  await enforcePlanLimit(
    context,
    validatedArgs.workspaceId,
    'maxTrackersPerWorkspace',
    undefined,
    'Your plan limit for Eclipse Brands has been reached. Please upgrade your plan to add more brands.',
    'eclipse.brand_protection'
  );

  const brand = await context.entities.EclipseBrand.create({
    data: {
      ...validatedArgs,
      createdBy: context.user.id,
    },
  });

  await logBrandCreated(context, brand);
  
  // Real-time notification
  await notifyBrandCreated(
    validatedArgs.workspaceId,
    context.user.id,
    brand,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return brand;
};

export const updateEclipseBrand = async (
  args: { id: string } & UpdateBrandInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = updateBrandSchema.parse(args);
  const { id, ...updateData } = args;

  const brand = await context.entities.EclipseBrand.findUnique({
    where: { id },
  });

  if (!brand) {
    throw new HttpError(404, 'Brand not found');
  }

  await canManageBrand(context, brand);

  // Check if brand protection feature is available
  await FeatureChecker.requireFeature(
    context,
    brand.workspaceId,
    'eclipse.brand_protection'
  );

  const updatedBrand = await context.entities.EclipseBrand.update({
    where: { id },
    data: {
      ...updateData,
      lastModifiedBy: context.user.id,
    },
  });

  await logBrandUpdated(context, updatedBrand, updateData);
  
  // Real-time notification
  await notifyBrandUpdated(
    brand.workspaceId,
    context.user.id,
    updatedBrand,
    updateData,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return updatedBrand;
};

export const deleteEclipseBrand = async (
  args: { id: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const brand = await context.entities.EclipseBrand.findUnique({
    where: { id: args.id },
  });

  if (!brand) {
    throw new HttpError(404, 'Brand not found');
  }

  await canManageBrand(context, brand);

  // Check if brand protection feature is available
  await FeatureChecker.requireFeature(
    context,
    brand.workspaceId,
    'eclipse.brand_protection'
  );

  await context.entities.EclipseBrand.delete({
    where: { id: args.id },
  });

  await logBrandDeleted(context, brand);
  
  // Real-time notification
  await notifyBrandDeleted(
    brand.workspaceId,
    context.user.id,
    brand.id,
    brand.name,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return { success: true };
};

// ============================================
// Monitor Operations
// ============================================

export const getEclipseMonitors = async (
  args: MonitorFilters,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check domain monitoring feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.domain_monitoring'
  );

  const where: any = {
    workspaceId: args.workspaceId,
  };

  if (args.brandId) {
    where.brandId = args.brandId;
  }

  if (args.monitoringType) {
    where.monitoringType = Array.isArray(args.monitoringType)
      ? { in: args.monitoringType }
      : args.monitoringType;
  }

  if (args.status) {
    where.status = Array.isArray(args.status) ? { in: args.status } : args.status;
  }

  if (args.source) {
    where.source = Array.isArray(args.source) ? { in: args.source } : args.source;
  }

  const limit = args.limit || 50;
  const offset = args.offset || 0;

  const [monitors, total] = await Promise.all([
    context.entities.BrandMonitor.findMany({
      where,
      include: {
        brand: true,
        alerts: {
          where: {
            status: {
              notIn: ['dismissed', 'resolved'],
            },
          },
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    context.entities.BrandMonitor.count({ where }),
  ]);

  return {
    data: monitors,
    total,
    limit,
    offset,
    hasMore: offset + monitors.length < total,
  };
};

export const getMonitorDetails = async (
  args: { id: string; workspaceId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const monitor = await context.entities.BrandMonitor.findUnique({
    where: { id: args.id },
    include: {
      brand: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      alerts: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        include: {
          brand: true,
          infringement: true,
        },
      },
    },
  });

  if (!monitor) {
    throw new HttpError(404, 'Monitor not found');
  }

  if (monitor.workspaceId !== args.workspaceId) {
    throw new HttpError(403, 'Not authorized to view this monitor');
  }

  return monitor;
};

export const createEclipseMonitor = async (
  args: CreateMonitorInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = createMonitorSchema.parse(args);
  await checkWorkspaceAccess(context, validatedArgs.workspaceId);

  // 🚀 Check feature availability first
  await FeatureChecker.requireFeature(
    context,
    validatedArgs.workspaceId,
    'eclipse.domain_monitoring'
  );

  // ✅ Enforce plan limit for max data sources (Eclipse Monitors)
  await enforcePlanLimit(
    context,
    validatedArgs.workspaceId,
    'maxDataSourcesPerWorkspace',
    undefined,
    'Your plan limit for Eclipse Monitors has been reached. Please upgrade your plan to add more monitors.',
    'eclipse.domain_monitoring'
  );

  const brand = await context.entities.EclipseBrand.findUnique({
    where: { id: validatedArgs.brandId },
  });

  if (!brand) {
    throw new HttpError(404, 'Brand not found');
  }

  await canManageBrand(context, brand);

  const monitor = await context.entities.BrandMonitor.create({
    data: validatedArgs,
  });

  await logMonitorCreated(context, monitor, brand);

  // Enfileira primeira execução se automático
  if (monitor.isAutomated) {
    try {
      await enqueueMonitoringTask(monitor);
    } catch (error) {
      console.warn('Failed to enqueue initial monitoring task:', error);
    }
  }

  return monitor;
};

export const updateEclipseMonitor = async (
  args: { id: string } & UpdateMonitorInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = updateMonitorSchema.parse(args);
  const { id, ...updateData } = args;

  const monitor = await context.entities.BrandMonitor.findUnique({
    where: { id },
  });

  if (!monitor) {
    throw new HttpError(404, 'Monitor not found');
  }

  await canManageMonitor(context, monitor);

  // Check if brand monitoring feature is available
  await FeatureChecker.requireFeature(
    context,
    monitor.workspaceId,
    'eclipse.brand_monitoring'
  );

  const updatedMonitor = await context.entities.BrandMonitor.update({
    where: { id },
    data: updateData,
  });

  await logMonitorUpdated(context, updatedMonitor, updateData);

  return updatedMonitor;
};

// ============================================
// Monitor Testing
// ============================================

export const testEclipseMonitor = async (
  args: { id: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const { id } = args;

  const monitor = await context.entities.BrandMonitor.findUnique({
    where: { id },
    include: {
      brand: true,
    },
  });

  if (!monitor) {
    throw new HttpError(404, 'Monitor not found');
  }

  await canManageMonitor(context, monitor);

  // Enqueue test task to Redis
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Create test task payload
    const testPayload = {
      type: 'CRAWL_MONITOR',
      monitorId: monitor.id,
      brandId: monitor.brandId,
      workspaceId: monitor.workspaceId,
      searchTerms: monitor.searchTerms,
      excludeTerms: monitor.excludeTerms,
      keywords: monitor.keywords,
      targetRegions: monitor.targetRegions,
      targetLanguages: monitor.targetLanguages,
      yaraRules: monitor.yaraRules || '',
      regexPatterns: monitor.regexPatterns,
      domainPatterns: monitor.domainPatterns,
      confidenceThreshold: monitor.confidenceThreshold,
      matchingRulesNeeded: monitor.matchingRulesNeeded,
      enableScreenshots: monitor.enableScreenshots,
      enableOCR: monitor.enableOCR,
      deepAnalysis: monitor.deepAnalysis,
      createdAt: new Date().toISOString(),
      source: monitor.source,
      isTest: true, // Mark as test task
    };

    const QUEUE_NAME = process.env.SENTINEL_QUEUE_NAME || 'sentinel_tasks';
    await redis.lpush(QUEUE_NAME, JSON.stringify(testPayload));
    await redis.quit();

    // Update monitor status to testing
    const updatedMonitor = await context.entities.BrandMonitor.update({
      where: { id },
      data: { status: 'testing' },
    });

    await logMonitorUpdated(context, updatedMonitor, { status: 'testing' });

    return {
      success: true,
      message: 'Monitor de teste enfileirado com sucesso',
      monitorId: id,
      status: 'testing',
    };
  } catch (error: any) {
    console.error('Error enqueueing test task:', error);
    throw new HttpError(500, `Erro ao testar monitor: ${error.message}`);
  }
};

// ============================================
// Alert Operations
// ============================================

export const getEclipseAlerts = async (
  args: AlertFilters,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check real-time alerts feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.real_time_alerts'
  );

  const where: any = {
    workspaceId: args.workspaceId,
  };

  if (args.monitorId) {
    where.monitorId = args.monitorId;
  }

  if (args.brandId) {
    where.brandId = args.brandId;
  }

  if (args.severity) {
    where.severity = Array.isArray(args.severity) ? { in: args.severity } : args.severity;
  }

  if (args.status) {
    where.status = Array.isArray(args.status) ? { in: args.status } : args.status;
  }

  if (args.createdAfter) {
    where.createdAt = { ...where.createdAt, gte: args.createdAfter };
  }

  if (args.createdBefore) {
    where.createdAt = { ...where.createdAt, lte: args.createdBefore };
  }

  // Advanced filters: tags
  if (args.tags && args.tags.length > 0) {
    where.OR = args.tags.map((tag) => ({
      metadata: {
        path: ['tags'],
        array_contains: tag,
      },
    }));
  }

  // Advanced filters: regex search
  if (args.searchRegex) {
    const regexPattern = args.searchRegex;
    where.OR = [
      { title: { contains: regexPattern, mode: 'insensitive' } },
      { url: { contains: regexPattern, mode: 'insensitive' } },
      { description: { contains: regexPattern, mode: 'insensitive' } },
    ];
  }

  const limit = args.limit || 100;
  const offset = args.offset || 0;

  const [alerts, total] = await Promise.all([
    context.entities.BrandAlert.findMany({
      where,
      include: {
        monitor: true,
        brand: true,
        infringement: true,
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    context.entities.BrandAlert.count({ where }),
  ]);

  return {
    data: alerts,
    total,
    limit,
    offset,
    hasMore: offset + alerts.length < total,
  };
};

export const createEclipseAlert = async (
  args: CreateAlertInput,
  context: any
) => {
  const validatedArgs = createAlertSchema.parse(args);

  const monitor = await context.entities.BrandMonitor.findUnique({
    where: { id: validatedArgs.monitorId },
    include: { brand: true },
  });

  if (!monitor) {
    throw new HttpError(404, 'Monitor not found');
  }

  // 🚀 Check feature availability first
  await FeatureChecker.requireFeature(
    context,
    monitor.brand.workspaceId,
    'eclipse.real_time_alerts'
  );

  // ✅ Enforce plan limit for max detections per month
  await enforcePlanLimit(
    context,
    monitor.brand.workspaceId,
    'maxDetectionsPerMonth',
    undefined,
    'Your plan limit for Eclipse detections this month has been reached. Please upgrade your plan or wait until next month.',
    'eclipse.real_time_alerts'
  );

  const alert = await context.entities.BrandAlert.create({
    data: validatedArgs,
  });

  await logAlertCreated(context, alert, monitor.brand);
  await notifyBrandAlert(context, alert, monitor.brand);
  
  // Real-time WebSocket notification
  await notifyAlertCreated(
    monitor.brand.workspaceId,
    alert,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  // Update monitor stats
  await context.entities.BrandMonitor.update({
    where: { id: monitor.id },
    data: {
      detectionsThisMonth: { increment: 1 },
      detectionsTotalTime: { increment: 1 },
      successfulRuns: { increment: 1 },
    },
  });

  return alert;
};

export const acknowledgeEclipseAlert = async (
  args: { id: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const alert = await context.entities.BrandAlert.findUnique({
    where: { id: args.id },
  });

  if (!alert) {
    throw new HttpError(404, 'Alert not found');
  }

  await checkWorkspaceAccess(context, alert.workspaceId);

  const updatedAlert = await context.entities.BrandAlert.update({
    where: { id: args.id },
    data: {
      status: 'acknowledged',
    },
  });

  await logAlertAcknowledged(context, updatedAlert);

  return updatedAlert;
};

// ============================================
// Infringement Operations
// ============================================

export const getEclipseInfringements = async (
  args: InfringementFilters,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check infringement management feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.infringement_management'
  );

  const where: any = {
    workspaceId: args.workspaceId,
  };

  if (args.brandId) {
    where.brandId = args.brandId;
  }

  if (args.type) {
    where.type = Array.isArray(args.type) ? { in: args.type } : args.type;
  }

  if (args.status) {
    where.status = Array.isArray(args.status) ? { in: args.status } : args.status;
  }

  if (args.severity) {
    where.severity = Array.isArray(args.severity) ? { in: args.severity } : args.severity;
  }

  if (args.createdAfter) {
    where.createdAt = { ...where.createdAt, gte: args.createdAfter };
  }

  if (args.createdBefore) {
    where.createdAt = { ...where.createdAt, lte: args.createdBefore };
  }

  // Advanced filters: assignedTo (via actions)
  if (args.assignedTo) {
    where.actions = {
      some: {
        assignedTo: args.assignedTo,
      },
    };
  }

  // Advanced filters: tags
  if (args.tags && args.tags.length > 0) {
    where.OR = args.tags.map((tag) => ({
      metadata: {
        path: ['tags'],
        array_contains: tag,
      },
    }));
  }

  // Advanced filters: regex search
  if (args.searchRegex) {
    const regexPattern = args.searchRegex;
    where.OR = [
      { title: { contains: regexPattern, mode: 'insensitive' } },
      { url: { contains: regexPattern, mode: 'insensitive' } },
      { description: { contains: regexPattern, mode: 'insensitive' } },
      { domain: { contains: regexPattern, mode: 'insensitive' } },
    ];
  }

  const limit = args.limit || 50;
  const offset = args.offset || 0;

  const [infringements, total] = await Promise.all([
    context.entities.BrandInfringement.findMany({
      where,
      include: {
        brand: true,
        actions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        incident: true,
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    context.entities.BrandInfringement.count({ where }),
  ]);

  return {
    data: infringements,
    total,
    limit,
    offset,
    hasMore: offset + infringements.length < total,
  };
};

export const createEclipseInfringement = async (
  args: CreateInfringementInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = createInfringementSchema.parse(args);
  await checkWorkspaceAccess(context, validatedArgs.workspaceId);

  // 🚀 Check feature availability first
  await FeatureChecker.requireFeature(
    context,
    validatedArgs.workspaceId,
    'eclipse.infringement_management'
  );

  const brand = await context.entities.EclipseBrand.findUnique({
    where: { id: validatedArgs.brandId },
  });

  if (!brand) {
    throw new HttpError(404, 'Brand not found');
  }

  const infringement = await context.entities.BrandInfringement.create({
    data: {
      ...validatedArgs,
      detectedBy: context.user.id,
    },
  });

  await logInfringementCreated(context, infringement, brand);
  await notifyInfringementCreated(context, infringement, brand);

  // Try to create Aegis incident automatically if applicable
  try {
    if (shouldCreateAegisIncident(infringement)) {
      const incident = await createAegisIncidentFromInfringement(
        context,
        infringement,
        brand
      );

      if (incident) {
        await notifyAegisIncidentCreated(context, infringement, brand, incident);
      }
    }
  } catch (error) {
    console.warn('Aegis integration failed (non-blocking):', error);
  }

  return infringement;
};

export const escalateEclipseAlert = async (
  args: { alertId: string; infringementData: Partial<CreateInfringementInput> },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const alert = await context.entities.BrandAlert.findUnique({
    where: { id: args.alertId },
    include: { brand: true, monitor: true },
  });

  if (!alert) {
    throw new HttpError(404, 'Alert not found');
  }

  await checkWorkspaceAccess(context, alert.workspaceId);

  // Create infringement from alert
  const infringement = await context.entities.BrandInfringement.create({
    data: {
      workspaceId: alert.workspaceId,
      brandId: alert.brandId,
      title: args.infringementData.title || alert.title,
      description: args.infringementData.description || alert.description || '',
      url: args.infringementData.url || alert.url || '',
      domain: args.infringementData.domain || new URL(alert.url || 'http://unknown.com').hostname,
      type: args.infringementData.type || 'counterfeiting',
      severity: args.infringementData.severity || alert.severity,
      detectedBy: context.user.id,
    },
  });

  // Update alert to link to infringement
  await context.entities.BrandAlert.update({
    where: { id: args.alertId },
    data: {
      status: 'escalated',
      infringementId: infringement.id,
    },
  });

  await logAlertEscalated(context, alert, infringement);
  await notifyInfringementCreated(context, infringement, alert.brand);
  
  // Real-time WebSocket notifications
  await notifyAlertEscalated(
    alert.workspaceId,
    context.user.id,
    alert,
    infringement,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );
  
  await notifyInfringementCreatedEvent(
    infringement.workspaceId,
    context.user.id,
    infringement,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return infringement;
};

export const updateEclipseInfringementStatus = async (
  args: { id: string } & UpdateInfringementInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = updateInfringementSchema.parse(args);
  const { id, ...updateData } = args;

  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id },
    include: { brand: true },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  await canManageInfringement(context, infringement);

  // Check if infringement management feature is available
  await FeatureChecker.requireFeature(
    context,
    infringement.workspaceId,
    'eclipse.infringement_management'
  );

  const updatedInfringement = await context.entities.BrandInfringement.update({
    where: { id },
    data: {
      ...updateData,
      resolvedAt: updateData.status === 'resolved' ? new Date() : undefined,
    },
  });

  await logInfringementUpdated(context, updatedInfringement, updateData);

  if (updateData.status === 'resolved') {
    await notifyInfringementResolved(context, updatedInfringement, infringement.brand);
  }

  return updatedInfringement;
};

// ============================================
// Action Operations
// ============================================

export const getEclipseActions = async (
  args: ActionFilters,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const where: any = {
    workspaceId: args.workspaceId,
  };

  if (args.infringementId) {
    where.infringementId = args.infringementId;
  }

  if (args.actionType) {
    where.actionType = Array.isArray(args.actionType)
      ? { in: args.actionType }
      : args.actionType;
  }

  if (args.status) {
    where.status = Array.isArray(args.status) ? { in: args.status } : args.status;
  }

  if (args.assignedTo) {
    where.assignedTo = args.assignedTo;
  }

  // Advanced filters: priority
  if (args.priority) {
    where.priority = Array.isArray(args.priority) ? { in: args.priority } : args.priority;
  }

  // Advanced filters: date range
  if (args.createdAfter) {
    where.createdAt = { ...where.createdAt, gte: args.createdAfter };
  }

  if (args.createdBefore) {
    where.createdAt = { ...where.createdAt, lte: args.createdBefore };
  }

  // Advanced filters: tags
  if (args.tags && args.tags.length > 0) {
    where.OR = args.tags.map((tag) => ({
      metadata: {
        path: ['tags'],
        array_contains: tag,
      },
    }));
  }

  // Advanced filters: regex search
  if (args.searchRegex) {
    const regexPattern = args.searchRegex;
    where.OR = [
      { actionType: { contains: regexPattern, mode: 'insensitive' } },
      { notes: { contains: regexPattern, mode: 'insensitive' } },
      { result: { contains: regexPattern, mode: 'insensitive' } },
    ];
  }

  const limit = args.limit || 50;
  const offset = args.offset || 0;

  const [actions, total] = await Promise.all([
    context.entities.InfringementAction.findMany({
      where,
      include: {
        infringement: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    context.entities.InfringementAction.count({ where }),
  ]);

  return {
    data: actions,
    total,
    limit,
    offset,
    hasMore: offset + actions.length < total,
  };
};

export const getActionDetails = async (
  args: { id: string; workspaceId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const action = await context.entities.InfringementAction.findUnique({
    where: { id: args.id },
    include: {
      infringement: {
        include: {
          brand: true,
          alerts: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!action) {
    throw new HttpError(404, 'Action not found');
  }

  if (action.workspaceId !== args.workspaceId) {
    throw new HttpError(403, 'Not authorized to view this action');
  }

  return action;
};

export const createEclipseAction = async (
  args: CreateActionInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = createActionSchema.parse(args);
  await checkWorkspaceAccess(context, validatedArgs.workspaceId);

  // Check if automated takedowns feature is available
  await FeatureChecker.requireFeature(
    context,
    validatedArgs.workspaceId,
    'eclipse.automated_takedowns'
  );

  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id: validatedArgs.infringementId },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  const action = await context.entities.InfringementAction.create({
    data: validatedArgs,
  });

  await logActionCreated(context, action, infringement);

  if (action.assignedTo) {
    await notifyActionAssigned(context, action, infringement);
    
    // Real-time WebSocket notification for assignment
    const assignedToUser = await context.entities.User.findUnique({
      where: { id: action.assignedTo },
    });
    
    await notifyActionAssignedEvent(
      action.workspaceId,
      context.user.id,
      action,
      action.assignedTo,
      assignedToUser,
      { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
    );
  }
  
  // Real-time WebSocket notification for action creation
  await notifyActionCreatedEvent(
    action.workspaceId,
    context.user.id,
    action,
    infringement,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return action;
};

export const updateEclipseActionStatus = async (
  args: { id: string } & UpdateActionInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const validatedArgs = updateActionSchema.parse(args);
  const { id, ...updateData } = args;

  const action = await context.entities.InfringementAction.findUnique({
    where: { id },
  });

  if (!action) {
    throw new HttpError(404, 'Action not found');
  }

  await checkWorkspaceAccess(context, action.workspaceId);

  // Check if automated takedowns feature is available
  await FeatureChecker.requireFeature(
    context,
    action.workspaceId,
    'eclipse.automated_takedowns'
  );

  const updatedAction = await context.entities.InfringementAction.update({
    where: { id },
    data: updateData,
  });

  if (updateData.status === 'completed') {
    await logActionCompleted(context, updatedAction);
  }

  return updatedAction;
};

// ============================================
// Stats & Dashboard Operations
// ============================================

export const getEclipseBrandStats = async (
  args: { workspaceId: string },
  context: any
): Promise<BrandStats> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const [totalBrands, activeBrands, infringements, actions] = await Promise.all([
    context.entities.EclipseBrand.count({
      where: { workspaceId: args.workspaceId },
    }),
    context.entities.EclipseBrand.count({
      where: {
        workspaceId: args.workspaceId,
        status: 'active',
      },
    }),
    context.entities.BrandInfringement.findMany({
      where: { workspaceId: args.workspaceId },
    }),
    context.entities.InfringementAction.findMany({
      where: { workspaceId: args.workspaceId },
    }),
  ]);

  const unresolvedInfringements = infringements.filter(
    (i: BrandInfringement) => !['resolved', 'false_positive'].includes(i.status)
  ).length;

  const criticalInfringements = infringements.filter(
    (i: BrandInfringement) => i.severity === 'critical' && !['resolved', 'false_positive'].includes(i.status)
  ).length;

  const actionsCompleted = actions.filter((a: InfringementAction) => a.status === 'completed').length;
  const actionsPending = actions.filter((a: InfringementAction) => a.status === 'pending').length;

  return {
    totalBrands,
    activeBrands,
    monitoringCoverage: activeBrands > 0 ? (activeBrands / totalBrands) * 100 : 0,
    totalInfringements: infringements.length,
    unresolvedInfringements,
    criticalInfringements,
    actionsCompleted,
    actionsPending,
  };
};

export const getEclipseMonitoringMetrics = async (
  args: { workspaceId: string },
  context: any
): Promise<MonitoringMetrics> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const monitors = await context.entities.BrandMonitor.findMany({
    where: { workspaceId: args.workspaceId },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAlerts = await context.entities.BrandAlert.count({
    where: {
      workspaceId: args.workspaceId,
      createdAt: {
        gte: today,
      },
    },
  });

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthAlerts = await context.entities.BrandAlert.count({
    where: {
      workspaceId: args.workspaceId,
      createdAt: {
        gte: thisMonthStart,
      },
    },
  });

  const allAlerts = await context.entities.BrandAlert.findMany({
    where: { workspaceId: args.workspaceId },
  });

  const avgConfidence =
    allAlerts.length > 0
      ? allAlerts.reduce((sum: number, a: BrandAlert) => sum + a.confidence, 0) / allAlerts.length
      : 0;

  const infringements = await context.entities.BrandInfringement.findMany({
    where: { workspaceId: args.workspaceId },
  });

  const threatTypeCounts = infringements.reduce((acc: Record<string, number>, inf: BrandInfringement) => {
    acc[inf.type] = (acc[inf.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topThreatTypes = Object.entries(threatTypeCounts)
    .map(([type, count]) => ({ type, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalMonitors: monitors.length,
    activeMonitors: monitors.filter((m: BrandMonitor) => m.status === 'active').length,
    detectionsToday: todayAlerts,
    detectionsThisMonth: thisMonthAlerts,
    averageConfidence: Math.round(avgConfidence),
    topThreatTypes,
  };
};

export const getEclipseDashboardData = async (
  args: { workspaceId: string },
  context: any
): Promise<DashboardData> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check analytics feature availability
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.analytics_reports'
  );

  // Calcular dados de tendência (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const alertsLast30Days = await context.entities.BrandAlert.findMany({
    where: {
      workspaceId: args.workspaceId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      severity: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const infringementsLast30Days = await context.entities.BrandInfringement.findMany({
    where: {
      workspaceId: args.workspaceId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      severity: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Agrupar por dia
  const trendData: Array<{ date: string; alerts: number; infringements: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const alertsCount = alertsLast30Days.filter(
      (a: any) => new Date(a.createdAt) >= date && new Date(a.createdAt) < nextDay
    ).length;

    const infringementsCount = infringementsLast30Days.filter(
      (i: any) => new Date(i.createdAt) >= date && new Date(i.createdAt) < nextDay
    ).length;

    trendData.push({
      date: date.toISOString().split('T')[0],
      alerts: alertsCount,
      infringements: infringementsCount,
    });
  }

  const [brands, stats, metrics, recentAlerts, criticalInfringements] = await Promise.all([
    context.entities.EclipseBrand.findMany({
      where: { workspaceId: args.workspaceId },
      include: {
        monitors: true,
        infringements: {
          where: {
            status: {
              notIn: ['resolved', 'false_positive'],
            },
          },
        },
      },
    }),
    getEclipseBrandStats(args, context),
    getEclipseMonitoringMetrics(args, context),
    context.entities.BrandAlert.findMany({
      where: {
        workspaceId: args.workspaceId,
        status: {
          notIn: ['dismissed', 'resolved'],
        },
      },
      include: {
        brand: true,
        monitor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),
    context.entities.BrandInfringement.findMany({
      where: {
        workspaceId: args.workspaceId,
        severity: 'critical',
        status: {
          notIn: ['resolved', 'false_positive'],
        },
      },
      include: {
        brand: true,
        actions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),
  ]);

  return {
    brands,
    stats,
    metrics,
    recentAlerts,
    criticalInfringements,
    trendData,
  };
};

export const getInfringementDetails = async (
  args: { infringementId: string; workspaceId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id: args.infringementId },
    include: {
      brand: {
        include: {
          monitors: true,
        },
      },
      actions: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      alerts: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      incident: true,
    },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  if (infringement.workspaceId !== args.workspaceId) {
    throw new HttpError(403, 'Not authorized to view this infringement');
  }

  return infringement;
};

// Aegis Integration Operations
// ============================================

/**
 * Escala uma infração para investigação formal no Aegis
 */
export const escalateInfringementToAegis = async (
  args: { infringementId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id: args.infringementId },
    include: { brand: true },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  await canManageInfringement(context, infringement);

  // Se já foi escalado, retorna o incident existente
  if (infringement.aegisIncidentId) {
    const existingIncident = await context.entities.Incident.findUnique({
      where: { id: infringement.aegisIncidentId },
    });

    if (existingIncident) {
      return {
        success: true,
        message: 'Infringement already escalated to Aegis',
        incident: existingIncident,
      };
    }
  }

  try {
    // Cria incident no Aegis automaticamente
    const incident = await createAegisIncidentFromInfringement(
      context,
      infringement,
      infringement.brand
    );

    // Atualiza status da infração
    const updatedInfringement = await context.entities.BrandInfringement.update({
      where: { id: infringement.id },
      data: {
        status: 'escalated_to_aegis',
      },
    });

    // Log de auditoria
    await logInfringementUpdated(context, updatedInfringement, { status: 'escalated_to_aegis' });

    return {
      success: true,
      message: 'Infringement escalated to Aegis successfully',
      incident,
      infringement: updatedInfringement,
    };
  } catch (error) {
    console.error('Error escalating to Aegis:', error);
    throw new HttpError(500, 'Failed to escalate infringement to Aegis');
  }
};

/**
 * Sincroniza o status entre BrandInfringement e Incident do Aegis
 */
export const syncInfringementAegisStatus = async (
  args: { infringementId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id: args.infringementId },
    include: { incident: true },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  await canManageInfringement(context, infringement);

  // Se não tem incident vinculado, não há o que sincronizar
  if (!infringement.aegisIncidentId) {
    return {
      success: false,
      message: 'Infringement not escalated to Aegis',
      syncStatus: 'not_escalated',
    };
  }

  try {
    const incident = await context.entities.Incident.findUnique({
      where: { id: infringement.aegisIncidentId },
    });

    if (!incident) {
      throw new HttpError(404, 'Linked Aegis incident not found');
    }

    // Mapeia status Aegis para Eclipse
    const statusMapping: Record<string, string> = {
      ACTIVE: 'escalated_to_aegis',
      RESOLVED: 'resolved',
      INVESTIGATING: 'investigating',
    };

    const newStatus = statusMapping[incident.status] || 'investigating';

    // Se status mudou no Aegis, atualiza na infração
    if (newStatus !== infringement.status) {
      const updatedInfringement = await context.entities.BrandInfringement.update({
        where: { id: infringement.id },
        data: {
          status: newStatus,
          resolvedAt: incident.status === 'RESOLVED' ? new Date() : null,
        },
      });

      await logInfringementUpdated(context, updatedInfringement, { status: newStatus });

      return {
        success: true,
        message: `Status synchronized: ${statusMapping[incident.status]}`,
        syncStatus: 'synced',
        infringementStatus: newStatus,
        incidentStatus: incident.status,
        infringement: updatedInfringement,
      };
    }

    return {
      success: true,
      message: 'Infringement already in sync with Aegis',
      syncStatus: 'synced',
      infringementStatus: infringement.status,
      incidentStatus: incident.status,
    };
  } catch (error) {
    console.error('Error syncing Aegis status:', error);
    throw new HttpError(500, 'Failed to synchronize Aegis status');
  }
};

/**
 * Obtém informações de casos/incidents do Aegis vinculados a uma infração
 */
export const getLinkedAegisIncident = async (
  args: { infringementId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id: args.infringementId },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  await checkWorkspaceAccess(context, infringement.workspaceId);

  if (!infringement.aegisIncidentId) {
    return {
      hasIncident: false,
      message: 'Infringement not escalated to Aegis',
    };
  }

  try {
    const incident = await context.entities.Incident.findUnique({
      where: { id: infringement.aegisIncidentId },
      include: {
        cases: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    if (!incident) {
      // Incident foi deletado, limpa a referência
      await context.entities.BrandInfringement.update({
        where: { id: infringement.id },
        data: {
          aegisIncidentId: null,
          aegisSyncStatus: 'error',
          aegisSyncError: 'Linked incident not found',
        },
      });

      return {
        hasIncident: false,
        message: 'Linked Aegis incident was deleted',
      };
    }

    return {
      hasIncident: true,
      incident: {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        status: incident.status,
        severity: incident.severity,
        priority: incident.priority,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        assignedTo: incident.assignedTo,
        cases: incident.cases,
        tasks: incident.tasks,
      },
    };
  } catch (error) {
    console.error('Error fetching linked Aegis incident:', error);
    throw new HttpError(500, 'Failed to fetch Aegis incident');
  }
};

// ============================================
// Export/Import Operations
// ============================================

export const exportEclipseData = async (
  args: {
    workspaceId: string;
    resourceType: 'alerts' | 'infringements' | 'actions';
    format: 'csv' | 'json';
    filters?: any;
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  let data: any[] = [];

  switch (args.resourceType) {
    case 'alerts':
      data = await context.entities.BrandAlert.findMany({
        where: {
          workspaceId: args.workspaceId,
          ...args.filters,
        },
        include: {
          brand: true,
          monitor: true,
          infringement: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      break;

    case 'infringements':
      data = await context.entities.BrandInfringement.findMany({
        where: {
          workspaceId: args.workspaceId,
          ...args.filters,
        },
        include: {
          brand: true,
          actions: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      break;

    case 'actions':
      data = await context.entities.InfringementAction.findMany({
        where: {
          workspaceId: args.workspaceId,
          ...args.filters,
        },
        include: {
          infringement: {
            include: {
              brand: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      break;

    default:
      throw new HttpError(400, 'Invalid resource type');
  }

  return {
    resourceType: args.resourceType,
    format: args.format,
    count: data.length,
    data,
    exportedAt: new Date().toISOString(),
  };
};

export const generateEclipseReport = async (
  args: {
    workspaceId: string;
    startDate?: Date;
    endDate?: Date;
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const workspace = await context.entities.Workspace.findUnique({
    where: { id: args.workspaceId },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const startDate = args.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = args.endDate || new Date();

  const dateFilter = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [brands, monitors, alerts, infringements, actions] = await Promise.all([
    context.entities.EclipseBrand.count({
      where: { workspaceId: args.workspaceId },
    }),
    context.entities.BrandMonitor.count({
      where: { workspaceId: args.workspaceId, status: 'active' },
    }),
    context.entities.BrandAlert.findMany({
      where: {
        workspaceId: args.workspaceId,
        ...dateFilter,
      },
      include: {
        brand: true,
        monitor: true,
      },
    }),
    context.entities.BrandInfringement.findMany({
      where: {
        workspaceId: args.workspaceId,
        ...dateFilter,
      },
      include: {
        brand: true,
        actions: true,
      },
    }),
    context.entities.InfringementAction.findMany({
      where: {
        workspaceId: args.workspaceId,
        ...dateFilter,
      },
      include: {
        infringement: {
          include: {
            brand: true,
          },
        },
      },
    }),
  ]);

  const summary = {
    totalBrands: brands,
    totalMonitors: monitors,
    totalAlerts: alerts.length,
    totalInfringements: infringements.length,
    totalActions: actions.length,
    criticalAlerts: alerts.filter((a: any) => a.severity === 'critical').length,
    resolvedInfringements: infringements.filter((i: any) => i.status === 'resolved').length,
    completedActions: actions.filter((a: any) => a.status === 'completed').length,
  };

  return {
    workspace: {
      name: workspace.name,
      id: workspace.id,
    },
    period: {
      start: startDate,
      end: endDate,
    },
    summary,
    alerts,
    infringements,
    actions,
    generatedAt: new Date().toISOString(),
  };
};

export const importBrandsFromCSV = async (
  args: {
    workspaceId: string;
    brands: Array<{
      name: string;
      description?: string;
      logoUrl?: string;
      website?: string;
      priority?: number;
      status?: string;
    }>;
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ row: number; name: string; error: string }>,
  };

  for (let i = 0; i < args.brands.length; i++) {
    const brandData = args.brands[i];

    try {
      // Verificar se marca já existe
      const existing = await context.entities.EclipseBrand.findFirst({
        where: {
          workspaceId: args.workspaceId,
          name: brandData.name,
        },
      });

      if (existing) {
        results.errors.push({
          row: i + 2,
          name: brandData.name,
          error: 'Marca já existe',
        });
        results.failed++;
        continue;
      }

      // Criar marca
      await context.entities.EclipseBrand.create({
        data: {
          workspaceId: args.workspaceId,
          name: brandData.name,
          description: brandData.description || '',
          logoUrl: brandData.logoUrl,
          website: brandData.website,
          priority: brandData.priority || 3,
          status: (brandData.status as any) || 'active',
          createdBy: context.user.id,
        },
      });

      results.success++;

      // Notificação real-time para cada marca criada
      if (results.success <= 10) {
        // Evitar flood de notificações
        const brand = await context.entities.EclipseBrand.findFirst({
          where: {
            workspaceId: args.workspaceId,
            name: brandData.name,
          },
        });

        if (brand) {
          await notifyBrandCreated(
            args.workspaceId,
            context.user.id,
            brand,
            { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
          );
        }
      }
    } catch (error: any) {
      results.errors.push({
        row: i + 2,
        name: brandData.name,
        error: error.message || 'Erro desconhecido',
      });
      results.failed++;
    }
  }

  return results;
};

// ============================================
// Bulk Operations
// ============================================

export const bulkUpdateAlerts = async (
  args: {
    workspaceId: string;
    alertIds: string[];
    action: 'acknowledge' | 'dismiss' | 'escalate';
    infringementData?: Partial<CreateInfringementInput>;
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check bulk operations feature
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.bulk_operations'
  );

  if (args.alertIds.length === 0) {
    throw new HttpError(400, 'No alerts selected');
  }

  if (args.alertIds.length > 100) {
    throw new HttpError(400, 'Maximum 100 alerts per bulk operation');
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ alertId: string; error: string }>,
  };

  for (const alertId of args.alertIds) {
    try {
      const alert = await context.entities.BrandAlert.findUnique({
        where: { id: alertId },
        include: { brand: true, monitor: true },
      });

      if (!alert) {
        results.errors.push({ alertId, error: 'Alert not found' });
        results.failed++;
        continue;
      }

      if (alert.workspaceId !== args.workspaceId) {
        results.errors.push({ alertId, error: 'Unauthorized' });
        results.failed++;
        continue;
      }

      switch (args.action) {
        case 'acknowledge':
        case 'dismiss':
          await context.entities.BrandAlert.update({
            where: { id: alertId },
            data: { status: args.action === 'acknowledge' ? 'acknowledged' : 'dismissed' },
          });
          break;

        case 'escalate':
          // Escalar para infração
          const infringement = await context.entities.BrandInfringement.create({
            data: {
              workspaceId: alert.workspaceId,
              brandId: alert.brandId,
              title: args.infringementData?.title || alert.title,
              description: args.infringementData?.description || alert.description || '',
              url: alert.url || '',
              domain: new URL(alert.url || 'http://unknown.com').hostname,
              type: args.infringementData?.type || 'counterfeiting',
              severity: args.infringementData?.severity || alert.severity,
              detectedBy: context.user.id,
            },
          });

          await context.entities.BrandAlert.update({
            where: { id: alertId },
            data: { status: 'escalated', infringementId: infringement.id },
          });

          await notifyAlertEscalated(
            alert.workspaceId,
            context.user.id,
            alert,
            infringement,
            { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
          );
          break;
      }

      results.success++;
    } catch (error: any) {
      results.errors.push({
        alertId,
        error: error.message || 'Unknown error',
      });
      results.failed++;
    }
  }

  // Notificação de bulk action completa
  await notifyBulkActionCompleted(
    args.workspaceId,
    context.user.id,
    'alert',
    args.action,
    results.success,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return results;
};

export const bulkUpdateInfringements = async (
  args: {
    workspaceId: string;
    infringementIds: string[];
    updates: {
      status?: string;
      severity?: string;
      assignedTo?: string;
      tags?: string[];
    };
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check bulk operations feature
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.bulk_operations'
  );

  if (args.infringementIds.length === 0) {
    throw new HttpError(400, 'No infringements selected');
  }

  if (args.infringementIds.length > 100) {
    throw new HttpError(400, 'Maximum 100 infringements per bulk operation');
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ infringementId: string; error: string }>,
  };

  for (const infringementId of args.infringementIds) {
    try {
      const infringement = await context.entities.BrandInfringement.findUnique({
        where: { id: infringementId },
      });

      if (!infringement) {
        results.errors.push({ infringementId, error: 'Infringement not found' });
        results.failed++;
        continue;
      }

      if (infringement.workspaceId !== args.workspaceId) {
        results.errors.push({ infringementId, error: 'Unauthorized' });
        results.failed++;
        continue;
      }

      const updateData: any = {};

      if (args.updates.status) {
        updateData.status = args.updates.status;
      }

      if (args.updates.severity) {
        updateData.severity = args.updates.severity;
      }

      if (args.updates.tags) {
        // Merge tags no metadata
        const currentMetadata = (infringement.metadata as any) || {};
        updateData.metadata = {
          ...currentMetadata,
          tags: args.updates.tags,
        };
      }

      await context.entities.BrandInfringement.update({
        where: { id: infringementId },
        data: updateData,
      });

      results.success++;
    } catch (error: any) {
      results.errors.push({
        infringementId,
        error: error.message || 'Unknown error',
      });
      results.failed++;
    }
  }

  // Notificação de bulk action completa
  await notifyBulkActionCompleted(
    args.workspaceId,
    context.user.id,
    'infringement',
    'update',
    results.success,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return results;
};

export const bulkUpdateActions = async (
  args: {
    workspaceId: string;
    actionIds: string[];
    updates: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      tags?: string[];
    };
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  await checkWorkspaceAccess(context, args.workspaceId);

  // 🚀 Check bulk operations feature
  await FeatureChecker.requireFeature(
    context,
    args.workspaceId,
    'eclipse.bulk_operations'
  );

  if (args.actionIds.length === 0) {
    throw new HttpError(400, 'No actions selected');
  }

  if (args.actionIds.length > 100) {
    throw new HttpError(400, 'Maximum 100 actions per bulk operation');
  }

  // Se houver assignedTo, verificar se é membro válido
  if (args.updates.assignedTo) {
    const member = await context.entities.WorkspaceMember.findFirst({
      where: {
        workspaceId: args.workspaceId,
        userId: args.updates.assignedTo,
      },
    });

    if (!member) {
      throw new HttpError(400, 'Assigned user is not a workspace member');
    }
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ actionId: string; error: string }>,
  };

  for (const actionId of args.actionIds) {
    try {
      const action = await context.entities.InfringementAction.findUnique({
        where: { id: actionId },
        include: { infringement: true },
      });

      if (!action) {
        results.errors.push({ actionId, error: 'Action not found' });
        results.failed++;
        continue;
      }

      if (action.workspaceId !== args.workspaceId) {
        results.errors.push({ actionId, error: 'Unauthorized' });
        results.failed++;
        continue;
      }

      const updateData: any = {};

      if (args.updates.status) {
        updateData.status = args.updates.status;
        if (args.updates.status === 'completed') {
          updateData.completedAt = new Date();
        }
      }

      if (args.updates.priority) {
        updateData.priority = args.updates.priority;
      }

      if (args.updates.assignedTo) {
        updateData.assignedTo = args.updates.assignedTo;

        // Notificar usuário atribuído
        const assignedToUser = await context.entities.User.findUnique({
          where: { id: args.updates.assignedTo },
        });

        if (assignedToUser) {
          await notifyActionAssignedEvent(
            action.workspaceId,
            context.user.id,
            action,
            args.updates.assignedTo,
            assignedToUser,
            { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
          );
        }
      }

      if (args.updates.tags) {
        const currentMetadata = (action.metadata as any) || {};
        updateData.metadata = {
          ...currentMetadata,
          tags: args.updates.tags,
        };
      }

      await context.entities.InfringementAction.update({
        where: { id: actionId },
        data: updateData,
      });

      results.success++;
    } catch (error: any) {
      results.errors.push({
        actionId,
        error: error.message || 'Unknown error',
      });
      results.failed++;
    }
  }

  // Notificação de bulk action completa
  await notifyBulkActionCompleted(
    args.workspaceId,
    context.user.id,
    'action',
    'update',
    results.success,
    { ipAddress: context.req?.ip, userAgent: context.req?.headers?.['user-agent'] }
  );

  return results;
};

