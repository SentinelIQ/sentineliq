# ✅ Checklist Implementação: Lerna + Wasp

## 📋 Fase 1: Preparação (15 min)

- [ ] **Backup**: `git commit` todas as mudanças atuais
  ```bash
  git status  # Verificar repo limpo
  git commit -am "backup: antes de Lerna setup"
  ```

- [ ] **Ler documentação**: Começar por `LERNA-README.md`

- [ ] **Entender arquitetura**: Revisar `LERNA-ARCHITECTURE.md`

---

## 📦 Fase 2: Instalação (5 min)

- [ ] **Instalar Lerna**
  ```bash
  npm install --save-dev lerna
  ```

- [ ] **Verificar instalação**
  ```bash
  npx lerna --version  # Deve mostrar 8.x.x
  ```

- [ ] **Confirmar Git**
  ```bash
  git status  # Deve estar limpo
  ```

---

## 📂 Fase 3: Estrutura de Pastas (10 min)

- [ ] **Criar diretório packages**
  ```bash
  mkdir -p packages/{shared-types,ui-components,utils,validators}
  ```

- [ ] **Criar pasta apps (opcional, para reorganização futura)**
  ```bash
  mkdir -p apps
  ```

- [ ] **Verificar estrutura**
  ```bash
  tree -L 2 -d | grep -E "(packages|apps|app)"
  ```

---

## 📝 Fase 4: Criar package.json em cada Package (20 min)

### shared-types

- [ ] **Copiar template**
  ```bash
  cp templates/packages-shared-types-package.json \
     packages/shared-types/package.json
  ```

- [ ] **Verificar conteúdo**
  ```bash
  cat packages/shared-types/package.json | grep name
  # Deve mostrar: "@sentineliq/shared-types"
  ```

### validators

- [ ] **Copiar template**
  ```bash
  cp templates/packages-validators-package.json \
     packages/validators/package.json
  ```

### utils

- [ ] **Copiar template**
  ```bash
  cp templates/packages-utils-package.json \
     packages/utils/package.json
  ```

### ui-components

- [ ] **Copiar template**
  ```bash
  cp templates/packages-ui-components-package.json \
     packages/ui-components/package.json
  ```

---

## 🔧 Fase 5: tsconfig.json em cada Package (10 min)

- [ ] **shared-types/tsconfig.json**
  ```bash
  cat > packages/shared-types/tsconfig.json << 'EOF'
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist",
      "rootDir": "src"
    },
    "include": ["src"]
  }
  EOF
  ```

- [ ] **validators/tsconfig.json**
  ```bash
  cp packages/shared-types/tsconfig.json packages/validators/tsconfig.json
  ```

- [ ] **utils/tsconfig.json**
  ```bash
  cp packages/shared-types/tsconfig.json packages/utils/tsconfig.json
  ```

- [ ] **ui-components/tsconfig.json**
  ```bash
  cp packages/shared-types/tsconfig.json packages/ui-components/tsconfig.json
  ```

---

## 📄 Fase 6: Criar Source Files (5 min)

- [ ] **shared-types/src/index.ts**
  ```bash
  mkdir -p packages/shared-types/src
  echo "// Export all types from this package" > packages/shared-types/src/index.ts
  echo "export * from './types.js';" >> packages/shared-types/src/index.ts
  touch packages/shared-types/src/types.ts
  ```

- [ ] **validators/src/index.ts**
  ```bash
  mkdir -p packages/validators/src
  echo "// Export all validators" > packages/validators/src/index.ts
  touch packages/validators/src/user.ts
  ```

- [ ] **utils/src/index.ts**
  ```bash
  mkdir -p packages/utils/src
  echo "// Export all utilities" > packages/utils/src/index.ts
  touch packages/utils/src/helpers.ts
  ```

- [ ] **ui-components/src/index.ts**
  ```bash
  mkdir -p packages/ui-components/src
  echo "// Export all components" > packages/ui-components/src/index.ts
  touch packages/ui-components/src/Button.tsx
  ```

---

## 🔗 Fase 7: npm Install (5-10 min, depende da internet)

- [ ] **Instalar dependências**
  ```bash
  npm install --workspaces
  ```

- [ ] **Esperar conclusão** (pode demorar)
  ```
  ⏳ Aguardar completar sem erros
  ```

- [ ] **Verificar instalação**
  ```bash
  npm ls | head -50  # Ver primeira parte
  ```

- [ ] **Confirmação final**
  ```bash
  npm ls @sentineliq/shared-types
  # Deve mostrar: @sentineliq/shared-types@1.0.0
  ```

---

## 🧪 Fase 8: Verificar Setup (10 min)

- [ ] **Listar packages com Lerna**
  ```bash
  npx lerna list --all --long
  ```
  
  Esperado:
  ```
  @sentineliq/shared-types        1.0.0   packages/shared-types
  @sentineliq/validators          1.0.0   packages/validators
  @sentineliq/utils               1.0.0   packages/utils
  @sentineliq/ui-components       1.0.0   packages/ui-components
  ```

- [ ] **Ver grafo de dependências**
  ```bash
  npx lerna list --graph
  ```

- [ ] **Verificar links simbólicos**
  ```bash
  ls -la node_modules/@sentineliq/
  # Deve mostrar symlinks → ../../packages/
  ```

- [ ] **Confirmação npm workspaces**
  ```bash
  npm ls -depth=0
  # Deve listar todos os packages
  ```

---

## 🟣 Fase 9: Testar com SentinelIQ (Wasp) (5-10 min)

- [ ] **Iniciar SentinelIQ**
  ```bash
  npm run dev
  # Ou
  cd app && wasp start
  ```

- [ ] **Aguardar build do Wasp**
  ```
  ⏳ Esperar mensagem "Wasp compiled successfully"
  ```

- [ ] **Acessar dashboard**
  ```bash
  # Abrir http://localhost:3000
  # Deve funcionar normalmente
  ```

- [ ] **Verificar console do Wasp**
  ```
  ✅ Nenhum erro sobre @sentineliq/*
  ```

- [ ] **Parar Wasp**
  ```bash
  Ctrl+C
  ```

---

## 🧩 Fase 10: Testar Importações (5 min)

- [ ] **Criar tipo em shared-types**
  ```bash
  cat > packages/shared-types/src/types.ts << 'EOF'
  export interface TestType {
    id: string;
    name: string;
  }
  EOF
  ```

- [ ] **Atualizar index**
  ```bash
  cat > packages/shared-types/src/index.ts << 'EOF'
  export type * from './types.js';
  EOF
  ```

- [ ] **Importar no SentinelIQ** (teste rápido)
  ```bash
  # Em app/src/client/App.tsx, adicionar:
  import type { TestType } from '@sentineliq/shared-types';
  ```

- [ ] **Reiniciar Wasp**
  ```bash
  npm run dev
  ```

- [ ] **Verificar compilação**
  ```
  ✅ Deve compilar sem "Cannot find module" errors
  ```

- [ ] **Remover import de teste**
  ```bash
  # Desfazer a mudança no App.tsx
  git checkout app/src/client/App.tsx
  ```

---

## 📚 Fase 11: Documentação (5 min)

- [ ] **Criar README em packages/shared-types**
  ```bash
  cat > packages/shared-types/README.md << 'EOF'
  # @sentineliq/shared-types

  Tipos TypeScript compartilhados para SentinelIQ.

  ## Instalação

  Já incluído no monorepo via npm workspaces.

  ## Uso

  \`\`\`typescript
  import type { User, Workspace } from '@sentineliq/shared-types';
  \`\`\`
  EOF
  ```

- [ ] **Repetir para outros packages**
  ```bash
  cp packages/shared-types/README.md packages/validators/README.md
  cp packages/shared-types/README.md packages/utils/README.md
  cp packages/shared-types/README.md packages/ui-components/README.md
  ```

- [ ] **Atualizar conteúdo de cada README**
  ```bash
  # Editar manualmente com descrição apropriada
  ```

---

## 🔐 Fase 12: Git Commit (5 min)

- [ ] **Verificar mudanças**
  ```bash
  git status
  ```

- [ ] **Revisar arquivos**
  ```bash
  git diff --stat
  ```

- [ ] **Adicionar ao staging**
  ```bash
  git add .
  ```

- [ ] **Commit**
  ```bash
  git commit -m "feat: setup Lerna monorepo for shared packages"
  ```

- [ ] **Verificar commit**
  ```bash
  git log --oneline -1
  ```

---

## ✨ Fase 13: Scripts Úteis no package.json (5 min)

- [ ] **Adicionar scripts de desenvolvimento**

Adicione ao `package.json` root:

```json
{
  "scripts": {
    "dev": "npm run dev -w app",
    "build:all": "npm run build --workspaces",
    "build:packages": "lerna run build --scope '@sentineliq/*'",
    "lerna:changed": "lerna changed",
    "lerna:version": "lerna version",
    "lerna:publish": "lerna publish",
    "type-check": "npm run type-check --workspaces"
  }
}
```

- [ ] **Testar novo script**
  ```bash
  npm run lerna:changed
  # Deve mostrar packages alterados (ou "No changed packages")
  ```

---

## 🎯 Fase 14: Validação Final (10 min)

### ✅ Checklist Final

- [ ] Lerna instalado: `npx lerna --version`
- [ ] Estrutura criada: `ls -la packages/`
- [ ] package.json em cada package
- [ ] tsconfig.json em cada package
- [ ] index.ts em cada package
- [ ] npm install --workspaces funcionou
- [ ] npm ls mostra todos os packages
- [ ] Symlinks criados: `ls -la node_modules/@sentineliq/`
- [ ] Wasp compila: `npm run dev`
- [ ] Imports funcionam
- [ ] Lerna reconhece packages: `npx lerna list`
- [ ] Git history limpo

### 🚀 Teste Final

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run lerna:changed

# Esperado: "No changed packages"
```

---

## 🎓 Próximos Passos Após Setup

1. **Extrair código compartilhado**
   - Mover types de `app/src/shared/types.ts` para `packages/shared-types/`
   - Mover validators para `packages/validators/`
   - Mover utils para `packages/utils/`

2. **Adicionar mais componentes**
   - Criar componentes reutilizáveis em `packages/ui-components/`
   - Importar em Wasp e blog

3. **Configurar CI/CD**
   - Criar `.github/workflows/test.yml`
   - Criar `.github/workflows/publish.yml`

4. **Publicar primeiro package** (opcional)
   - `npm run lerna:version`
   - `npm run lerna:publish`

---

## 🆘 Se Algo Quebrar

### Erro durante `npm install --workspaces`

```bash
# Solução
rm -rf node_modules
npm cache clean --force
npm install --workspaces
```

### SentinelIQ não compila

```bash
# Solução
cd app
wasp clean
npm run dev
```

### Cannot find module '@sentineliq/*'

```bash
# Solução
npm install --workspaces --force
npm ls @sentineliq/shared-types
```

---

## ✅ Conclusão

Se você completou todos os 14 passos:

✅ **Lerna configurado** com segurança (Wasp protegido)  
✅ **Packages estruturados** e prontos para uso  
✅ **npm workspaces funcionando** sem erros  
✅ **Wasp compilando** normalmente  
✅ **Imports funcionando** entre packages  
✅ **Git versionado** com histórico limpo  

🎉 **Você está pronto para escalar!**

---

## 📞 Resumo Rápido

| Fase | Tempo | O que fazer |
|------|-------|-----------|
| 1. Preparação | 15 min | Backup e ler docs |
| 2. Instalação | 5 min | `npm install -D lerna` |
| 3. Pastas | 10 min | Criar estrutura |
| 4-6. Configuração | 35 min | package.json + tsconfig |
| 7. npm install | 10 min | `npm install --workspaces` |
| 8-10. Teste | 20 min | Validar Wasp |
| 11-14. Final | 20 min | Docs + Git |
| **Total** | **~2h** | **Setup completo** |

---

## 🚀 Status: Pronto para Usar

Uma vez completado, você tem:

- ✅ Monorepo com Lerna (packages/)
- ✅ Wasp funcionando normalmente (app/)
- ✅ npm workspaces linkando tudo
- ✅ TypeScript compartilhado
- ✅ Componentes reutilizáveis
- ✅ Pronto para publicar no npm
