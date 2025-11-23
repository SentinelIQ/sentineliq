/**
 * Screenshot API Endpoint
 * 
 * Serves screenshots for Eclipse alerts from S3/MinIO storage.
 * All new screenshots must be uploaded to S3/MinIO via the Sentinel Engine.
 */

import type { UploadFile } from 'wasp/server/api';
import { prisma } from 'wasp/server';
import { createLogger } from '../../core/logs/logger';

const logger = createLogger('screenshot-api');

/**
 * Screenshot API handler
 * 
 * GET /api/screenshot/:alertId
 * 
 * Returns:
 * - 303 See Other: Redirect to S3/MinIO public URL
 * - 404: Alert not found or no screenshot available
 * - 401: User not authenticated
 * - 403: User lacks access to alert's workspace
 */
export const screenshotFileApi: UploadFile = async (req, res, context) => {
  try {
    // Authenticate user
    if (!context.user) {
      logger.warn('Unauthorized screenshot request', {
        component: 'ScreenshotAPI',
        ip: req.ip,
        alertId: req.params.alertId,
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const alertId = req.params.alertId as string;

    if (!alertId) {
      return res.status(400).json({ error: 'alertId is required' });
    }

    // Get alert from database
    const alert = await prisma.brandAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      logger.warn('Alert not found', {
        component: 'ScreenshotAPI',
        userId: context.user.id,
        alertId,
      });
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Verify user has access to alert's workspace
    const hasAccess = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: context.user.id,
          workspaceId: alert.workspaceId,
        },
      },
    });

    if (!hasAccess) {
      logger.warn('User lacks access to alert workspace', {
        component: 'ScreenshotAPI',
        userId: context.user.id,
        alertId,
        workspaceId: alert.workspaceId,
      });
      return res.status(403).json({ error: 'Access denied to alert' });
    }

    // Screenshot must be available and must be an S3 URL
    if (!alert.screenshotUrl) {
      logger.info('Alert has no screenshot', {
        component: 'ScreenshotAPI',
        userId: context.user.id,
        alertId,
      });
      return res.status(404).json({ 
        error: 'No screenshot available',
        message: 'Screenshot will be available once the alert is reprocessed and uploaded to S3.' 
      });
    }

    // In development, only S3 URLs are supported
    if (!alert.screenshotUrl.startsWith('http')) {
      logger.warn('Old screenshot format detected - not supported in dev', {
        component: 'ScreenshotAPI',
        userId: context.user.id,
        alertId,
        screenshotUrl: alert.screenshotUrl.substring(0, 50),
      });
      return res.status(410).json({ 
        error: 'Screenshot format no longer supported',
        message: 'Old screenshots are no longer served. Please regenerate the alert to get a new screenshot.',
        hint: 'Run the monitor again to create a new screenshot uploaded to S3.'
      });
    }

    logger.info('Redirecting to S3 screenshot', {
      component: 'ScreenshotAPI',
      userId: context.user.id,
      alertId,
      url: alert.screenshotUrl.substring(0, 80) + '...',
    });
    
    // Redirect to S3 URL
    return res.redirect(303, alert.screenshotUrl);

  } catch (error) {
    logger.error('Screenshot API error', {
      component: 'ScreenshotAPI',
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: context.user?.id,
    });
    return res.status(500).json({
      error: 'Failed to retrieve screenshot',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
