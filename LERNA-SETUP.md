# 📦 Guia Completo: Configuração Lerna + Wasp (SentinelIQ)

## 🎯 Objetivo

Implementar Lerna para gerenciar monorepo mantendo **Wasp funcionando perfeitamente**. O Wasp será o "driver" do desenvolvimento, não será gerenciado pelo Lerna como pacote.

## 📋 Situação Atual

```
sentineliq/ (raiz - npm workspaces)
├── app/ (Plataforma SentinelIQ - Wasp Framework - NÃO será gerenciado pelo Lerna)
├── blog/ (Astro - possível package no Lerna)
├── e2e-tests/ (Playwright - possível package no Lerna)
└── package.json (root)
```

## ⚠️ Considerações Críticas com Wasp

### ❌ O que NÃO fazer:

1. **Não colocar `app/` dentro de `lerna.json` packages**
   - Wasp tem seu próprio build system
   - Wasp gerencia seu próprio `node_modules`
   - Lerna pode interferir no build

2. **Não usar `npm link` ou symlinks com Wasp**
   - Wasp não segue symlinks de depêndências
   - Causa problemas no servidor/cliente

3. **Não usar `lerna bootstrap`**
   - Usa `npm workspaces` já em `package.json`
   - Deixar npm nativo gerenciar tudo

### ✅ O que fazer:

1. **Usar Wasp como referência e aplicação principal**
2. **Usar Lerna para pacotes de biblioteca compartilhados**
3. **Symlinks **apenas** para monorepo externo ao Wasp**
4. **Usar convenção clara de versionamento**

## 🔧 Estratégia de Implementação

### Opção 1: **Lerna + Wasp (Recomendado para SentinelIQ)**

Estrutura proposta:

```
sentineliq/
├── packages/              (gerenciado por Lerna)
│   ├── ui-components/     (componentes React reutilizáveis)
│   ├── shared-types/      (tipos TypeScript compartilhados)
│   ├── utils/             (utilities)
│   └── validators/        (validadores comuns)
│
├── apps/                  (aplicações - SentinelIQ é o "driver")
│   ├── sentineliq/       (app/ Wasp - NÃO em lerna.json packages)
│   ├── blog/             (Astro)
│   └── e2e-tests/        (Playwright)
│
├── lerna.json
├── package.json (root)
└── .npmrc
```

## 📝 Passo a Passo

### 1️⃣ Instalar Lerna

```bash
cd /home/luizg/prj/sentineliq
npm install --save-dev lerna

# Inicializar Lerna (independente mode)
npx lerna init --independent
```

### 2️⃣ Configurar `lerna.json`

```json
{
  "version": "independent",
  "command": {
    "publish": {
      "ignoreChanges": [
        "ignored-file",
        "*.md"
      ],
      "registry": "https://registry.npmjs.org"
    },
    "version": {
      "allowBranch": [
        "main",
        "develop"
      ]
    },
    "list": {
      "showVersion": true
    }
  },
  "packages": [
    "packages/*",
    "apps/blog",
    "apps/e2e-tests"
  ],
  "npmClient": "npm",
  "useWorkspaces": true,
  "ignorePatterns": [
    ".git",
    ".DS_Store",
    "*.log",
    "node_modules"
  ]
}
```

**⚠️ CRÍTICO: Não incluir `app` (SentinelIQ) em packages!**

### 3️⃣ Atualizar `package.json` root

```json
{
  "name": "sentineliq-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/blog",
    "apps/e2e-tests",
    "app"
  ],
  "scripts": {
    "dev": "npm run dev -w app",
    "dev:app": "npm run dev -w app",
    "dev:blog": "npm run dev -w blog",
    "build": "npm run build -w app",
    "build:all": "npm run build --workspaces",
    "test:e2e": "npm run e2e -w e2e-tests",
    "lerna:version": "lerna version",
    "lerna:publish": "lerna publish",
    "lerna:changed": "lerna changed",
    "lerna:diff": "lerna diff"
  },
  "devDependencies": {
    "lerna": "^8.1.8"
  }
}
```

### 4️⃣ Criar estrutura de packages

```bash
# Criar diretórios
mkdir -p packages/ui-components
mkdir -p packages/shared-types
mkdir -p packages/utils
mkdir -p packages/validators

# Mover apps para estrutura correta
mkdir -p apps
mv blog apps/blog
mv e2e-tests apps/e2e-tests
# app já fica na raiz ou pode ser renomeado depois

# Criar package.json em cada package novo (exemplo abaixo)
```

### 5️⃣ Exemplo: `packages/shared-types/package.json`

```json
{
  "name": "@sentineliq/shared-types",
  "version": "1.0.0",
  "description": "Tipos TypeScript compartilhados",
  "main": "src/index.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.8.2"
  }
}
```

### 6️⃣ Configurar `.npmrc` na raiz

```ini
# .npmrc
workspaces-update-check=false
legacy-peer-deps=true
```

### 7️⃣ Configurar exclusões no `.gitignore`

```
# Lerna
lerna-debug.log*
lerna/

# Wasp (deixar sem modificações)
app/.wasp/
```

## 🚀 Usar Lerna com Wasp

### Importar tipos/utils em Wasp

```typescript
// app/src/client/components/MyComponent.tsx
import type { User } from '@sentineliq/shared-types';
import { formatDate } from '@sentineliq/utils';
```

### Verificar se tudo está linkado

```bash
npm ls
```

Deve mostrar:

```
sentineliq-monorepo
├── app
├── apps
│   ├── blog
│   └── e2e-tests
├── packages
│   ├── @sentineliq/shared-types
│   ├── @sentineliq/ui-components
│   ├── @sentineliq/utils
│   └── @sentineliq/validators
└── (todas com link-level indication)
```

## 🔄 Workflow com Lerna + Wasp

### Desenvolvimento

```bash
# Terminal 1: Wasp (como sempre)
npm run dev

# Terminal 2: Alterações em packages (opcional)
cd packages/shared-types
npm run build  # Recompila types se necessário

# npm workspaces já detecta mudanças automaticamente
```

### Versionamento

```bash
# Ver packages alterados
npm run lerna:changed

# Aumentar versões (escolhe: patch/minor/major por package)
npm run lerna:version

# Publicar (apenas packages, não app/Wasp)
npm run lerna:publish
```

## ⚠️ Troubleshooting Lerna + Wasp

### Problema: "Cannot find module '@sentineliq/shared-types'"

**Solução:**
```bash
npm install --workspaces
npm run build:all
```

### Problema: Wasp não reconhece mudanças em packages

**Solução:**
1. Reiniciar `wasp start`
2. Verificar: `npm ls @sentineliq/shared-types`
3. Se symlink está quebrado: `rm -rf node_modules && npm install`

### Problema: Lerna tenta publicar o `app`

**Solução:** Adicione em `lerna.json`:
```json
{
  "packages": [
    "packages/*",
    "apps/blog",
    "apps/e2e-tests"
  ],
  "ignorePatterns": ["app"]
}
```

## 📚 Estrutura Final Recomendada

```
sentineliq/
│
├── packages/                          # Lerna gerencia
│   ├── shared-types/
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── workspace.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui-components/
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── utils/
│   │   ├── src/
│   │   │   ├── formatting.ts
│   │   │   ├── validators.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── validators/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── apps/                              # npm workspaces apenas
│   ├── blog/
│   │   └── package.json
│   │
│   └── e2e-tests/
│       └── package.json
│
├── app/ (SentinelIQ)                  # ⚠️ Wasp (NUNCA em Lerna)
│   ├── main.wasp
│   ├── package.json
│   ├── src/
│   └── .wasp/
│
├── lerna.json                         # Configuração Lerna
├── package.json                       # Root
├── .npmrc
└── .gitignore
```

## ✅ Checklist de Implementação

- [ ] Instalar Lerna
- [ ] Criar `lerna.json`
- [ ] Criar estrutura de `packages/`
- [ ] Atualizar `package.json` root
- [ ] Criar `package.json` em cada package
- [ ] Rodar `npm install`
- [ ] Verificar: `npm ls`
- [ ] Testar: `npm run dev` (Wasp)
- [ ] Testar importação de types
- [ ] Documentar setup em README

## 🎓 Recursos

- [Documentação Lerna](https://lerna.js.org/)
- [Wasp Monorepo Guide](https://wasp.sh/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)

---

## 🤝 Próximos Passos

1. **Mover código compartilhado** de `app/src` para `packages/`
2. **Criar CI/CD** para publicação de packages
3. **Configurar TypeScript** para module resolution
4. **Documentar** padrões de uso

