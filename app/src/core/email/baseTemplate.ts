/**
 * Base HTML Email Template
 * Responsive design with support for branding and dark mode
 */

import type { EmailBranding } from './types';

const DEFAULT_BRANDING = {
  primaryColor: '#3b82f6', // blue-500
  secondaryColor: '#1e40af', // blue-800
  companyName: 'SentinelIQ',
  companyUrl: 'https://sentineliq.com.br',
};

export interface BaseTemplateOptions {
  preheader?: string;
  body: string;
  branding?: EmailBranding;
  footerText?: string;
}

/**
 * Generate base HTML email structure
 * Based on best practices from Mailchimp, SendGrid, and Postmark
 */
export function generateBaseTemplate(options: BaseTemplateOptions): string {
  const branding = { ...DEFAULT_BRANDING, ...options.branding };
  const { preheader, body, footerText } = options;

  return `
<!DOCTYPE html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${branding.companyName}</title>
  
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  
  <style>
    /* Reset styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { padding: 0; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    
    /* Base typography */
    body, table, td, a { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    
    /* Client-specific fixes */
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    
    /* iOS blue links fix */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1f2937 !important; }
      .dark-mode-text { color: #f9fafb !important; }
      .dark-mode-border { border-color: #374151 !important; }
    }
    
    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; }
      .content { padding: 20px !important; }
      .button { width: 100% !important; display: block !important; }
      .mobile-padding { padding: 15px !important; }
      .mobile-hide { display: none !important; }
      .mobile-font-size { font-size: 14px !important; }
      h1 { font-size: 24px !important; }
      h2 { font-size: 20px !important; }
    }
  </style>
</head>

<body style="background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; width: 100%;">
  
  <!-- Preheader (hidden text for inbox preview) -->
  ${preheader ? `
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #f3f4f6; opacity: 0;">
    ${preheader}
  </div>
  ` : ''}
  
  <!-- Spacer for better rendering -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Email wrapper -->
  <table role="presentation" class="wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main content container -->
        <table role="presentation" class="content" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
          
          <!-- Header with logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #e5e7eb;">
              ${branding.logoUrl ? `
              <img src="${branding.logoUrl}" alt="${branding.companyName}" style="height: 40px; width: auto; display: block;" />
              ` : `
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${branding.primaryColor}; letter-spacing: -0.5px;">
                ${branding.companyName}
              </h1>
              `}
            </td>
          </tr>
          
          <!-- Body content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px;">
              ${body}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                      ${footerText || `Você recebeu este email porque é membro da plataforma ${branding.companyName}.`}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <a href="${branding.companyUrl}" style="color: ${branding.primaryColor}; text-decoration: none; font-size: 14px; font-weight: 600;">
                      Acessar ${branding.companyName}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                      © ${new Date().getFullYear()} ${branding.companyName}. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * Template Components - Reusable building blocks
 */

export const EmailComponents = {
  // Heading
  heading: (text: string, level: 1 | 2 | 3 = 1, color?: string) => {
    const sizes = { 1: '24px', 2: '20px', 3: '18px' };
    const weights = { 1: '700', 2: '600', 3: '600' };
    return `
      <h${level} style="margin: 0 0 16px 0; font-size: ${sizes[level]}; font-weight: ${weights[level]}; line-height: 1.3; color: ${color || '#111827'};">
        ${text}
      </h${level}>
    `;
  },

  // Paragraph
  paragraph: (text: string, color?: string) => `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: ${color || '#374151'};">
      ${text}
    </p>
  `,

  // Button (CTA)
  button: (text: string, url: string, color?: string) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td align="center" style="border-radius: 6px; background-color: ${color || '#3b82f6'};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `,

  // Divider
  divider: (margin = '24px') => `
    <div style="margin: ${margin} 0; border-top: 1px solid #e5e7eb;"></div>
  `,

  // Info box
  infoBox: (content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const colors = {
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
      success: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
      warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    };
    const { bg, border, text } = colors[type];
    return `
      <div style="margin: 24px 0; padding: 16px; background-color: ${bg}; border-left: 4px solid ${border}; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; line-height: 20px; color: ${text};">
          ${content}
        </p>
      </div>
    `;
  },

  // Code block
  code: (code: string) => `
    <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-family: 'Courier New', monospace;">
      <code style="font-size: 18px; font-weight: 600; color: #1f2937; letter-spacing: 2px;">
        ${code}
      </code>
    </div>
  `,

  // List
  list: (items: string[], ordered = false) => {
    const tag = ordered ? 'ol' : 'ul';
    return `
      <${tag} style="margin: 0 0 16px 0; padding-left: 24px; font-size: 16px; line-height: 24px; color: #374151;">
        ${items.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
      </${tag}>
    `;
  },

  // Data table
  dataTable: (data: Array<{ label: string; value: string }>) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
      ${data.map((row, i) => `
        <tr style="${i % 2 === 0 ? 'background-color: #f9fafb;' : 'background-color: #ffffff;'}">
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #6b7280; border-bottom: ${i < data.length - 1 ? '1px solid #e5e7eb' : 'none'};">
            ${row.label}
          </td>
          <td style="padding: 12px 16px; font-size: 14px; color: #111827; text-align: right; border-bottom: ${i < data.length - 1 ? '1px solid #e5e7eb' : 'none'};">
            ${row.value}
          </td>
        </tr>
      `).join('')}
    </table>
  `,

  // Social links
  socialLinks: (links: Array<{ platform: string; url: string }>) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        ${links.map(link => `
          <td style="padding: 0 8px;">
            <a href="${link.url}" target="_blank" style="color: #6b7280; text-decoration: none; font-size: 14px;">
              ${link.platform}
            </a>
          </td>
        `).join('')}
      </tr>
    </table>
  `,
};
