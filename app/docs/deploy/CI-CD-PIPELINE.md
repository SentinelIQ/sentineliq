# 🚀 CI/CD Pipeline - SentinelIQ

Este documento descreve o fluxo completo de CI/CD (Continuous Integration/Continuous Deployment) implementado no projeto SentinelIQ usando **GitHub Actions**, **Conventional Commits**, e **Semantic Versioning**.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Commits Semânticos](#commits-semânticos)
- [Processo de Release](#processo-de-release)
- [Workflows CI/CD](#workflows-cicd)
- [Ambientes de Deploy](#ambientes-de-deploy)
- [Guia de Contribuição](#guia-de-contribuição)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O pipeline CI/CD do SentinelIQ automatiza:

- ✅ **Validação de código** (lint, type-check)
- ✅ **Testes automatizados** (unit, integration)
- ✅ **Build da aplicação Wasp**
- ✅ **Deploy automático** (staging e production)
- ✅ **Versionamento semântico** com changelog automático
- ✅ **Segurança** (dependency scanning, audit)
- ✅ **Docker images** (build e publish)

### 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Developer Workflow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. 💻 Desenvolvimento Local                                     │
│     └─ npm run commit (Commitizen)                              │
│     └─ Husky hooks (lint-staged + commitlint)                   │
│                                                                   │
│  2. 📤 Push to Branch                                            │
│     └─ CI Pipeline (lint, test, build)                          │
│                                                                   │
│  3. 🔀 Pull Request to main/develop                              │
│     └─ CI Pipeline + Dependency Review                          │
│     └─ Code Review                                               │
│                                                                   │
│  4. ✅ Merge to main                                             │
│     └─ Deploy to Staging (automatic)                            │
│                                                                   │
│  5. 🏷️ Create Release (manual workflow)                         │
│     └─ npm run release / GitHub Action                          │
│     └─ Generate CHANGELOG                                        │
│     └─ Create Git Tag                                            │
│                                                                   │
│  6. 🚀 Deploy to Production (on tag push)                        │
│     └─ CD Pipeline                                               │
│     └─ Smoke Tests                                               │
│     └─ GitHub Release                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Commits Semânticos

Usamos **Conventional Commits** para padronizar mensagens de commit e gerar changelogs automaticamente.

### 📐 Formato

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 🎯 Types Permitidos

| Type       | Descrição                                      | Emoji | Changelog Section      |
| ---------- | ---------------------------------------------- | ----- | ---------------------- |
| `feat`     | Nova funcionalidade                            | ✨    | Features               |
| `fix`      | Correção de bug                                | 🐛    | Bug Fixes              |
| `perf`     | Melhoria de performance                        | ⚡    | Performance            |
| `refactor` | Refatoração de código                          | ♻️    | Code Refactoring       |
| `docs`     | Mudanças na documentação                       | 📚    | Documentation          |
| `style`    | Formatação, espaços, ponto-e-vírgula           | 💎    | Styles                 |
| `test`     | Adicionar ou corrigir testes                   | ✅    | Tests                  |
| `build`    | Mudanças no build system                       | 🏗️    | Build System           |
| `ci`       | Mudanças em CI/CD                              | 👷    | CI/CD                  |
| `chore`    | Outras mudanças que não afetam código fonte    | 🔧    | Chores                 |
| `revert`   | Reverter commit anterior                       | ⏪    | Reverts                |
| `wip`      | Work in progress (não usar em main/develop)    | 🚧    | -                      |
| `release`  | Commits de release (gerados automaticamente)   | 🎉    | -                      |

### 🏷️ Scopes Disponíveis

```
auth, workspace, notifications, payment, analytics, audit, logs, jobs,
aegis, eclipse, mitre, taskmanager, admin, ui, api, db, config, deploy,
deps, i18n, websocket, redis, elk, minio, security
```

### ✍️ Exemplos

#### ✨ Nova Feature
```bash
feat(auth): add 2FA support with TOTP

Implement two-factor authentication using TOTP (Time-based One-Time Password).
Users can now enable 2FA in their security settings.

Closes #123
```

#### 🐛 Bug Fix
```bash
fix(workspace): prevent duplicate workspace creation

Add uniqueness constraint on workspace slug to prevent duplicate entries.

Fixes #456
```

#### 💥 Breaking Change
```bash
feat(api)!: change authentication endpoint structure

BREAKING CHANGE: The /api/auth endpoint now returns a different response format.
Old: { token: string }
New: { accessToken: string, refreshToken: string, expiresIn: number }

Closes #789
```

#### ♻️ Refactoring
```bash
refactor(notifications): extract delivery service to separate module

Move notification delivery logic to dedicated service for better testability
and separation of concerns.
```

### 🔧 Ferramentas

#### Commitizen (Recomendado)

Use o helper interativo para criar commits:

```bash
npm run commit
```

Isso abrirá um prompt interativo guiando você pelo formato correto.

#### Manual

Se preferir escrever manualmente:

```bash
git commit -m "feat(auth): add OAuth2 support"
```

⚠️ **Nota**: O commit será validado pelo **commitlint** via Husky hook. Se não seguir o padrão, será rejeitado.

---

## 🏷️ Processo de Release

Usamos **standard-version** para automação de releases com versionamento semântico.

### 📊 Semantic Versioning (SemVer)

Formato: `MAJOR.MINOR.PATCH` (ex: `1.4.2`)

- **MAJOR**: Mudanças incompatíveis na API (breaking changes)
- **MINOR**: Nova funcionalidade compatível com versão anterior
- **PATCH**: Correção de bugs compatível com versão anterior

### 🚀 Criando Releases

#### Via NPM (Local)

```bash
# Primeira release
npm run release:first

# Release automático (detecta tipo baseado em commits)
npm run release

# Release específico
npm run release:patch   # 1.0.0 → 1.0.1
npm run release:minor   # 1.0.0 → 1.1.0
npm run release:major   # 1.0.0 → 2.0.0

# Pre-release (alpha, beta, rc)
npm run release:pre     # 1.0.0 → 1.0.1-0

# Dry run (simula sem criar release)
npm run release:dry
```

#### Via GitHub Actions (Recomendado)

1. Vá para **Actions** → **Release - Semantic Versioning**
2. Clique em **Run workflow**
3. Selecione o tipo de release:
   - `patch` - Bug fixes
   - `minor` - New features
   - `major` - Breaking changes
   - `prerelease` - Alpha/Beta versions
4. Marque **dry-run** se quiser apenas simular
5. Clique em **Run workflow**

#### O que acontece em um Release?

1. ✅ Analisa commits desde última release
2. ✅ Determina novo número de versão
3. ✅ Atualiza `package.json`
4. ✅ Gera/atualiza `CHANGELOG.md`
5. ✅ Cria commit de release: `chore(release): vX.Y.Z`
6. ✅ Cria Git tag: `vX.Y.Z`
7. ✅ Push automático para GitHub
8. ✅ Cria GitHub Release com notas

### 📝 CHANGELOG Automático

O changelog é gerado automaticamente baseado nos commits:

```markdown
# Changelog

## [1.2.0] - 2025-01-15

### ✨ Features
- **auth**: add 2FA support with TOTP (#123)
- **workspace**: implement workspace templates (#124)

### 🐛 Bug Fixes
- **notifications**: fix duplicate notification delivery (#125)
- **payment**: correct Stripe webhook validation (#126)

### 📚 Documentation
- **api**: update API documentation with new endpoints (#127)
```

---

## ⚙️ Workflows CI/CD

### 1. 🔍 CI - Continuous Integration

**Trigger**: Push ou PR para `main` ou `develop`

**Jobs**:
- ✅ **Lint** - Prettier + ESLint
- ✅ **Validate Wasp** - Valida configuração `main.wasp`
- ✅ **Test** - Testes unitários com cobertura
- ✅ **Build** - Build da aplicação Wasp
- ✅ **Security** - npm audit + Snyk scan

**Arquivo**: `.github/workflows/ci.yml`

```bash
# Executa automaticamente em PRs e pushes
# Workflow falha se qualquer job falhar
```

### 2. 🚀 CD - Continuous Deployment

**Trigger**: 
- Push para `main` → Deploy Staging
- Push de tag `v*` → Deploy Production
- Manual via workflow_dispatch

**Jobs**:
- 🚀 **Deploy Staging** - Fly.io staging app
- 🚀 **Deploy Production** - Fly.io production app
- ⏪ **Rollback** - Rollback automático em falhas

**Arquivo**: `.github/workflows/cd.yml`

```bash
# Staging: Automático em merge para main
# Production: Automático em release tags (vX.Y.Z)
```

### 3. 🏷️ Release - Semantic Versioning

**Trigger**: Manual via GitHub Actions UI

**Jobs**:
- 📦 Executa standard-version
- 📝 Gera CHANGELOG
- 🏷️ Cria tag Git
- 🎉 Cria GitHub Release

**Arquivo**: `.github/workflows/release.yml`

```bash
# Executar manualmente via Actions tab
```

### 4. 🐳 Docker Build & Publish

**Trigger**: Push para `main`, tags `v*`, ou PRs

**Jobs**:
- 🐳 Build Docker image
- 📤 Push para GitHub Container Registry (ghcr.io)

**Arquivo**: `.github/workflows/docker.yml`

### 5. 🔍 Dependency Review

**Trigger**: PRs que modificam `package.json` ou `package-lock.json`

**Jobs**:
- 🔍 Analisa novas dependências
- ⚠️ Alerta sobre vulnerabilidades
- 🚫 Bloqueia licenças GPL/AGPL

**Arquivo**: `.github/workflows/dependency-review.yml`

---

## 🌍 Ambientes de Deploy

### 🧪 Staging

- **URL**: https://staging.sentineliq.app
- **Deploy**: Automático em merge para `main`
- **Banco**: PostgreSQL staging
- **Propósito**: Testes de integração e validação pré-produção

### 🚀 Production

- **URL**: https://sentineliq.app
- **Deploy**: Automático em tags `v*` (releases)
- **Banco**: PostgreSQL production (com replicas)
- **Propósito**: Ambiente de produção para usuários finais

### 📋 Configuração

#### Secrets Necessários

Configure em **Settings** → **Secrets and variables** → **Actions**:

```bash
# Fly.io
FLY_API_TOKEN=<seu-token-flyio>

# URLs
STAGING_API_URL=https://api-staging.sentineliq.app
PRODUCTION_API_URL=https://api.sentineliq.app

# Database (configurado no Fly.io)
DATABASE_URL=<postgres-connection-string>

# Redis
REDIS_URL=<redis-connection-string>

# Stripe
STRIPE_SECRET_KEY=<stripe-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret>

# Segurança (opcional)
SNYK_TOKEN=<snyk-token>
CODECOV_TOKEN=<codecov-token>
```

#### Environment Variables

Configure em cada app Fly.io:

```bash
# Staging
flyctl secrets set NODE_ENV=production -a sentineliq-staging
flyctl secrets set DATABASE_URL=<url> -a sentineliq-staging
flyctl secrets set REDIS_URL=<url> -a sentineliq-staging

# Production
flyctl secrets set NODE_ENV=production -a sentineliq-prod
flyctl secrets set DATABASE_URL=<url> -a sentineliq-prod
flyctl secrets set REDIS_URL=<url> -a sentineliq-prod
```

---

## 🤝 Guia de Contribuição

### 🎯 Workflow de Desenvolvimento

#### 1. **Clone e Setup**

```bash
git clone https://github.com/seu-org/sentineliq.git
cd sentineliq
npm install
wasp start db
wasp start
```

#### 2. **Crie uma Branch**

```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

Padrão de nomes:
- `feature/*` - Nova funcionalidade
- `fix/*` - Correção de bug
- `refactor/*` - Refatoração
- `docs/*` - Documentação
- `test/*` - Testes
- `chore/*` - Manutenção

#### 3. **Desenvolva**

```bash
# Edite arquivos
# Teste localmente com wasp start
# Adicione testes se aplicável
```

#### 4. **Commit (Semântico)**

```bash
git add .
npm run commit  # Recomendado (Commitizen)
# ou
git commit -m "feat(auth): add OAuth2 support"
```

O **Husky** executará automaticamente:
- ✅ **lint-staged** - Formata e valida código modificado
- ✅ **commitlint** - Valida mensagem do commit

Se houver erro, corrija e tente novamente.

#### 5. **Push e Pull Request**

```bash
git push origin feature/nome-da-feature
```

No GitHub:
1. Crie Pull Request para `develop` (ou `main`)
2. Preencha template do PR
3. Aguarde CI passar (lint, test, build)
4. Solicite code review
5. Faça ajustes se necessário
6. Merge após aprovação

#### 6. **Após Merge**

- ✅ Branch será deletada automaticamente
- ✅ Deploy staging acontecerá (se merge para main)
- ✅ CHANGELOG será atualizado no próximo release

### 📋 Checklist de PR

Antes de criar PR, verifique:

- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] `npm run lint` passa sem erros
- [ ] `wasp validate` passa sem erros
- [ ] Documentação atualizada
- [ ] Commits seguem Conventional Commits
- [ ] Branch está atualizada com `main`/`develop`
- [ ] Migrations criadas se schema mudou
- [ ] `main.wasp` atualizado se necessário
- [ ] Workspace isolation implementado (multi-tenancy)
- [ ] Audit logging adicionado para operações sensíveis

### 🔒 Conformidade de Módulos

Para novos módulos, execute:

```bash
@copilot checkprod nome-do-modulo
```

Garanta que todas as 12 dimensões passem:
1. ✅ Database Schema
2. ✅ Wasp Configuration
3. ✅ Backend Operations
4. ✅ Plan Limits
5. ✅ Multi-tenancy
6. ✅ Audit Logging
7. ✅ Rate Limiting
8. ✅ Caching
9. ✅ Real-time Features
10. ✅ Background Jobs
11. ✅ Frontend Integration
12. ✅ Module Integration

---

## 🔧 Troubleshooting

### ❌ Commit Rejeitado

**Erro**: `commitlint failed`

**Solução**:
```bash
# Verifique formato da mensagem
# Deve seguir: type(scope): subject
# Exemplo correto:
git commit -m "feat(auth): add login feature"

# Ou use Commitizen:
npm run commit
```

### ❌ Lint Errors

**Erro**: `prettier check failed` ou `eslint errors`

**Solução**:
```bash
# Auto-fix
npm run lint:fix

# Check novamente
npm run lint
```

### ❌ Build Falhou

**Erro**: `wasp build failed`

**Solução**:
```bash
# Valide Wasp config
wasp validate

# Limpe e rebuild
wasp clean
wasp build

# Verifique entities em main.wasp
# Todas entities usadas devem estar listadas em entities: []
```

### ❌ Deploy Falhou

**Erro**: Fly.io deployment failed

**Solução**:
```bash
# Verifique secrets
flyctl secrets list -a sentineliq-staging

# Teste build local
wasp build
cd .wasp/build
npm install
npm run build

# Deploy manual
flyctl deploy -a sentineliq-staging
```

### ❌ Migrations Falhou

**Erro**: Database migration errors

**Solução**:
```bash
# Reset local DB
wasp db reset

# Create new migration
wasp db migrate-dev

# Apply migrations remotely
flyctl ssh console -a sentineliq-prod -C "wasp db migrate-dev"
```

### 🔍 Debug CI/CD

```bash
# Ver logs do workflow
# GitHub → Actions → Select workflow run → View logs

# Re-run failed jobs
# GitHub → Actions → Select workflow run → Re-run failed jobs

# Debug localmente (act)
act -W .github/workflows/ci.yml
```

---

## 📚 Recursos Adicionais

### Documentação

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Wasp Docs](https://wasp.sh/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Fly.io Docs](https://fly.io/docs/)

### Scripts Úteis

```bash
# Commits
npm run commit              # Commitizen helper

# Releases
npm run release             # Auto release
npm run release:patch       # Patch release (bug fixes)
npm run release:minor       # Minor release (features)
npm run release:major       # Major release (breaking)
npm run release:dry         # Simular release

# Lint
npm run lint                # Check only
npm run lint:fix            # Auto-fix

# Wasp
wasp validate               # Validate config
wasp clean                  # Clean build
wasp db migrate-dev         # Run migrations
wasp build                  # Build app

# Docker
docker-compose up -d        # Start infrastructure
docker-compose down         # Stop infrastructure
docker-compose logs -f      # View logs
```

---

## 🎉 Conclusão

Este pipeline CI/CD garante:

- ✅ **Qualidade de código** através de lint e testes automáticos
- ✅ **Padronização** com commits semânticos
- ✅ **Versionamento claro** com SemVer
- ✅ **Changelog automático** para rastreabilidade
- ✅ **Deploy seguro** com ambientes staging e production
- ✅ **Rollback rápido** em caso de problemas
- ✅ **Rastreabilidade completa** de mudanças

**Próximos passos**:
1. Configure secrets no GitHub
2. Configure apps Fly.io
3. Teste pipeline com um PR
4. Crie primeiro release

**Dúvidas?** Abra uma issue com label `question` ou consulte a documentação.

---

**Última atualização**: 2025-11-23  
**Versão**: 1.0.0  
**Mantido por**: SentinelIQ Team
