# Sistema de Templates de Email Profissionais

Sistema completo de templates de email com design responsivo, suporte a branding personalizado e categorização por tipo de mensagem.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura](#estrutura)
- [Categorias de Templates](#categorias-de-templates)
- [Como Usar](#como-usar)
- [Customização de Branding](#customização-de-branding)
- [Componentes Reutilizáveis](#componentes-reutilizáveis)
- [Preview de Templates](#preview-de-templates)
- [Integração com Providers](#integração-com-providers)

## 🎯 Visão Geral

Este sistema fornece templates de email profissionais, responsivos e prontos para produção, organizados em 5 categorias principais:

- **Auth**: Autenticação e segurança
- **Payment**: Pagamentos e assinaturas
- **Workspace**: Gestão de workspaces
- **Notification**: Alertas e incidentes
- **System**: Anúncios e manutenções

### ✨ Características

- ✅ **Design Responsivo**: Funciona em todos os dispositivos e clientes de email
- ✅ **Branding Personalizável**: Suporte a logo, cores primárias e secundárias
- ✅ **Dark Mode Ready**: Suporte automático para preferências de dark mode
- ✅ **Componentes Modulares**: Blocos reutilizáveis (botões, tabelas, alertas, etc)
- ✅ **Type-Safe**: Totalmente tipado com TypeScript
- ✅ **Validação**: Validação automática de variáveis obrigatórias
- ✅ **Acessível**: Seguindo melhores práticas de acessibilidade
- ✅ **Preview System**: Sistema de preview para desenvolvimento

## 📁 Estrutura

```
src/core/email/
├── types.ts              # Tipos e enums (EmailTemplate, EmailCategory)
├── baseTemplate.ts       # Template HTML base e componentes
├── renderer.ts           # Sistema de renderização
├── service.ts            # Serviço de envio de emails
├── utils.ts              # Helpers para envio rápido
├── preview.ts            # Sistema de preview
├── index.ts              # Export central
└── templates/
    ├── auth.ts           # Templates de autenticação
    ├── payment.ts        # Templates de pagamento
    ├── workspace.ts      # Templates de workspace
    ├── notification.ts   # Templates de notificações
    └── system.ts         # Templates de sistema
```

## 📧 Categorias de Templates

### 🔐 Auth (7 templates)

- `WELCOME` - Boas-vindas ao novo usuário
- `EMAIL_VERIFICATION` - Verificação de email
- `PASSWORD_RESET` - Redefinição de senha
- `PASSWORD_CHANGED` - Confirmação de alteração de senha
- `TWO_FACTOR_ENABLED` - 2FA ativado
- `TWO_FACTOR_DISABLED` - 2FA desativado
- `ACCOUNT_LOCKED` - Conta bloqueada

### 💳 Payment (9 templates)

- `PAYMENT_SUCCESS` - Pagamento confirmado
- `PAYMENT_FAILED` - Falha no pagamento
- `SUBSCRIPTION_CREATED` - Assinatura ativada
- `SUBSCRIPTION_CANCELLED` - Assinatura cancelada
- `TRIAL_STARTED` - Período de teste iniciado
- `TRIAL_ENDING` - Teste terminando em breve
- `TRIAL_ENDED` - Teste encerrado
- `INVOICE_PAID` - Fatura paga
- `INVOICE_PAYMENT_FAILED` - Falha no pagamento da fatura

### 🏢 Workspace (7 templates)

- `WORKSPACE_CREATED` - Workspace criado
- `WORKSPACE_INVITATION` - Convite para workspace
- `OWNERSHIP_TRANSFER` - Transferência de propriedade
- `OWNERSHIP_TRANSFER_COMPLETED` - Transferência concluída
- `MEMBER_ADDED` - Membro adicionado
- `MEMBER_REMOVED` - Membro removido
- `ROLE_CHANGED` - Função alterada

### 🚨 Notification (4 templates)

- `INCIDENT_CRITICAL` - Incidente crítico
- `ALERT_HIGH_SEVERITY` - Alerta de alta severidade
- `CASE_ASSIGNED` - Caso atribuído
- `SLA_BREACH_WARNING` - Aviso de violação de SLA

### ⚙️ System (4 templates)

- `SYSTEM_MAINTENANCE` - Manutenção programada
- `SYSTEM_OUTAGE` - Incidente do sistema
- `FEATURE_ANNOUNCEMENT` - Anúncio de features
- `SECURITY_ALERT` - Alerta de segurança

## 🚀 Como Usar

### Uso Básico

```typescript
import { sendEmail, EmailTemplate } from '@src/core/email';

// Enviar email de boas-vindas
await sendEmail('user@example.com', EmailTemplate.WELCOME, {
  userName: 'João Silva',
  verificationUrl: 'https://app.com/verify/abc123',
});
```

### Uso com Branding Personalizado

```typescript
import { sendEmail, EmailTemplate, type EmailBranding } from '@src/core/email';

const branding: EmailBranding = {
  logoUrl: 'https://cdn.acme.com/logo.png',
  primaryColor: '#6366f1',
  secondaryColor: '#4f46e5',
  companyName: 'Acme Corp',
  companyUrl: 'https://acme.com',
};

await sendEmail(
  'user@example.com',
  EmailTemplate.WORKSPACE_INVITATION,
  {
    inviterName: 'João Silva',
    workspaceName: 'Acme Security',
    role: 'Administrador',
    acceptUrl: 'https://app.com/invitations/accept/token123',
    expiresAt: '25/11/2024',
  },
  { branding }
);
```

### Usando Helpers Categorizados

```typescript
import { authEmails, paymentEmails, workspaceEmails } from '@src/core/email/utils';

// Auth
await authEmails.sendWelcome(user, verificationUrl);
await authEmails.sendPasswordReset(email, userName, resetUrl);

// Payment
await paymentEmails.sendPaymentSuccess(email, userName, 'R$ 99,00', 'Pro', {
  invoiceUrl: 'https://app.com/invoices/inv_123',
});

// Workspace
await workspaceEmails.sendInvitation(
  email,
  inviterName,
  workspaceName,
  role,
  acceptUrl,
  expiresAt,
  branding
);
```

### Envio em Lote

```typescript
import { EmailService } from '@src/core/email';

const emailService = new EmailService();

await emailService.sendBatch([
  {
    to: 'user1@example.com',
    template: EmailTemplate.TRIAL_ENDING,
    variables: { userName: 'User 1', plan: 'Pro', daysLeft: 3, /* ... */ },
  },
  {
    to: 'user2@example.com',
    template: EmailTemplate.TRIAL_ENDING,
    variables: { userName: 'User 2', plan: 'Pro', daysLeft: 3, /* ... */ },
  },
]);
```

## 🎨 Customização de Branding

O sistema suporta customização completa de branding por workspace:

```typescript
interface EmailBranding {
  logoUrl?: string;         // URL do logo (altura recomendada: 40px)
  primaryColor?: string;    // Cor primária (hex: #RRGGBB)
  secondaryColor?: string;  // Cor secundária (hex: #RRGGBB)
  companyName?: string;     // Nome da empresa
  companyUrl?: string;      // URL da empresa
}
```

### Obtendo Branding do Workspace

```typescript
import { getEmailBranding } from '@src/core/email/utils';

const workspace = await context.entities.Workspace.findUnique({
  where: { id: workspaceId },
});

const branding = await getEmailBranding(workspace);

await sendEmail(email, template, variables, { branding });
```

## 🧩 Componentes Reutilizáveis

O sistema fornece componentes modulares para criar templates customizados:

```typescript
import { EmailComponents } from '@src/core/email';

// Heading
EmailComponents.heading('Título Principal', 1, '#3b82f6');

// Parágrafo
EmailComponents.paragraph('Texto do parágrafo');

// Botão CTA
EmailComponents.button('Clique Aqui', 'https://app.com/action', '#3b82f6');

// Divider
EmailComponents.divider('24px');

// Info Box
EmailComponents.infoBox('Mensagem importante', 'info'); // 'info' | 'success' | 'warning' | 'error'

// Código
EmailComponents.code('ABC123XYZ');

// Lista
EmailComponents.list(['Item 1', 'Item 2', 'Item 3'], false); // true para ordenada

// Tabela de dados
EmailComponents.dataTable([
  { label: 'Nome', value: 'João Silva' },
  { label: 'Email', value: 'joao@example.com' },
]);
```

### Criando Template Customizado

```typescript
import { generateBaseTemplate, EmailComponents } from '@src/core/email/baseTemplate';

const customTemplate = (variables: any, branding?: EmailBranding) => {
  const body = `
    ${EmailComponents.heading('Meu Template Customizado')}
    ${EmailComponents.paragraph(`Olá ${variables.userName},`)}
    ${EmailComponents.button('Ação Principal', variables.actionUrl, branding?.primaryColor)}
  `;

  return generateBaseTemplate({
    preheader: 'Preview do email',
    body,
    branding,
  });
};
```

## 👁️ Preview de Templates

Sistema de preview para desenvolvimento e testes:

```typescript
import { previewEmailTemplate, getAllTemplates } from '@src/core/email/preview';

// Preview de template específico
const { subject, html } = previewEmailTemplate(EmailTemplate.WELCOME);
console.log('Subject:', subject);
console.log('HTML:', html);

// Preview com dados customizados
const preview = previewEmailTemplate(
  EmailTemplate.PAYMENT_SUCCESS,
  {
    userName: 'Custom Name',
    amount: 'R$ 199,00',
    // ...
  },
  customBranding
);

// Listar todos os templates
const allTemplates = getAllTemplates();
console.log(allTemplates);
```

### API Endpoint de Preview (TODO)

Criar um endpoint em `main.wasp` para preview visual:

```wasp
api emailPreview {
  fn: import { emailPreviewApi } from "@src/server/api/emailPreview",
  entities: []
}
```

## 🔌 Integração com Email Providers

O sistema é provider-agnostic. Implemente o `EmailSender` interface:

### SendGrid Example

```typescript
import sgMail from '@sendgrid/mail';
import { initializeEmailService, type EmailSender } from '@src/core/email';

class SendGridEmailSender implements EmailSender {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async send(params: {
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
  }): Promise<void> {
    await sgMail.send({
      to: params.to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });
  }
}

// Inicializar no servidor
initializeEmailService(new SendGridEmailSender());
```

### AWS SES Example

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

class SESEmailSender implements EmailSender {
  private client: SESClient;

  constructor() {
    this.client = new SESClient({ region: process.env.AWS_REGION });
  }

  async send(params: {
    to: string | string[];
    subject: string;
    html: string;
  }): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL!,
        Destination: {
          ToAddresses: Array.isArray(params.to) ? params.to : [params.to],
        },
        Message: {
          Subject: { Data: params.subject },
          Body: { Html: { Data: params.html } },
        },
      })
    );
  }
}
```

## 📝 Validação de Variáveis

O sistema valida automaticamente variáveis obrigatórias:

```typescript
import { validateTemplateVariables } from '@src/core/email/renderer';

const validation = validateTemplateVariables(EmailTemplate.WELCOME, {
  userName: 'João',
  // verificationUrl missing!
});

if (!validation.valid) {
  console.error('Missing variables:', validation.missing);
  // Output: Missing variables: ['verificationUrl']
}
```

## 🎨 Design System

### Cores Padrão

- Primary: `#3b82f6` (blue-500)
- Secondary: `#1e40af` (blue-800)
- Success: `#10b981` (green-500)
- Warning: `#f59e0b` (amber-500)
- Error: `#ef4444` (red-500)

### Tipografia

- Font Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- H1: 24px / 700 weight
- H2: 20px / 600 weight
- H3: 18px / 600 weight
- Body: 16px / 400 weight
- Small: 14px / 400 weight

### Espaçamento

- Padding principal: 40px (desktop), 20px (mobile)
- Margin entre elementos: 16px-24px
- Border radius: 6-8px

## 🧪 Testes

### Testes Visuais

Use o sistema de preview para validar visualmente os templates em diferentes cenários.

### Testes de Compatibilidade

Recomendados testar em:
- Gmail (Web, iOS, Android)
- Outlook (Desktop, Web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- ProtonMail

### Ferramentas Recomendadas

- [Litmus](https://litmus.com) - Testes de compatibilidade
- [Email on Acid](https://www.emailonacid.com) - Testes de renderização
- [Mail Tester](https://www.mail-tester.com) - Teste de spam score

## 📚 Referências

- [Email HTML Best Practices](https://github.com/email-markup/email-markup-guide)
- [Can I Email](https://www.caniemail.com) - Compatibilidade de CSS
- [Really Good Emails](https://reallygoodemails.com) - Inspiração

## 🤝 Contribuindo

Para adicionar novos templates:

1. Defina o enum em `types.ts`
2. Adicione o mapeamento de categoria
3. Crie o template na categoria apropriada
4. Adicione ao registry em `renderer.ts`
5. Adicione sample data em `preview.ts`
6. Documente as variáveis obrigatórias

## 📄 Licença

Parte do projeto SentinelIQ - Todos os direitos reservados.
