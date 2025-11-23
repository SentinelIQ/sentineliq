# SentinelIQ - Repositório Público de Feedback

## 🎯 Objetivo

Criar um repositório público separado para gerenciar issues, feedback e suporte dos clientes, mantendo o código-fonte privado.

## 📁 Estrutura do Repositório Público

### Repositório: `sentineliq-feedback` ou `sentineliq-issues`

```
sentineliq-feedback/
├── README.md                    # Apresentação e instruções
├── SECURITY.md                  # Política de segurança
├── CODE_OF_CONDUCT.md          # Código de conduta
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml      # Template de bug
│   │   ├── feature_request.yml # Template de feature
│   │   ├── question.yml        # Template de dúvida
│   │   └── security.yml        # Template de segurança
│   ├── DISCUSSION_TEMPLATE/
│   │   └── general.yml         # Template de discussão
│   └── workflows/
│       ├── auto-label.yml      # Auto-labeling de issues
│       ├── stale.yml           # Fechar issues inativas
│       └── welcome.yml         # Mensagem de boas-vindas
└── docs/
    ├── ROADMAP.md              # Roadmap público
    ├── CHANGELOG.md            # Changelog público
    └── FAQ.md                  # Perguntas frequentes
```

## 📝 Conteúdo dos Arquivos

### README.md

```markdown
# 🛡️ SentinelIQ - Feedback & Issues

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-Private-blue.svg)]()

Bem-vindo ao repositório oficial de feedback e suporte do **SentinelIQ**.

## 🎯 O que é o SentinelIQ?

SentinelIQ é uma plataforma B2B SaaS de segurança cibernética que oferece:

- 🔐 **Aegis**: Threat Intelligence e gerenciamento de IoCs
- 🌐 **Eclipse**: Dark Web Monitoring e Brand Protection
- ⚔️ **MITRE ATT&CK**: Framework de táticas e técnicas adversárias
- 📊 **Analytics**: Dashboards e relatórios de segurança
- 🔔 **Notificações**: Alertas em tempo real
- 👥 **Multi-tenancy**: Workspaces isolados por organização

## 📢 Como Usar Este Repositório

### 🐛 Reportar um Bug

Encontrou um problema? [Abra uma issue de bug](../../issues/new?template=bug_report.yml)

### 💡 Sugerir uma Feature

Tem uma ideia? [Sugira uma nova funcionalidade](../../issues/new?template=feature_request.yml)

### ❓ Fazer uma Pergunta

Dúvidas? [Faça uma pergunta](../../issues/new?template=question.yml)

### 🔒 Reportar Vulnerabilidade de Segurança

**NÃO abra uma issue pública!** Leia nosso [Security Policy](SECURITY.md)

## 🗺️ Roadmap

Confira nosso [roadmap público](docs/ROADMAP.md) para ver o que está por vir.

## 📚 Documentação

- [Documentação Oficial](https://docs.sentineliq.com) *(quando disponível)*
- [FAQ](docs/FAQ.md)
- [Changelog](docs/CHANGELOG.md)

## 🤝 Código de Conduta

Este projeto adere ao [Código de Conduta](CODE_OF_CONDUCT.md). Ao participar, você concorda em seguir suas diretrizes.

## 📞 Suporte

- 📧 Email: support@sentineliq.com
- 💬 Issues: [GitHub Issues](../../issues)
- 🌐 Website: https://sentineliq.com

## ⚖️ Licença

O código-fonte do SentinelIQ é proprietário e privado. Este repositório é apenas para feedback público.

---

**Feito com ❤️ pela equipe SentinelIQ**
```

### SECURITY.md

```markdown
# 🔒 Política de Segurança

## 🚨 Reportando Vulnerabilidades

A segurança dos nossos usuários é nossa prioridade máxima.

### ⚠️ NÃO ABRA ISSUES PÚBLICAS PARA VULNERABILIDADES

Se você descobriu uma vulnerabilidade de segurança, **NÃO** abra uma issue pública.

### ✅ Como Reportar

1. **Email Seguro**: Envie detalhes para `security@sentineliq.com`
2. **PGP**: Use nossa chave PGP pública *(adicionar se disponível)*
3. **Bug Bounty**: *(opcional - se tiver programa)*

### 📋 O que Incluir

- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestões de correção (se houver)
- Seu nome/handle para crédito (opcional)

### ⏱️ Tempo de Resposta

- **Confirmação inicial**: 24-48 horas
- **Análise completa**: 5-7 dias úteis
- **Correção**: Depende da severidade

### 🏆 Programa de Recompensas

*(Descrever se houver bug bounty program)*

## 🛡️ Versões Suportadas

| Versão | Suportada          |
| ------ | ------------------ |
| 1.x    | ✅ Sim             |
| < 1.0  | ❌ Não             |

## 📜 Divulgação Responsável

Seguimos o princípio de **divulgação coordenada**:

1. Você reporta a vulnerabilidade
2. Confirmamos o recebimento
3. Trabalhamos em uma correção
4. Lançamos o patch
5. Divulgamos publicamente (com seu crédito, se desejar)

### 🙏 Agradecimentos

Agradecemos aos seguintes pesquisadores de segurança:

*(Lista de pesquisadores que reportaram vulnerabilidades)*

---

**Obrigado por ajudar a manter o SentinelIQ seguro!**
```

### CODE_OF_CONDUCT.md

```markdown
# Código de Conduta

## Nosso Compromisso

Nos comprometemos a tornar a participação em nossa comunidade uma experiência livre de assédio para todos.

## Nossos Padrões

### ✅ Comportamentos Esperados

- Usar linguagem acolhedora e inclusiva
- Respeitar pontos de vista diferentes
- Aceitar críticas construtivas
- Focar no que é melhor para a comunidade

### ❌ Comportamentos Inaceitáveis

- Assédio público ou privado
- Linguagem sexualizada ou imagens inadequadas
- Ataques pessoais ou políticos
- Publicar informações privadas de terceiros

## Aplicação

Instâncias de comportamento inaceitável podem ser reportadas para `conduct@sentineliq.com`.

## Atribuição

Este Código de Conduta é adaptado do [Contributor Covenant](https://www.contributor-covenant.org/).
```

### .github/ISSUE_TEMPLATE/bug_report.yml

```yaml
name: 🐛 Bug Report
description: Reporte um bug ou comportamento inesperado
title: "[BUG] "
labels: ["bug", "needs-triage"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        ## 🐛 Obrigado por reportar um bug!
        
        Preencha as informações abaixo para nos ajudar a resolver o problema.

  - type: dropdown
    id: module
    attributes:
      label: 🎯 Módulo Afetado
      description: Qual módulo do SentinelIQ está apresentando o problema?
      options:
        - Aegis (Threat Intelligence)
        - Eclipse (Dark Web Monitoring)
        - MITRE ATT&CK
        - Analytics
        - Notifications
        - Workspace Management
        - Authentication
        - Payment/Billing
        - Admin Dashboard
        - Outro
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: 🔥 Severidade
      description: Qual o impacto deste bug?
      options:
        - 🔴 Crítico - Sistema indisponível
        - 🟠 Alto - Funcionalidade principal quebrada
        - 🟡 Médio - Funcionalidade secundária afetada
        - 🟢 Baixo - Problema estético ou menor
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: 📝 Descrição do Bug
      description: Descreva claramente o que está acontecendo
      placeholder: "Quando eu clico em..., o sistema..."
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: 🔄 Passos para Reproduzir
      description: Como podemos reproduzir este comportamento?
      placeholder: |
        1. Vá para '...'
        2. Clique em '...'
        3. Role até '...'
        4. Veja o erro
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: ✅ Comportamento Esperado
      description: O que deveria acontecer?
      placeholder: "Eu esperava que..."
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: ❌ Comportamento Atual
      description: O que realmente aconteceu?
      placeholder: "Mas o que aconteceu foi..."
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: 📸 Screenshots
      description: Se aplicável, adicione screenshots
      placeholder: "Cole ou arraste imagens aqui"

  - type: textarea
    id: environment
    attributes:
      label: 🖥️ Ambiente
      description: Informações sobre seu ambiente
      value: |
        - **Browser**: [ex: Chrome 120, Firefox 119]
        - **OS**: [ex: Windows 11, macOS 14, Ubuntu 22.04]
        - **Versão SentinelIQ**: [ex: 1.0.0]
        - **Plan**: [Free, Hobby, Pro]
      render: markdown
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: 📋 Logs/Erros
      description: Cole quaisquer mensagens de erro ou logs relevantes
      placeholder: "Cole logs aqui (remova informações sensíveis!)"
      render: shell

  - type: textarea
    id: additional
    attributes:
      label: ℹ️ Informações Adicionais
      description: Qualquer outra informação relevante
      placeholder: "Contexto adicional..."

  - type: checkboxes
    id: terms
    attributes:
      label: ✔️ Checklist
      description: Confirme antes de enviar
      options:
        - label: Eu verifiquei que não há issues duplicadas
          required: true
        - label: Eu removi informações sensíveis (senhas, tokens, etc)
          required: true
        - label: Eu li o código de conduta
          required: true
```

### .github/ISSUE_TEMPLATE/feature_request.yml

```yaml
name: 💡 Feature Request
description: Sugira uma nova funcionalidade
title: "[FEATURE] "
labels: ["enhancement", "needs-triage"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        ## 💡 Obrigado por sugerir uma melhoria!
        
        Suas ideias são importantes para nós.

  - type: dropdown
    id: module
    attributes:
      label: 🎯 Módulo
      description: Para qual módulo é esta feature?
      options:
        - Aegis (Threat Intelligence)
        - Eclipse (Dark Web Monitoring)
        - MITRE ATT&CK
        - Analytics
        - Notifications
        - Workspace Management
        - Authentication
        - Payment/Billing
        - Admin Dashboard
        - Novo Módulo
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: 📊 Prioridade (na sua opinião)
      options:
        - 🔴 Alta - Necessário para usar o produto
        - 🟡 Média - Importante mas não bloqueante
        - 🟢 Baixa - Nice to have
    validations:
      required: true

  - type: textarea
    id: problem
    attributes:
      label: 🤔 Problema/Necessidade
      description: Qual problema esta feature resolveria?
      placeholder: "Atualmente é difícil/impossível fazer X porque..."
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: 💡 Solução Proposta
      description: Como você imagina que isso funcionaria?
      placeholder: "Eu gostaria de poder..."
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: 🔄 Alternativas Consideradas
      description: Você pensou em outras formas de resolver isso?
      placeholder: "Eu também considerei..."

  - type: textarea
    id: mockups
    attributes:
      label: 🎨 Mockups/Exemplos
      description: Imagens, wireframes ou exemplos de outras ferramentas
      placeholder: "Cole ou arraste imagens aqui"

  - type: textarea
    id: use-case
    attributes:
      label: 📋 Caso de Uso
      description: Descreva um cenário real onde você usaria isso
      placeholder: "Como analista de segurança, eu preciso..."

  - type: dropdown
    id: willing-to-pay
    attributes:
      label: 💰 Impacto no Negócio
      description: Isso influenciaria sua decisão de usar/pagar pelo SentinelIQ?
      options:
        - Sim, essencial para adoção
        - Sim, aumentaria o valor percebido
        - Seria legal ter
        - Não tenho certeza
    validations:
      required: true

  - type: textarea
    id: additional
    attributes:
      label: ℹ️ Informações Adicionais
      placeholder: "Contexto adicional..."

  - type: checkboxes
    id: terms
    attributes:
      label: ✔️ Checklist
      options:
        - label: Eu verifiquei que não há features similares já solicitadas
          required: true
        - label: Esta feature está alinhada com o propósito do SentinelIQ
          required: true
```

### .github/ISSUE_TEMPLATE/question.yml

```yaml
name: ❓ Question
description: Faça uma pergunta sobre o SentinelIQ
title: "[QUESTION] "
labels: ["question"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        ## ❓ Pergunte-nos qualquer coisa!

  - type: dropdown
    id: category
    attributes:
      label: 📚 Categoria
      options:
        - Como usar (How-to)
        - Dúvida técnica
        - Planos e preços
        - Segurança
        - Integrações
        - Outro
    validations:
      required: true

  - type: textarea
    id: question
    attributes:
      label: ❓ Sua Pergunta
      description: Seja o mais específico possível
      placeholder: "Como eu posso..."
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: 🎯 Contexto
      description: O que você está tentando fazer?
      placeholder: "Eu estou tentando..."

  - type: textarea
    id: tried
    attributes:
      label: 🔍 O que você já tentou?
      placeholder: "Eu já tentei..."

  - type: checkboxes
    id: checklist
    attributes:
      label: ✔️ Checklist
      options:
        - label: Eu procurei na documentação
          required: false
        - label: Eu procurei em issues existentes
          required: true
```

### .github/workflows/auto-label.yml

```yaml
name: Auto Label Issues

on:
  issues:
    types: [opened, edited]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - name: Label by module
        uses: actions/labeler@v4
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          
      - name: Label by keywords
        uses: actions/github-script@v6
        with:
          script: |
            const issue = context.payload.issue;
            const body = issue.body.toLowerCase();
            const title = issue.title.toLowerCase();
            const text = `${title} ${body}`;
            
            const labels = [];
            
            // Module labels
            if (text.includes('aegis')) labels.push('module:aegis');
            if (text.includes('eclipse')) labels.push('module:eclipse');
            if (text.includes('mitre')) labels.push('module:mitre');
            if (text.includes('analytics')) labels.push('module:analytics');
            
            // Priority labels
            if (text.includes('urgent') || text.includes('critical')) {
              labels.push('priority:high');
            }
            
            // Type labels
            if (text.includes('security') || text.includes('vulnerability')) {
              labels.push('security');
            }
            
            if (labels.length > 0) {
              github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels: labels
              });
            }
```

### .github/workflows/welcome.yml

```yaml
name: Welcome

on:
  issues:
    types: [opened]
  pull_requests:
    types: [opened]

jobs:
  welcome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/first-interaction@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          issue-message: |
            👋 **Obrigado por abrir sua primeira issue no SentinelIQ!**
            
            Nossa equipe irá revisar em breve. Enquanto isso:
            
            - 📚 Confira nossa [documentação](docs/)
            - 🗺️ Veja nosso [roadmap](docs/ROADMAP.md)
            - 💬 Participe das [discussões](../../discussions)
            
            **Nota**: Este é um repositório público apenas para feedback. Não compartilhe informações sensíveis.
```

## 🚀 Passos de Implementação

### 1. Criar o Repositório

```bash
# Via GitHub CLI
gh repo create sentineliq/sentineliq-feedback --public --description "Public feedback and issues for SentinelIQ"

# Ou via web: https://github.com/new
```

### 2. Clonar e Popular

```bash
git clone https://github.com/sentineliq/sentineliq-feedback.git
cd sentineliq-feedback

# Copiar estrutura de arquivos acima
# Commit e push
git add .
git commit -m "Initial setup: public feedback repository"
git push origin main
```

### 3. Configurar o Repositório

**Settings → General**:
- ✅ Issues habilitado
- ✅ Discussions habilitado (opcional)
- ❌ Wiki desabilitado
- ❌ Projects desabilitado (ou habilitado se quiser project board público)

**Settings → Security**:
- ✅ Private vulnerability reporting (habilitado)

**Labels sugeridos**:
```
# Modules
module:aegis
module:eclipse
module:mitre
module:analytics
module:auth
module:billing

# Priority
priority:critical
priority:high
priority:medium
priority:low

# Status
status:needs-triage
status:investigating
status:planned
status:in-progress
status:completed
status:wont-fix

# Type
bug
enhancement
question
documentation
security
```

### 4. Link no Produto

Adicionar link "Report Issue" ou "Feedback" na UI do SentinelIQ que abre:
`https://github.com/sentineliq/sentineliq-feedback/issues/new/choose`

## 📊 Vantagens

✅ **Transparência**: Clientes veem o que está sendo trabalhado  
✅ **Comunidade**: Usuários podem votar (+1) em features  
✅ **SEO**: Repositório público aumenta visibilidade  
✅ **Segurança**: Código privado, feedback público  
✅ **Profissionalismo**: Mesma abordagem de empresas grandes (Cursor, Vercel, etc)  

## ⚠️ Cuidados

❌ **Nunca compartilhar**:
- Código-fonte
- Credenciais ou tokens
- Dados de clientes
- Vulnerabilidades de segurança não corrigidas
- Roadmap confidencial

✅ **Sempre**:
- Responder rapidamente
- Ser profissional e educado
- Agradecer contribuições
- Fechar issues resolvidas
- Manter discussões construtivas

## 🔗 Links de Referência

- **Cursor**: https://github.com/cursor/cursor
- **Vercel**: https://github.com/vercel/vercel (issues públicas)
- **Linear**: https://github.com/linearapp/linear (feedback público)
- **Supabase**: https://github.com/supabase/supabase (código + issues públicos)

---

**Próximos passos**: Criar o repositório e começar a direcionar feedback dos clientes para lá!
