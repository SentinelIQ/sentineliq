# SentinelIQ Dev Container

Este é um environment de desenvolvimento containerizado para o SentinelIQ que resolve todos os problemas de configuração do WSL.

## ✅ O que está incluído

- **Wasp 0.18** - Framework full-stack configurado
- **Node.js 20** - Runtime JavaScript
- **Docker-in-Docker** - Suporte completo a Docker e Docker Compose
- **Todas as dependências** - PostgreSQL, Redis, Elasticsearch, Kibana, MinIO, Logstash, etc.
- **VS Code Extensions** - Wasp, Prettier, ESLint, Docker, Prisma, GitHub Copilot

## 🚀 Como usar

### 1. Requisitos
- Docker Desktop ou Docker Engine
- VS Code com Remote Containers extension
- Pelo menos 8GB de RAM disponível

### 2. Abrir no Dev Container

**Opção A: Usando VS Code Command Palette**
```
Ctrl+Shift+P (ou Cmd+Shift+P no Mac)
Remote-Containers: Reopen in Container
```

**Opção B: Usando VS Code Quick Open**
```
Ctrl+K Ctrl+O (ou Cmd+K Cmd+O no Mac)
Selecione a pasta do projeto
Clique em "Reopen in Container"
```

### 3. Setup automático
O container executará automaticamente:
- ✅ Instalação do Wasp
- ✅ npm install
- ✅ docker compose up (todos os serviços)
- ✅ Database migrations

### 4. Iniciar desenvolvimento
```bash
wasp start
```

O servidor estará em `http://localhost:3000` (frontend) e `http://localhost:3001` (backend)

## 📊 Serviços disponíveis

| Serviço | URL | Descrição |
|---------|-----|-----------|
| React Frontend | http://localhost:3000 | Vite dev server |
| Node.js Server | http://localhost:3001 | Backend API |
| PostgreSQL | localhost:5432 | Banco de dados |
| Redis | localhost:6379 | Cache/Queue |
| MinIO Console | http://localhost:9001 | File storage (S3) |
| Kibana | http://localhost:5601 | Logs & Analytics |
| PgAdmin | http://localhost:5050 | Database GUI |
| RedisInsight | http://localhost:8001 | Redis GUI |

## 🔧 Comandos úteis

```bash
# Build do projeto
wasp build

# Migrations do banco
wasp db migrate-dev

# Studio (GUI do Prisma)
wasp db studio

# Seed do banco
wasp db seed

# Gerenciar containers
docker compose ps      # Ver status
docker compose logs -f # Ver logs
docker compose down    # Parar tudo
docker compose up -d   # Iniciar tudo
```

## 📝 Notas importantes

- **WSL não é mais necessário!** O dev container funciona com Docker Desktop nativo
- **Arquivos persistem** automaticamente no volume `postgres-data`
- **Portas são forwardeadas** automaticamente - sem configuração manual
- **Variáveis de ambiente** são carregadas do `.env.server` automaticamente

## 🆘 Troubleshooting

### Container não inicia
```bash
# Limpar e reconstruir
docker system prune -a
# Reabrir o container
Ctrl+Shift+P -> Remote-Containers: Rebuild Container
```

### PostgreSQL não conecta
```bash
# Verificar se o container está rodando
docker compose ps

# Ver logs
docker compose logs postgres

# Reiniciar
docker compose restart postgres
```

### Porta já em uso
```bash
# Mudar porta no docker-compose.yml
# Exemplo: "5432:5432" -> "5433:5432"
```

## 📚 Referências

- [Wasp Docs](https://wasp.sh/docs)
- [Dev Containers Guide](https://containers.dev/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
