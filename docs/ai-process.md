# Uso de IA

O enunciado pede ferramentas, o que a IA gerou e o que foi decisão humana.

## Ferramentas

- Cursor (agente)
- Skills: nestjs-expert, prisma-expert (community) e skills do PHCTickets em `.agents/skills/`
- Stitch — ideias de tela em `docs/design/`

## Decisão humana

- Vite + Mantine e NestJS/Express, dois processos.
- Prisma e Postgres.
- JWT com `role` no token. Guards no Nest. Quatro papéis no banco. Telas de Admin são Should.
- Must: TMDb, mapa, quantidade inteira/meia antes dos assentos.
- Ticketmaster, pista e estabelecimento ficam fora do Must.
- Fonte Roboto. Paleta com Sucesso `#2D6A4F` para válido e pagamento aprovado.
- Teto por compra na sessão, padrão 6. O organizador altera. Não é cota da conta. Meia começa na metade da inteira.
- Retenção de 10 minutos no checkout.
- Link do ingresso: GET público por `shareToken`. QR na página (`code`). Meus ingressos autenticado. Hold pendente na mesma lista.
- API em TDD: casos na issue, testes, implementação.
- Portaria: um login por pessoa. A pessoa escolhe a sessão e lê o QR.
- Registro do consumidor e cadastro de portaria pelo organizador são Should.

## O que a IA gerou

### Documentação

- [PRD](PRD.md), [SDD](SDD.md), [visual](visual.md), issues em [github-issues.md](github-issues.md)
- Skills do projeto em [`.agents/skills/`](../.agents/skills/)
- Mockups de referência em `docs/design/`
- README, este arquivo e [deploy.md](deploy.md)

### Backend (NestJS + Prisma)

- Monorepo `apps/api` + `apps/web`, schema Prisma, migrations
- Seed: cinco usuários (admin, organizador, dois consumidores, portaria), sessão demo publicada com 96 assentos e ingresso pago para teste da portaria
- **Auth:** `POST /api/auth/login`, `GET /api/users/me`, guards por papel, JWT com `role`
- **Catálogo:** integração TMDb, busca de filme para o organizador
- **Exhibitions / Events:** CRUD de cartaz e sessão, layout 8×12, publicação, unicidade horário+local
- **Reservations:** hold de 10 minutos, expiração, unicidade de assento, listagem de holds pendentes
- **Orders:** pagamento simulado (approve/decline), geração de tickets
- **Tickets:** meus ingressos, detalhe, share público por `shareToken`, rate limit no share
- **Gate:** `GET /gate/events` (sessões do organizador, paginada, badges de venda), `POST /gate/scan` (valid, invalid, already_used, wrong_event)
- Swagger em `/api/docs`, i18n API (`pt.json`), `PrismaService`

### Frontend (Vite + React + Mantine)

- Tema PHCTickets (Roboto, paleta do visual)
- Login e rotas protegidas por papel
- Vitrine pública, fluxo do organizador (cartaz, sessões, TMDb)
- Mapa de assentos, checkout com inteira/meia antes do mapa
- Meus ingressos, detalhe com QR, share público
- **Portaria:** lista de sessões (`/portaria`), validação por câmera QR ou código manual (`/portaria/sessoes/:eventId`)

### Infra e qualidade

- Docker Compose local (`docker compose up`)
- Docker Compose de produção (`docker-compose.prod.yml`): Postgres, API, Nginx, Caddy
- [`deploy/Caddyfile`](../deploy/Caddyfile) — proxy `/api` + SPA
- Testes Jest unit (`src/**/*.spec.ts`) e e2e (`test/**/*.e2e-spec.ts`) com mock de Prisma por módulo Must (auth, catalog, exhibitions, reservations, orders, tickets, gate)
- Prisma Studio documentado no README (`npm run prisma:studio`)
