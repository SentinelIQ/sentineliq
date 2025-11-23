/**
 * Email Preview API
 * Endpoint para visualizar templates de email em desenvolvimento
 */

import type { EmailPreview } from 'wasp/server/api';
import { HttpError } from 'wasp/server';
import { previewEmailTemplate, getAllTemplates } from '../../core/email/preview';
import type { EmailBranding, EmailTemplate } from '../../core/email/types';

/**
 * Middleware config for email preview API
 * Raw Express handlers (req, res) without context
 */
export function emailPreviewMiddlewareConfig(middlewareConfig: any) {
  return middlewareConfig;
}

/**
 * Preview email template
 * GET /api/email-preview?template=WELCOME&customVar=value
 */
export const previewEmailApi: EmailPreview = async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    throw new HttpError(403, 'Email preview is only available in development');
  }

  const { template, format = 'html', ...customVariables } = req.query;

  // List all templates if no template specified
  if (!template) {
    const allTemplates = getAllTemplates();
    return res.json({
      message: 'Available email templates',
      templates: allTemplates,
      usage: 'Add ?template=TEMPLATE_NAME to preview a specific template',
      example: '/api/email-preview?template=WELCOME',
    });
  }

  try {
    // Custom branding from query params
    const customBranding: EmailBranding | undefined = req.query.branding
      ? JSON.parse(req.query.branding as string)
      : undefined;

    // Generate preview
    const { subject, html } = previewEmailTemplate(
      template as EmailTemplate,
      customVariables,
      customBranding
    );

    // Return as JSON or HTML
    if (format === 'json') {
      return res.json({
        template,
        subject,
        html,
        variables: customVariables,
        branding: customBranding,
      });
    }

    // Return as HTML for browser preview
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    throw new HttpError(
      400,
      `Failed to preview template: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
