# 💡 Exemplos Práticos: Lerna + Wasp

## 1. Exemplo: Extrair Types do Wasp

### Antes (tudo dentro de app/)

```typescript
// app/src/shared/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
}
```

### Depois (em package separado)

```
packages/shared-types/
├── src/
│   ├── user.ts
│   ├── workspace.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**`packages/shared-types/src/user.ts`:**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
```

**`packages/shared-types/src/index.ts`:**
```typescript
export type * from './user.js';
export type * from './workspace.js';
```

**`app/src/shared/types.ts`:**
```typescript
// Agora re-exporta do package
export type { User, Workspace } from '@sentineliq/shared-types';
```

---

## 2. Exemplo: Utils Compartilhados

### Use Case: Formatação de Dados

**`packages/utils/src/formatting.ts`:**
```typescript
import { format } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy');
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
```

**`packages/utils/src/index.ts`:**
```typescript
export * from './formatting.js';
export * from './validation.js';
export * from './crypto.js';
```

**Uso no SentinelIQ (Wasp):**
```typescript
// app/src/client/pages/DashboardPage.tsx
import { formatDate, formatCurrency } from '@sentineliq/utils';

export function DashboardPage() {
  return (
    <div>
      <p>Data: {formatDate(new Date())}</p>
      <p>Saldo: {formatCurrency(12500)}</p>
    </div>
  );
}
```

---

## 3. Exemplo: Validadores Zod

**`packages/validators/src/user.ts`:**
```typescript
import { z } from 'zod';

export const userSignupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  name: z.string().min(3, 'Nome obrigatório'),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const userUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type UserSignup = z.infer<typeof userSignupSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
```

**`packages/validators/src/index.ts`:**
```typescript
export * from './user.js';
export * from './workspace.js';
export * from './form.js';
```

**Uso no SentinelIQ (server):**
```typescript
// app/src/server/auth.ts
import { userSignupSchema, type UserSignup } from '@sentineliq/validators';

export async function signup(data: UserSignup) {
  const validated = userSignupSchema.parse(data);
  // ... criar user
}
```

**Uso no SentinelIQ (client):**
```typescript
// app/src/client/pages/SignupPage.tsx
import { userSignupSchema } from '@sentineliq/validators';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function SignupPage() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(userSignupSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" />
      <input {...register('password')} type="password" />
      <input {...register('name')} type="text" />
      <button type="submit">Signup</button>
    </form>
  );
}
```

---

## 4. Exemplo: Componentes Compartilhados

**`packages/ui-components/src/Button.tsx`:**
```typescript
import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={loading}
        className={clsx(
          'rounded font-semibold transition',
          variantClasses[variant],
          sizeClasses[size],
          loading && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {loading ? '...' : props.children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Uso no SentinelIQ:**
```typescript
// app/src/client/pages/DashboardPage.tsx
import { Button } from '@sentineliq/ui-components';

export function DashboardPage() {
  const [loading, setLoading] = React.useState(false);

  return (
    <div>
      <Button variant="primary" size="lg" loading={loading}>
        Save
      </Button>
      <Button variant="secondary" onClick={() => setLoading(!loading)}>
        Cancel
      </Button>
    </div>
  );
}
```

---

## 5. Exemplo: Workflow Completo

### Cenário: Adicionar Nova Feature "Two-Factor Auth"

**Passo 1: Criar tipos em shared-types**
```bash
# packages/shared-types/src/auth.ts
export interface TwoFactorAuthConfig {
  method: 'totp' | 'sms' | 'email';
  enabled: boolean;
  verifiedAt?: Date;
}
```

**Passo 2: Criar validadores**
```bash
# packages/validators/src/auth.ts
export const totpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Código deve ter 6 dígitos'),
});
```

**Passo 3: Criar utilities**
```bash
# packages/utils/src/auth.ts
export const generateTOTPSecret = () => speakeasy.generateSecret();
export const verifyTOTP = (secret: string, token: string) => 
  speakeasy.totp.verify({ secret, token });
```

**Passo 4: Usar no SentinelIQ (Wasp)**
```typescript
// app/src/server/auth.ts
import { TwoFactorAuthConfig } from '@sentineliq/shared-types';
import { totpSchema } from '@sentineliq/validators';
import { generateTOTPSecret, verifyTOTP } from '@sentineliq/utils';

action enable2FA {
  fn: import { enable2FA } from "@src/core/auth/2fa",
  entities: [User]
}

// app/src/core/auth/2fa.ts
export async function enable2FA() {
  const secret = generateTOTPSecret();
  // ... salvar no BD
}
```

**Passo 5: Versionar**
```bash
npm run lerna:version
# Escolher: patch (1.0.1) ou minor (1.1.0)
```

**Passo 6: Publicar (opcional)**
```bash
npm run lerna:publish
```

---

## 6. Exemplo: Estrutura de Monorepo Completo

```
sentineliq/
├── packages/
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── workspace.ts
│   │   │   ├── auth.ts
│   │   │   ├── modules.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── validators/
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── workspace.ts
│   │   │   ├── auth.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── utils/
│   │   ├── src/
│   │   │   ├── formatting.ts
│   │   │   ├── crypto.ts
│   │   │   ├── validation.ts
│   │   │   ├── auth.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── ui-components/
│       ├── src/
│       │   ├── Button.tsx
│       │   ├── Modal.tsx
│       │   ├── Input.tsx
│       │   ├── Select.tsx
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── apps/
│   ├── blog/
│   │   └── package.json
│   └── e2e-tests/
│       └── package.json
│
├── app/  ← SentinelIQ (Wasp - NÃO em Lerna)
│   ├── main.wasp
│   ├── package.json
│   ├── src/
│   │   ├── client/
│   │   ├── server/
│   │   └── core/
│   └── .wasp/
│
├── lerna.json
├── package.json
└── LERNA-*.md
```

---

## 7. Exemplo: Scripts no package.json root

```json
{
  "scripts": {
    "dev": "npm run dev -w app",
    "build": "npm run build -w app",
    "build:all": "npm run build --workspaces",
    "build:packages": "lerna run build --scope '@sentineliq/*'",
    "test": "npm run test --workspaces",
    "test:watch": "npm run test -- --watch",
    "lint": "prettier --check .",
    "lint:fix": "prettier --write .",
    "type-check": "npm run type-check --workspaces",
    "clean": "npm run clean --workspaces && rm -rf node_modules",
    "setup": "npm install --workspaces && npm run build:packages",
    "lerna:changed": "lerna changed",
    "lerna:diff": "lerna diff",
    "lerna:version": "lerna version",
    "lerna:publish": "lerna publish",
    "lerna:list": "lerna list --all --long"
  }
}
```

---

## 8. Exemplo: CI/CD Pipeline

**`.github/workflows/test.yml`:**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - run: npm install --workspaces

      - run: npm run type-check

      - run: npm run build:packages

      - run: npm run test

      - run: npm run lint

      - run: npm run build -w app  # Build SentinelIQ
```

---

## 🎯 Resumo

Com essa estrutura você consegue:

✅ Compartilhar types, validators e utils entre componentes  
✅ Reutilizar componentes React em múltiplos projetos  
✅ Manter Wasp como aplicação principal sem interferência  
✅ Versionar e publicar packages independentemente  
✅ Escalar o monorepo conforme crescer  

🚀 Pronto para começar!
