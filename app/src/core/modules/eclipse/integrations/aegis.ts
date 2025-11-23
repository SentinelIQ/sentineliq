import { HttpError } from 'wasp/server';
import type { BrandInfringement, EclipseBrand, Incident } from 'wasp/entities';

interface CreateIncidentPayload {
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceReference: string;
  metadata: Record<string, any>;
}

/**
 * Determina se uma infração deve gerar um Incident no Aegis
 * Sempre habilitado para infrações de alta severidade
 */
export const shouldCreateAegisIncident = (
  infringement: BrandInfringement
): boolean => {
  // Apenas infrações críticas ou altas
  if (!['critical', 'high'].includes(infringement.severity)) {
    return false;
  }
  
  // Apenas certos tipos (counterfeiting, impersonation, domain_squatting)
  const escalatableTypes = ['counterfeiting', 'impersonation', 'domain_squatting'];
  if (!escalatableTypes.includes(infringement.type)) {
    return false;
  }
  
  return true;
};

/**
 * Mapeia severidades Eclipse para Aegis
 */
const mapEclipseSeverityToAegis = (
  eclipseSeverity: string
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  const mapping: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  };
  return mapping[eclipseSeverity] || 'MEDIUM';
};

/**
 * Cria um Incident no módulo Aegis a partir de uma Infração Eclipse
 */
export const createAegisIncidentFromInfringement = async (
  context: any,
  infringement: BrandInfringement,
  brand: EclipseBrand
): Promise<Incident> => {
  try {
    // 1. Prepara o payload
    const payload: CreateIncidentPayload = {
      title: `[Brand Protection] ${brand.name} - ${infringement.title}`,
      description: `
**Infração de Marca Detectada:**

**Marca:** ${brand.name}
**URL:** ${infringement.url}
**Domínio:** ${infringement.domain}
**Tipo:** ${infringement.type}
**Severidade:** ${infringement.severity}
**Data de Detecção:** ${new Date(infringement.createdAt).toLocaleString()}

**Descrição:**
${infringement.description || 'N/A'}

**Localização:** ${infringement.location || 'N/A'}
**IP:** ${infringement.ipAddress || 'N/A'}
      `,
      severity: mapEclipseSeverityToAegis(infringement.severity),
      sourceReference: infringement.id,
      metadata: {
        eclipseBrandId: brand.id,
        eclipseInfringementId: infringement.id,
        brandName: brand.name,
        infringementType: infringement.type,
        sourceUrl: infringement.url,
        domain: infringement.domain,
      },
    };

    // 2. Cria Incident no Aegis
    const incident = await context.entities.Incident.create({
      data: {
        workspaceId: infringement.workspaceId,
        title: payload.title,
        description: payload.description,
        severity: payload.severity,
        status: 'ACTIVE',
        priority: payload.severity === 'CRITICAL' || payload.severity === 'HIGH' ? 'CRITICAL' : 'MEDIUM',
        metadata: payload.metadata,
      },
    });

    // 3. Atualiza BrandInfringement com referência ao Incident
    await context.entities.BrandInfringement.update({
      where: { id: infringement.id },
      data: {
        aegisIncidentId: incident.id,
        aegisSyncStatus: 'synced',
        aegisSyncedAt: new Date(),
      },
    });

    // 4. Log de auditoria
    await context.entities.AuditLog.create({
      data: {
        workspaceId: infringement.workspaceId,
        userId: context.user?.id,
        action: 'ECLIPSE_ALERT_ESCALATED',
        resource: 'eclipse_infringement',
        resourceId: infringement.id,
        metadata: {
          aegisIncidentId: incident.id,
          incidentTitle: incident.title,
        },
        description: `Infraction escalated to Aegis incident: ${incident.id}`,
      },
    });

    console.log(`✅ Created Aegis incident ${incident.id} for infringement ${infringement.id}`);
    return incident;
  } catch (error) {
    console.error('Error creating Aegis incident:', error);
    
    // Salva o erro na infração para debugging
    await context.entities.BrandInfringement.update({
      where: { id: infringement.id },
      data: {
        aegisSyncStatus: 'error',
        aegisSyncError: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw new HttpError(500, 'Failed to create Aegis incident');
  }
};

/**
 * Obtém o status de sincronização com Aegis
 */
export const getAegisIncidentStatus = async (
  args: { infringementId: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id: args.infringementId },
    include: {
      incident: true,
    },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  // Check workspace access
  const membership = await context.entities.WorkspaceMember.findFirst({
    where: {
      userId: context.user.id,
      workspaceId: infringement.workspaceId,
    },
  });

  if (!membership) {
    throw new HttpError(403, 'No access to this workspace');
  }

  return {
    infringementId: infringement.id,
    aegisSyncStatus: infringement.aegisSyncStatus,
    aegisSyncedAt: infringement.aegisSyncedAt,
    aegisSyncError: infringement.aegisSyncError,
    aegisIncidentId: infringement.aegisIncidentId,
    incident: infringement.incident,
  };
};

/**
 * Tenta reprocessar uma infração que falhou ao criar incident
 */
export const retryAegisIncidentCreation = async (
  infringementId: string,
  context: any
): Promise<Incident | null> => {
  const infringement = await context.entities.BrandInfringement.findUnique({
    where: { id: infringementId },
    include: { brand: true },
  });

  if (!infringement) {
    throw new HttpError(404, 'Infringement not found');
  }

  if (!shouldCreateAegisIncident(infringement)) {
    console.log(`⏭️ Skipping Aegis incident creation for infringement ${infringementId}`);
    return null;
  }

  return await createAegisIncidentFromInfringement(
    context,
    infringement,
    infringement.brand
  );
};

/**
 * Notifica quando um Aegis incident é criado a partir de uma infração
 */
export const notifyAegisIncidentCreated = async (
  context: any,
  infringement: BrandInfringement,
  brand: EclipseBrand,
  incident: Incident
): Promise<void> => {
  try {
    // Cria notificação no sistema
    await context.entities.Notification.create({
      data: {
        workspaceId: infringement.workspaceId,
        userId: context.user?.id || 'system',
        type: 'aegis_incident_created',
        title: `Infração Escalada para Investigação`,
        message: `A infração "${infringement.title}" de ${brand.name} foi escalada para investigação formal no Aegis.`,
        data: {
          infringementId: infringement.id,
          incidentId: incident.id,
          brandName: brand.name,
        },
        link: `/modules/aegis/incidents/${incident.id}`,
      },
    });

    console.log(`✅ Notification sent for Aegis incident ${incident.id}`);
  } catch (error) {
    console.warn('Failed to send notification:', error);
    // Non-blocking error
  }
};

