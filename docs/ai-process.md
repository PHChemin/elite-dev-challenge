# Uso de IA

O enunciado pede para contar ferramentas, o que a IA fez e o que foi decisão humana. Atualizar esta página ao longo da semana.

## Ferramentas

- Cursor (agente) — docs, skills (EN), depois código.
- Skills de domínio: nestjs-expert, prisma-expert (community) + skills do PHCTickets.
- Stitch — ideias de tela (referência, não layout final).
- Pendente: outras (preencher).

## O que foi decidido sem a IA gerar o produto

- Vite + Mantine e NestJS/Express, dois processos.
- Prisma e Postgres.
- JWT com `role` no token; guards no Nest. Quatro papéis no banco; telas de Admin são Should.
- Must: TMDb, mapa, quantidade inteira/meia antes dos assentos. Ticketmaster, pista e estabelecimento só se sobrar tempo.
- Fonte Roboto. Paleta com Sucesso `#2D6A4F` para válido e pagamento aprovado.
- Teto de ingressos por sessão, padrão 6, o organizador muda. Meia começa na metade da inteira.
- Retenção de 10 minutos no checkout.
- Link do ingresso: GET público por `shareToken`; QR na página; Meus ingressos autenticado.
- API em TDD: casos na issue, testes primeiro, código depois.
- Portaria: um login por pessoa; a pessoa escolhe a sessão e depois lê o QR.
- Registro e o organizador cadastrar portaria: depois do fluxo mínimo.

## O que a IA fez nesta fase

- Rascunho de PRD, SDD, visual, skills em `.agents/skills/`, texto das issues.
- Comparar formas (Next vs Vite+API) e opções de portaria, para o autor escolher.
- Scaffold do monorepo (`apps/api` + `apps/web`) e schema Prisma. Auth, TMDb e telas entram nas issues da PR.
- Docker Compose local, Compose de produção (droplet) e hoist das dependências na raiz do monorepo.
- Prisma no Nest (`PrismaService`), Prisma Studio em `http://localhost:5555` e Swagger em `/api/docs`.

## O que a IA não deve fazer

Inventar pista, Ticketmaster, e-mail de ingresso ou recuperação de senha no Must. Inventar microserviço Nest. Copiar tela genérica de CRUD e chamar de identidade.
