# Guia de Internacionalização (i18n)

## Como Usar Traduções nos Componentes

### 1. Importar o hook useTranslation

```tsx
import { useTranslation } from 'react-i18next';
```

### 2. Usar no componente

```tsx
export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common:app.name')}</h1>
      <button>{t('common:actions.save')}</button>
    </div>
  );
}
```

### 3. Usar com namespace específico

```tsx
export default function DashboardPage() {
  const { t } = useTranslation('dashboard');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome', { name: userName })}</p>
    </div>
  );
}
```

### 4. Usar múltiplos namespaces

```tsx
export default function MyPage() {
  const { t } = useTranslation(['common', 'dashboard']);
  
  return (
    <div>
      <h1>{t('dashboard:title')}</h1>
      <button>{t('common:actions.save')}</button>
    </div>
  );
}
```

## Namespaces Disponíveis

- **common**: Textos comuns (ações, status, validações)
- **auth**: Páginas de autenticação (login, signup, etc)
- **dashboard**: Dashboard principal
- **billing**: Cobrança e assinaturas
- **analytics**: Análises e métricas
- **admin**: Painel administrativo

## Estrutura de Chaves

### Common (common:)
- `app.name`, `app.tagline`
- `navigation.*` - Itens de navegação
- `actions.*` - Ações (save, cancel, delete, etc)
- `status.*` - Status (active, pending, etc)
- `messages.*` - Mensagens genéricas
- `validation.*` - Mensagens de validação
- `dates.*` - Textos relacionados a datas

### Dashboard (dashboard:)
- `title`, `welcome`
- `overview.*` - Visão geral
- `stats.*` - Estatísticas
- `recentActivity.*` - Atividade recente
- `quickActions.*` - Ações rápidas
- `notifications.*` - Notificações

### Auth (auth:)
- `login.*` - Login
- `signup.*` - Cadastro
- `forgotPassword.*` - Esqueceu senha
- `resetPassword.*` - Redefinir senha
- `twoFactor.*` - 2FA
- `errors.*` - Erros de autenticação

### Billing (billing:)
- `currentPlan.*` - Plano atual
- `plans.*` - Planos disponíveis
- `paymentMethod.*` - Métodos de pagamento
- `invoices.*` - Faturas
- `upgrade.*` - Upgrade
- `cancel.*` - Cancelamento

### Analytics (analytics:)
- `overview.*` - Visão geral
- `charts.*` - Gráficos
- `sources.*` - Fontes de tráfego
- `topPages.*` - Páginas principais
- `devices.*` - Dispositivos
- `locations.*` - Localizações
- `dateRange.*` - Intervalos de data

### Admin (admin:)
- `users.*` - Gerenciamento de usuários
- `stats.*` - Estatísticas do sistema
- `logs.*` - Logs do sistema
- `workspaces.*` - Gerenciamento de workspaces
- `settings.*` - Configurações do sistema

## Exemplo Completo

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function ExamplePage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const userName = 'John Doe';

  return (
    <div>
      <h1>{t('dashboard:title')}</h1>
      <p>{t('dashboard:welcome', { name: userName })}</p>
      
      <Card>
        <h2>{t('dashboard:overview.title')}</h2>
        <p>{t('dashboard:overview.totalUsers')}: 100</p>
      </Card>
      
      <div>
        <Button>{t('common:actions.save')}</Button>
        <Button variant="outline">{t('common:actions.cancel')}</Button>
      </div>
    </div>
  );
}
```

## Adicionando Novas Traduções

1. Abra os arquivos em `src/client/i18n/locales/`
2. Adicione as chaves tanto em EN quanto em PT
3. Use a mesma estrutura em ambos os idiomas
4. Use `as const` no final das exportações para type safety
