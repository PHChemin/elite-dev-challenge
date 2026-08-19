# PHCTickets

**Autor:** Pedro Henrique Chemin Prado

Plataforma de sessões de cinema e ingressos (desafio Elite Dev / Verzel).

Este repositório foi estruturado para desenvolvimento **guiado por IA** (Cursor), com documentação de referência ([PRD](docs/PRD.md), [SDD](docs/SDD.md), [Visual](docs/visual.md)), **skills** para agentes em [`.agents/skills/`](.agents/skills/) e metodologia **TDD** na API: testes escritos antes da implementação de cada módulo Must. Todo artefato gerado com IA foi **revisado e aprovado** pelo autor.

- [PRD](docs/PRD.md)
- [SDD](docs/SDD.md)
- [Visual](docs/visual.md)
- [Uso de IA](docs/ai-process.md)
- [Deploy em produção](docs/deploy.md)

## Stack

Monorepo npm workspaces: `apps/api` (NestJS + Prisma + PostgreSQL) e `apps/web` (Vite + React + Mantine).

Dependências ficam em `node_modules` na raiz. Node.js 20.x ou superior.

## Como subir (Docker)

O Compose local usa os defaults do `docker-compose.yml`. No host, a API lê `apps/api/.env` e o front lê `apps/web/.env`.

```bash
docker compose up --build
```

Depois do primeiro `up`, popule o banco:

```bash
docker compose exec api npx prisma db seed
```

API: `http://localhost:3000/api`. Swagger: `http://localhost:3000/api/docs`. Front: `http://localhost:5173`.

Só o banco (API e web no host):

```bash
docker compose up db -d
```

## Deploy (produção)

Instruções completas para droplet, VPS Hostinger e teste local do stack de produção: [docs/deploy.md](docs/deploy.md).

## Como subir no host

Com o Postgres no ar (`docker compose up db -d` ou outra instância local):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:api
npm run dev:web
```

## Usuários do seed

**Não há registro de usuários no Must.** Use **somente** as contas abaixo para login e testes manuais.

| Papel        | E-mail                        | Senha          |
| ------------ | ----------------------------- | -------------- |
| Admin        | `admin@phctickets.local`      | `admin123`     |
| Organizador  | `organizer@phctickets.local`  | `organizer123` |
| Consumidor 1 | `customer@phctickets.local`   | `customer123`  |
| Consumidor 2 | `customer2@phctickets.local`  | `customer123`  |
| Portaria     | `gate@phctickets.local`       | `gate123`      |

A portaria fica ligada ao organizador do seed (`organizerId`).

### Sessão demo (após `prisma db seed`)

| Campo            | Valor                                      |
| ---------------- | ------------------------------------------ |
| Filme            | Clube da Luta                              |
| Sessão           | 15/12/2026 19:00 — Cine PHC                |
| Ingresso demo    | assento A1 do `customer@phctickets.local`  |
| Código (QR) demo | `cccccccccccccccccccccccccccccccc`         |

Prisma Studio (Postgres no ar, `apps/api/.env` com `DATABASE_URL`):

```bash
npm run prisma:studio
```

Abre `http://localhost:5555`. Não entra no Compose de produção.

## Uso de IA

Ferramentas, decisões humanas e artefatos gerados estão em [docs/ai-process.md](docs/ai-process.md).

## Variáveis de ambiente

| Variável         | Onde | Uso                                      |
| ---------------- | ---- | ---------------------------------------- |
| `DATABASE_URL`   | api  | Conexão Postgres                         |
| `JWT_SECRET`     | api  | Assinatura JWT                           |
| `JWT_EXPIRES_IN` | api  | Expiração do token (ex.: `8h`)           |
| `CORS_ORIGIN`    | api  | Origem permitida do front                |
| `TMDB_API_KEY`   | api  | Catálogo TMDb (organizador)              |
| `VITE_API_URL`   | web  | Base da API no browser                   |
| `PORT`           | api  | Porta HTTP da API (default `3000`)       |

Templates: [apps/api/.env.example](apps/api/.env.example), [apps/web/.env.example](apps/web/.env.example), produção: [.env.prod.example](.env.prod.example).

## Testes

```bash
npm test
```

A suíte roda na API (`apps/api`): **unit** (`jest` em `src/**/*.spec.ts`) e **e2e** (`test/**/*.e2e-spec.ts`) em sequência. Comandos adicionais:

```bash
npm run test:e2e -w @phctickets/api
npm run test:cov -w @phctickets/api
```

Os e2e usam mock de Prisma ([`apps/api/test/helpers/e2e-app.ts`](apps/api/test/helpers/e2e-app.ts)) — **não é necessário Postgres** para `npm test`.

Cobertura Must (success + fail por operação): auth, catálogo/cartaz/sessões, retenção e unicidade, pagamento, ingressos/share, **portaria**.

## O que foi implementado

### Infraestrutura

Monorepo npm workspaces, Prisma/PostgreSQL, tema Mantine (Roboto, paleta PHCTickets), Docker Compose local e de produção (Caddy + Nginx).

### Auth

JWT com `role` (`admin`, `organizer`, `customer`, `gate`), guards no Nest e telas protegidas no React. Login via contas do seed — registro de consumidor fica fora do Must.

### Catálogo e cartaz

Organizador busca filme na TMDb e cria cartaz. A vitrine pública lê o banco (não chama TMDb a cada listagem). Cartaz nasce `draft`; publicação controla visibilidade.

### Sessões

CRUD de sessão com layout fixo 8×12 (96 assentos). Meia omitida no request grava `floor(inteira/2)`. No mesmo cartaz, horário + local são únicos.

### Compra

Consumidor informa inteira e meia **antes** do mapa. Hold de 10 minutos; teto por **compra** na sessão (default 6), distinto da capacidade da sala.

### Pagamento simulado

`approved` gera um ingresso por assento com `code` (QR) e `shareToken` (link). `declined` libera os lugares.

### Ingressos

Meus ingressos, detalhe com QR, share público com rate limit. Holds pendentes aparecem na mesma lista.

### Portaria

Lista sessões ativas do organizador (paginada; exclui encerradas; badges “Em andamento” / “Inicia em breve”). Validação por QR ou código digitado com quatro respostas: `valid`, `invalid`, `already_used`, `wrong_event`. A portaria valida o QR, não a categoria meia/inteira.

### Qualidade

Jest unit + e2e na API, TDD por issue Must. Swagger em `/api/docs`.
