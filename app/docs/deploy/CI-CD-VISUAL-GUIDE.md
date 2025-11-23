# 🎯 Guia Visual: Como Usar o Novo Sistema de CI/CD

## 🚀 Fluxo Completo de Desenvolvimento

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. DESENVOLVIMENTO LOCAL                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Crie uma branch:                                                │
│  $ git checkout -b feature/minha-feature                         │
│                                                                   │
│  Faça suas alterações no código...                              │
│  $ vim src/core/auth/operations.ts                              │
│                                                                   │
│  Teste localmente:                                               │
│  $ wasp start                                                    │
│  $ npm run lint:fix                                              │
│  $ npm test                                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      2. COMMIT SEMÂNTICO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Adicione arquivos:                                              │
│  $ git add .                                                     │
│                                                                   │
│  OPÇÃO A: Use Commitizen (Recomendado)                          │
│  $ npm run commit                                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ? Select the type of change that you're committing:        │ │
│  │ ❯ feat:     A new feature                                  │ │
│  │   fix:      A bug fix                                      │ │
│  │   docs:     Documentation only changes                     │ │
│  │   style:    Changes that don't affect meaning              │ │
│  │   refactor: A code change that neither fixes nor adds      │ │
│  │   perf:     A code change that improves performance        │ │
│  │   test:     Adding missing tests                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  OPÇÃO B: Commit Manual                                          │
│  $ git commit -m "feat(auth): add 2FA support"                  │
│                                                                   │
│  ✅ Hooks automáticos executam:                                 │
│     → lint-staged (formata código)                              │
│     → commitlint (valida mensagem)                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      3. PUSH E PULL REQUEST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Envie para GitHub:                                              │
│  $ git push origin feature/minha-feature                         │
│                                                                   │
│  Crie Pull Request no GitHub                                     │
│  Template automático aparece com checklist                       │
│                                                                   │
│  ✅ CI Pipeline executa automaticamente:                        │
│     → Lint (Prettier + ESLint)                                  │
│     → Validate Wasp                                             │
│     → Tests (Unit + Integration)                                │
│     → Build (Wasp build)                                        │
│     → Security Scan                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      4. CODE REVIEW E MERGE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Aguarde aprovação do code review                                │
│  Faça ajustes se necessário                                      │
│  Merge para main após aprovação                                  │
│                                                                   │
│  ✅ Após merge para main:                                        │
│     → Deploy automático para STAGING                            │
│     → Testes de smoke                                           │
│     → Notificação de sucesso/falha                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        5. CRIAR RELEASE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  OPÇÃO A: Via GitHub Actions (Recomendado)                       │
│  1. Vá para Actions → Release - Semantic Versioning             │
│  2. Clique em "Run workflow"                                     │
│  3. Selecione tipo de release:                                   │
│     • patch  → 1.0.0 → 1.0.1 (bug fixes)                        │
│     • minor  → 1.0.0 → 1.1.0 (new features)                     │
│     • major  → 1.0.0 → 2.0.0 (breaking changes)                 │
│  4. Clique em "Run workflow"                                     │
│                                                                   │
│  OPÇÃO B: Localmente                                             │
│  $ npm run release                  # Auto-detecta versão       │
│  $ npm run release:minor            # Nova feature              │
│  $ npm run release:patch            # Bug fix                   │
│  $ npm run release:major            # Breaking change           │
│                                                                   │
│  ✅ O que acontece:                                              │
│     → Analisa commits desde última release                      │
│     → Determina novo número de versão                           │
│     → Atualiza package.json                                     │
│     → Gera/atualiza CHANGELOG.md                                │
│     → Cria commit de release                                    │
│     → Cria Git tag (vX.Y.Z)                                     │
│     → Push automático                                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   6. DEPLOY PARA PRODUCTION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✅ CD Pipeline executa automaticamente ao criar tag:            │
│     → Build da aplicação                                        │
│     → Deploy para Fly.io Production                             │
│     → Executa migrations no banco                               │
│     → Testes de smoke                                           │
│     → Cria GitHub Release com notas                             │
│                                                                   │
│  ⏪ Se falhar:                                                   │
│     → Rollback automático                                       │
│     → Notificação de equipe                                     │
│                                                                   │
│  🎉 Se sucesso:                                                  │
│     → App atualizado em produção                                │
│     → Release notes publicadas                                  │
│     → CHANGELOG disponível para usuários                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Exemplos Práticos de Commits

### ✨ Nova Feature
```bash
# Via Commitizen
$ npm run commit
? Type: feat
? Scope: auth
? Short description: add 2FA support
? Long description: Implement two-factor authentication with TOTP
? Breaking changes: No
? Issues closed: #123

# Manual
$ git commit -m "feat(auth): add 2FA support

Implement two-factor authentication using TOTP (Time-based One-Time Password).
Users can now enable 2FA in their security settings.

Closes #123"
```

**Resultado no CHANGELOG:**
```markdown
### ✨ Features
- **auth**: add 2FA support (#123)
```

---

### 🐛 Bug Fix
```bash
# Via Commitizen
$ npm run commit
? Type: fix
? Scope: payment
? Short description: correct webhook validation
? Long description: Fix Stripe webhook signature verification
? Breaking changes: No
? Issues closed: #456

# Manual
$ git commit -m "fix(payment): correct webhook validation

Fix Stripe webhook signature verification that was causing
false positives in production environment.

Fixes #456"
```

**Resultado no CHANGELOG:**
```markdown
### 🐛 Bug Fixes
- **payment**: correct webhook validation (#456)
```

---

### 💥 Breaking Change
```bash
# Via Commitizen
$ npm run commit
? Type: feat
? Scope: api
? Short description: change authentication response format
? Long description: Update auth endpoint to return access and refresh tokens
? Breaking changes: Yes
? Breaking change description: 
  BREAKING CHANGE: The /api/auth endpoint now returns a different response format.
  Old: { token: string }
  New: { accessToken: string, refreshToken: string, expiresIn: number }
? Issues closed: #789

# Manual
$ git commit -m "feat(api)!: change authentication response format

BREAKING CHANGE: The /api/auth endpoint now returns a different response format.
Old: { token: string }
New: { accessToken: string, refreshToken: string, expiresIn: number }

Closes #789"
```

**Resultado:**
- **Version bump**: MAJOR (1.0.0 → 2.0.0)
- **CHANGELOG:**
```markdown
### ⚠ BREAKING CHANGES
- **api**: change authentication response format (#789)
```

---

### ♻️ Refactoring
```bash
$ npm run commit
? Type: refactor
? Scope: notifications
? Short description: extract delivery service to separate module

# Ou manual
$ git commit -m "refactor(notifications): extract delivery service to separate module

Move notification delivery logic to dedicated service for better
testability and separation of concerns."
```

**Resultado:**
- **Version bump**: None (incluído no próximo release)
- **CHANGELOG:**
```markdown
### ♻️ Code Refactoring
- **notifications**: extract delivery service to separate module
```

---

## 🎯 Tipos de Commit e Seus Efeitos

| Tipo       | Exemplo                                  | Version Bump | Aparece no CHANGELOG |
| ---------- | ---------------------------------------- | ------------ | -------------------- |
| `feat`     | `feat(auth): add OAuth2`                 | MINOR        | ✅ Sim               |
| `fix`      | `fix(api): correct validation`           | PATCH        | ✅ Sim               |
| `perf`     | `perf(db): optimize queries`             | PATCH        | ✅ Sim               |
| `refactor` | `refactor(ui): extract component`        | -            | ✅ Sim               |
| `docs`     | `docs(api): update guide`                | -            | ✅ Sim               |
| `style`    | `style(ui): fix spacing`                 | -            | ✅ Sim               |
| `test`     | `test(auth): add login tests`            | -            | ✅ Sim               |
| `build`    | `build(deps): upgrade Wasp`              | -            | ✅ Sim               |
| `ci`       | `ci(github): add security scan`          | -            | ✅ Sim               |
| `chore`    | `chore(deps): update packages`           | -            | ✅ Sim               |
| `BREAKING` | `feat(api)!: change response`            | MAJOR        | ⚠️ Destaque especial |

---

## 🔄 Fluxo de Release Visual

```
Commits acumulados desde última release:
────────────────────────────────────────
feat(auth): add 2FA support           → MINOR bump
fix(payment): webhook validation      → PATCH bump
feat(workspace): add templates        → MINOR bump
fix(ui): button alignment             → PATCH bump
docs(api): update authentication      → No bump
refactor(db): optimize queries        → No bump
────────────────────────────────────────

Executar: npm run release
────────────────────────────────────────
✓ Analisa commits
✓ Determina version: 1.0.0 → 1.1.0 (MINOR)
✓ Gera CHANGELOG.md:

  ## [1.1.0] - 2025-11-23
  
  ### ✨ Features
  - **auth**: add 2FA support
  - **workspace**: add templates
  
  ### 🐛 Bug Fixes
  - **payment**: webhook validation
  - **ui**: button alignment
  
  ### 📚 Documentation
  - **api**: update authentication
  
  ### ♻️ Code Refactoring
  - **db**: optimize queries

✓ Cria commit: chore(release): v1.1.0
✓ Cria tag: v1.1.0
✓ Push para GitHub
✓ Trigger CD pipeline
✓ Deploy para Production
✓ Cria GitHub Release
────────────────────────────────────────
```

---

## 🎨 Usando o Commitizen (Passo a Passo)

### 1. Adicionar mudanças
```bash
$ git add .
```

### 2. Iniciar Commitizen
```bash
$ npm run commit
```

### 3. Selecionar tipo
```
? Select the type of change that you're committing:
❯ feat:     A new feature
  fix:      A bug fix
  docs:     Documentation only changes
  style:    Changes that don't affect the meaning of the code
  refactor: A code change that neither fixes a bug nor adds a feature
  perf:     A code change that improves performance
  test:     Adding missing tests or correcting existing tests
  build:    Changes that affect the build system or external dependencies
  ci:       Changes to our CI configuration files and scripts
  chore:    Other changes that don't modify src or test files
  revert:   Reverts a previous commit
```

### 4. Especificar escopo
```
? What is the scope of this change (e.g. component or file name): (press enter to skip)
❯ auth
```

### 5. Descrição curta
```
? Write a short, imperative tense description of the change (max 94 chars):
❯ add 2FA support with TOTP
```

### 6. Descrição longa (opcional)
```
? Provide a longer description of the change: (press enter to skip)
❯ Implement two-factor authentication using TOTP.
  Users can enable 2FA in security settings.
```

### 7. Breaking changes
```
? Are there any breaking changes?
❯ No
  Yes
```

### 8. Issues relacionadas
```
? Does this change affect any open issues?
❯ Yes
  No

? Add issue references (e.g. "fix #123", "re #123".):
❯ Closes #123
```

### 9. Confirmação
```
feat(auth): add 2FA support with TOTP

Implement two-factor authentication using TOTP.
Users can enable 2FA in security settings.

Closes #123

? Are you sure you want to proceed with the commit above?
❯ Yes
  No
```

### 10. Hooks executam
```
✓ Preparing lint-staged...
✓ Running tasks for staged files...
✓ Applying modifications from tasks...
✓ Cleaning up temporary files...
✓ Commitlint checking...
✓ Commit created!
```

---

## 🚀 Exemplo Completo: Adicionar Nova Feature

```bash
# 1. Criar branch
$ git checkout -b feature/add-sso

# 2. Fazer mudanças
$ vim src/core/auth/operations.ts
$ vim src/client/pages/auth/SSOLoginPage.tsx

# 3. Testar localmente
$ wasp start
$ npm test

# 4. Lint
$ npm run lint:fix

# 5. Validar
$ wasp validate

# 6. Adicionar arquivos
$ git add .

# 7. Commit com Commitizen
$ npm run commit

? Type: feat
? Scope: auth
? Description: add SSO support with SAML 2.0
? Long description: Implement Single Sign-On using SAML 2.0 protocol.
                    Supports Azure AD, Okta, and Google Workspace.
? Breaking changes: No
? Issues: Closes #234

# 8. Push
$ git push origin feature/add-sso

# 9. Criar PR no GitHub
# Template aparece automaticamente

# 10. Após aprovação e merge
# → CI executa
# → Deploy staging automático

# 11. Criar release
# GitHub Actions → Release → Run workflow
# Selecione: minor (nova feature)

# 12. Deploy production automático
# → v1.2.0 criado
# → CHANGELOG atualizado
# → Production deployment triggered
```

---

## ✅ Checklist Antes do Commit

- [ ] Código testado localmente (`wasp start`)
- [ ] Testes passando (`npm test`)
- [ ] Lint corrigido (`npm run lint:fix`)
- [ ] Wasp validado (`wasp validate`)
- [ ] Documentação atualizada (se necessário)
- [ ] Migrations criadas (se schema mudou)
- [ ] Commit message segue Conventional Commits

---

## 🆘 Troubleshooting

### Commit rejeitado por commitlint
```bash
# Erro
✖ subject may not be empty [subject-empty]
✖ type may not be empty [type-empty]

# Solução
$ npm run commit  # Use Commitizen
# Ou corrija formato manualmente:
$ git commit -m "feat(auth): add feature"
```

### Lint-staged falhou
```bash
# Erro
✖ Prettier errors

# Solução
$ npm run lint:fix
$ git add .
$ git commit --amend --no-edit
```

### Husky hooks não executam
```bash
# Reinstalar hooks
$ npm run prepare
$ chmod +x .husky/commit-msg
$ chmod +x .husky/pre-commit
```

---

## 📚 Recursos Adicionais

- **Guia Completo**: [docs/deploy/CI-CD-PIPELINE.md](./CI-CD-PIPELINE.md)
- **Referência Rápida**: [QUICK_REFERENCE.md](../../QUICK_REFERENCE.md)
- **Contribuindo**: [CONTRIBUTING.md](../../CONTRIBUTING.md)
- **Conventional Commits**: https://www.conventionalcommits.org/

---

**🎉 Pronto para começar!**

Experimente criar seu primeiro commit com `npm run commit` e siga o fluxo interativo.
