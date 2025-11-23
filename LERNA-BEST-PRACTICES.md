# ⚠️ Guia de Boas Práticas: Lerna + Wasp

## 🚨 Problemas Comuns e Soluções

### 1. **SentinelIQ (Wasp) Não Reconhece Mudanças em Packages**

**Sintoma:**
```
Error: Cannot find module '@sentineliq/shared-types'
```

**Causa:** Symlinks não estão criados corretamente

**Solução:**
```bash
# 1. Verificar symlinks
npm ls @sentineliq/shared-types

# 2. Se não estão linkados:
npm install --workspaces --force

# 3. Verificar que está em node_modules
ls -la node_modules/@sentineliq/

# 4. Restart Wasp
npm run dev
```

---

### 2. **Erro: "app" (SentinelIQ) Publicado no npm**

**Sintoma:**
```
Publishing app version 1.0.1 to npm...
```

**Causa:** `app/` (SentinelIQ) incluído em `packages` de `lerna.json`

**Verificação:**
```bash
cat lerna.json | grep -A5 '"packages"'
```

**Solução:**
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

---

### 3. **Circular Dependencies**

**Sintoma:**
```
Error: Circular dependency detected
```

**Boas práticas:**
```
✅ PERMITIDO:
@sentineliq/shared-types → Nenhuma dependência
@sentineliq/utils → shared-types
@sentineliq/validators → shared-types, utils
@sentineliq/ui-components → shared-types, utils

❌ NÃO PERMITIDO:
shared-types → qualquer outro
ui-components → validators (se validators → ui-components)
```

**Visualizar grafo:**
```bash
npx lerna list --graph --all
```

---

### 4. **Conflitos entre SentinelIQ (Wasp) e Lerna com Dependências**

**Sintoma:**
```
npm ERR! found 0 vulnerabilities, but expected 3
```

**Causa:** Versões diferentes de dependências

**Solução:**
```bash
# No app/package.json, usar workspace:* para packages locais
{
  "dependencies": {
    "@sentineliq/shared-types": "workspace:*"
  }
}
```

---

### 5. **Build Diferente Entre dev e prod**

**Sintoma:**
```
Works locally but fails in CI/CD
```

**Solução - Criar script de build:**

**`scripts/build.sh`:**
```bash
#!/bin/bash
set -e

echo "📦 Building packages..."
npm run build --workspaces

echo "🏗️  Building SentinelIQ..."
npm run build -w app

echo "✅ Build complete!"
```

```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

---

## 📋 Checklist: Antes de Publicar

```bash
# 1. Verificar mudanças
npx lerna changed

# 2. Ver o que será publicado
npm run lerna:diff

# 3. Verificar versões
npx lerna list --all --long

# 4. Testar builds
npm run build:all

# 5. Rodar testes (se houver)
npm run test --workspaces

# 6. Aprovar e versionar
npm run lerna:version

# 7. Review antes de publicar
git status
git log --oneline -5

# 8. Publicar
npm run lerna:publish
```

---

## 🔐 Segurança

### NPM Token

**Setup CI/CD com npm token:**

```bash
# Local (NOT RECOMMENDED)
npm login

# CI/CD: Usar GitHub Secrets
export NPM_TOKEN="npm_xxxxx"

# .npmrc (não commitar!)
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
```

### Validar Acesso a Packages

```bash
# Testar publicação (dry-run)
npm run lerna:publish -- --dry-run

# Ver quem tem acesso
npm owner ls @sentineliq/shared-types
```

---

## 🎯 Padrões de Versionamento

### Semantic Versioning

```
MAJOR.MINOR.PATCH
 ↑      ↑     ↑
 │      │     └─ Bug fixes: 1.0.1
 │      └────── Features: 1.1.0
 └──────────── Breaking: 2.0.0
```

### Commits Convencionais

```bash
# Feature
git commit -m "feat: add new validator"  # MINOR bump

# Bug fix
git commit -m "fix: type inference"  # PATCH bump

# Breaking change
git commit -m "feat!: rename User type"  # MAJOR bump

# Docs (não impacta versão)
git commit -m "docs: update README"  # Nenhum bump
```

---

## 🧩 Estrutura de Importação

### ✅ Permitido

```typescript
// app/src/client/components/MyComponent.tsx
import type { User, Workspace } from '@sentineliq/shared-types';
import { formatDate, validateEmail } from '@sentineliq/utils';
import { userSchema } from '@sentineliq/validators';
import { Button } from '@sentineliq/ui-components';
```

### ❌ Não Permitido

```typescript
// ❌ Importar internals
import { privateFunction } from '@sentineliq/utils/src/internal.js';

// ❌ Sem escopo
import { Button } from 'ui-components';

// ❌ De outro workspace
import { SomeType } from '../../app/src/types.ts';
```

---

## 🔄 Workflow de Desenvolvimento

### Adicionar Novo Package

```bash
# 1. Criar pasta e estrutura
mkdir -p packages/my-new-package/src
cd packages/my-new-package

# 2. Copiar template (ou criar)
cat > package.json << 'EOF'
{
  "name": "@sentineliq/my-new-package",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@sentineliq/shared-types": "workspace:*"
  }
}
EOF

# 3. Copiar tsconfig
cp ../../app/tsconfig.json tsconfig.json

# 4. Criar src/index.ts
echo "export const myFunction = () => {};" > src/index.ts

# 5. Instalar
npm install --workspaces

# 6. Verificar
npx lerna list
```

### Usar Novo Package

```typescript
// Em outro package ou app:
import { myFunction } from '@sentineliq/my-new-package';
```

---

## 📊 Monitoramento

### Ver Saúde do Monorepo

```bash
# Packages instalados
npx lerna list --all --long

# Estrutura de dependências
npx lerna list --graph

# Changelogs
npx lerna changed
npx lerna diff

# Tamanho
du -sh packages/*/node_modules
du -sh app/node_modules
```

---

## 🚀 CI/CD com GitHub Actions

**`.github/workflows/publish.yml`:**

```yaml
name: Publish Packages

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm install --workspaces

      - run: npm run build:all

      - run: npm run test --workspaces --if-present

      - env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: |
          echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
          npm run lerna:publish -- --yes
```

---

## ✅ Teste Final

```bash
# Terminal 1: Dev
npm run dev

# Terminal 2: Modificar um package
cd packages/shared-types
echo "export type NewType = {};" >> src/types.ts

# Terminal 3: Ver se SentinelIQ detecta
# (SentinelIQ deve recompilar automaticamente)

# Testar import no app
import type { NewType } from '@sentineliq/shared-types';
```

Se funcionar, você está pronto! 🎉

---

## 📚 Recursos

- [Lerna Best Practices](https://lerna.js.org/docs/features/versioning-packages)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Monorepo Tooling](https://monorepo.tools/)
