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
- Teto de ingressos por sessão, padrão 6. O organizador altera. Meia começa na metade da inteira.
- Retenção de 10 minutos no checkout.
- Link do ingresso: GET público por `shareToken`. QR na página. Meus ingressos autenticado.
- API em TDD: casos na issue, testes, implementação.
- Portaria: um login por pessoa. A pessoa escolhe a sessão e lê o QR.
- Registro do consumidor e cadastro de portaria pelo organizador são Should.

## O que a IA gerou

- PRD, SDD, visual, skills em `.agents/skills/`, texto das issues.
- Monorepo `apps/api` + `apps/web` e schema Prisma.
- Auth JWT na API: `POST /api/auth/login`, `GET /api/users/me`, guards de papel, testes Jest, seed dos quatro papéis no README.
- Docker Compose local, Compose de produção na droplet, dependências hoisted na raiz.
- Prisma no Nest (`PrismaService`). Prisma Studio em `http://localhost:5555`. Swagger em `/api/docs`.
