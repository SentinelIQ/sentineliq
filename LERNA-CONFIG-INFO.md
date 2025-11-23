# Configuração do Lerna para SentinelIQ

Arquivo `lerna.json` configurado com as seguintes características:

## 🎯 Configuração

- **Mode**: `independent` - cada package tem sua própria versão
- **npm Client**: npm (nativo, compatível com workspaces)
- **Packages gerenciados**: `packages/*`, `apps/blog`, `apps/e2e-tests`
- **App Wasp**: ⚠️ Explicitamente ignorado em `ignorePatterns`

## 📦 Estrutura Esperada

```
sentineliq/
├── packages/
│   ├── shared-types/
│   ├── ui-components/
│   ├── utils/
│   └── validators/
├── apps/
│   ├── blog/
│   └── e2e-tests/
├── app/              ← Wasp (NÃO gerenciado por Lerna)
├── lerna.json
└── package.json (root)
```

## ⚠️ Características de Segurança

1. **App Wasp ignorado**: `"ignorePatterns": ["app"]` - garante que Wasp não interfira
2. **Publishing seguro**: `"ignoreChanges": ["app/**"]` - Wasp não bloqueia publicações
3. **Publish somente npm**: registry padrão (sem GitHub registry)
4. **Conventional commits**: Padrão de mensagens de commit

## 🚀 Próximos Passos

1. Instalar: `npm install --save-dev lerna`
2. Criar estrutura: `mkdir -p packages/{shared-types,ui-components,utils,validators}`
3. Criar `package.json` em cada package com escopo: `@sentineliq/package-name`
4. Rodar: `npm install --workspaces`
5. Verificar: `npm ls`

## 📚 Comandos Úteis

```bash
# Ver packages alterados
npx lerna changed

# Ver diferenças
npx lerna diff

# Versionar (interactive)
npm run lerna:version

# Publicar no npm
npm run lerna:publish

# Listar packages com versões
npx lerna list --all --long
```
