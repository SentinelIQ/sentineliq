# 🚀 Guia de Instalação: Lerna + Wasp

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Git
- SentinelIQ (Wasp) já funcionando em `app/`

## ✅ Passo 1: Instalar Lerna

```bash
cd /home/luizg/prj/sentineliq

# Instalar Lerna como dev dependency
npm install --save-dev lerna

# Verificar instalação
npx lerna --version
```

**Output esperado:** `lerna 8.x.x`

---

## ✅ Passo 2: Estrutura de Pastas

```bash
# Criar diretório de packages
mkdir -p packages/{shared-types,ui-components,utils,validators}

# (Opcional) Reorganizar apps se necessário
mkdir -p apps

# Verificar estrutura
tree -L 2 -d
```

**Expected output:**

```
.
├── packages/
│   ├── shared-types/
│   ├── ui-components/
│   ├── utils/
│   └── validators/
├── apps/
├── app/
├── blog/
├── e2e-tests/
└── ...
```

---

## ✅ Passo 3: Criar package.json em cada Package

### Para cada pasta em `packages/`, criar um `package.json`:

**`packages/shared-types/package.json`**
```bash
# Copiar do arquivo template:
# templates/packages-shared-types-package.json
```

**`packages/ui-components/package.json`**
```bash
# Copiar do arquivo template:
# templates/packages-ui-components-package.json
```

**`packages/utils/package.json`**
```bash
# Copiar do arquivo template:
# templates/packages-utils-package.json
```

**`packages/validators/package.json`**
```bash
# Copiar do arquivo template:
# templates/packages-validators-package.json
```

---

## ✅ Passo 4: Criar tsconfig.json em cada Package

**`packages/shared-types/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Repetir para:** `ui-components/`, `utils/`, `validators/`

---

## ✅ Passo 5: Criar index.ts em cada Package

**`packages/shared-types/src/index.ts`**
```typescript
// Re-export all types from this package
export * from './types.js';
```

**Criar arquivo vazio:**
```bash
touch packages/shared-types/src/types.ts
touch packages/ui-components/src/index.ts
touch packages/utils/src/index.ts
touch packages/validators/src/index.ts
```

---

## ✅ Passo 6: Instalar Dependências

```bash
# Na raiz do projeto
npm install --workspaces

# Isso vai:
# 1. Instalar packages de cada workspace
# 2. Criar symlinks para packages locais
# 3. Instalar do app/ (Wasp) separadamente
```

**Esperado:** Sem erros, mesmo que Wasp demore

---

## ✅ Passo 7: Verificar Setup

```bash
# Listar workspaces instalados
npm ls

# Deve mostrar:
# sentineliq-monorepo
# ├── @sentineliq/shared-types
# ├── @sentineliq/ui-components
# ├── @sentineliq/utils
# ├── @sentineliq/validators
# ├── app
# ├── apps/blog
# └── apps/e2e-tests

# Listar packages Lerna
npx lerna list --all --long

# Ver estrutura
lerna ls --loglevel=verbose
```

---

## ✅ Passo 8: Testar com SentinelIQ (Wasp)

**Terminal 1: Inicie SentinelIQ**
```bash
npm run dev
```

**Terminal 2: Teste imports nos types**
```bash
# Dentro de app/src, tente importar:
# import type { SomeType } from '@sentineliq/shared-types';
```

Se SentinelIQ compilar sem erros, tudo está funcionando! ✅

---

## 🔧 Troubleshooting

### ❌ Erro: "Cannot find module '@sentineliq/shared-types'"

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules
npm install --workspaces

# Se ainda falhar, verificar links
npm ls @sentineliq/shared-types
```

### ❌ Erro: "SentinelIQ não compila após Lerna install"

**Solução:**
```bash
# SentinelIQ (Wasp) tem seu próprio build system
cd app
wasp clean
wasp build
# ou
npm run dev
```

### ❌ Erro: "npm ERR! workspaces not supported for apps"

**Solução:** Verificar `package.json` root - deve ter `"workspaces"` no topo

---

## 📝 Scripts Úteis

Adicionar ao `package.json` root:

```json
{
  "scripts": {
    "dev": "npm run dev -w app",
    "dev:all": "concurrently \"npm run dev -w app\" \"npm run dev -w blog\"",
    "build:all": "npm run build --workspaces",
    "lerna:changed": "lerna changed",
    "lerna:version": "lerna version",
    "lerna:publish": "lerna publish",
    "lerna:clean": "lerna clean -y",
    "setup": "npm install --workspaces && npm run build:all"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "lerna": "^8.1.8"
  }
}
```

---

## ✅ Checklist Final

- [ ] Lerna instalado: `npx lerna --version`
- [ ] Estrutura criada: `tree -L 2 -d`
- [ ] `package.json` em cada package
- [ ] `tsconfig.json` em cada package
- [ ] `index.ts` em cada package
- [ ] `npm install --workspaces` executado
- [ ] `npm ls` mostra todos os packages
- [ ] SentinelIQ funciona: `npm run dev`
- [ ] Imports funcionam no SentinelIQ
- [ ] Lerna reconhece packages: `npx lerna list`

---

## 🎓 Próximos Passos

1. **Extrair código compartilhado** de `app/src` para `packages/`
2. **Documentar convenções** de nomes e estrutura
3. **Configurar CI/CD** para publicação de packages
4. **Setup GitHub Actions** para versionamento automático

---

## 📚 Referências

- [Lerna Docs](https://lerna.js.org/)
- [npm Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [Wasp Docs](https://wasp.sh/docs)
