# Software Design Document (SDD) — PHCTickets

**Projeto:** PHCTickets (sessões de cinema e ingressos)  
**Versão:** 1.3.0  
**Status:** Pronto para implementação do Must  
**Stack:** NestJS (Express), React, Vite, Mantine, Prisma, PostgreSQL, TMDb  
**Produto:** [PRD](PRD.md) · **Visual:** [visual.md](visual.md)

---

## 1. Arquitetura do Sistema (Monorepo)

Dois processos no mesmo repositório:

- **`apps/api`:** Backend NestJS (`@nestjs/platform-express`).
- **`apps/web`:** SPA React + Vite + Mantine.

A tela desenha mapa, formulários e câmera. A API decide assento livre, pagamento, QR e papéis.

> **Instrução para a IA:** Regras de negócio ficam na API. A UI pode esconder botões; o servidor recusa o mesmo pedido mesmo assim.

## 2. Contexto para a IA (Skills)

> **Instrução para a IA:** Antes de scaffold, rota ou teste, leia as skills em `.agents/skills/` e este SDD.

| Skill | Use |
| ----- | --- |
| `docs-voice` | Docs and issue wording |
| `prd-moscow` | Must / Should / Could / Won’t scope |
| `sdd-constraints` | Folders, stack, JWT, Prisma (overrides TypeORM tips) |
| `mantine-ui` | Screens and theme (Roboto, palette) |
| `reservation-integrity` | Hold, uniqueness, QR, gate |
| `tdd-api` | Jest tests before implementation |
| `nestjs-expert` | Nest patterns (DI, guards, pipes); ORM = Prisma via `prisma-expert` |
| `prisma-expert` | Schema, migrations, queries |

Skills are English. Product docs (PRD, SDD, visual) stay Portuguese for the evaluator.

Sem MCP obrigatório neste projeto. Migrações via Prisma CLI; diagrama da seção 4 é a fonte da verdade do schema.

## 3. Stack Tecnológica

> Nenhuma dependência fora desta lista entra no Must sem atualizar esta seção.

### Core

- **Runtime:** Node.js 20.x LTS  
- **Banco:** PostgreSQL  
- **ORM:** Prisma  
- **API:** NestJS + Express  
- **Web:** React + TypeScript + Vite + Mantine + React Router  
- **Testes API:** Jest + Supertest (padrão Nest). Sem Vitest/Mocha no backend.  
- **Catálogo:** TMDb (chave só no ambiente da API)

### Bibliotecas permitidas (Must)

- **Auth:** `@nestjs/jwt`, `@nestjs/passport`, Passport JWT, `bcryptjs`  
- **Validação:** `class-validator`, `class-transformer` + ValidationPipe global (`whitelist: true`)  
- **Config:** `@nestjs/config`  
- **Docs API:** `@nestjs/swagger` (`/api/docs`)  
- **QR (web ou api):** `qrcode.react` no front; payload = `code`  
- **Rate limit:** `@nestjs/throttler` no GET público de share  
- **Fonte web:** `@fontsource/roboto` (ou equivalente)  
- **Formulários web:** `@mantine/form`, `@mantine/notifications`
- **Rotas web:** `react-router-dom`. Guard de papel na rota esconde a tela; a autorização continua na API.
- **Textos (i18n):** um arquivo `locales/pt.json` por app, chaves aninhadas. API: `nestjs-i18n`. Web: `i18next` + `react-i18next`. Locale único `pt`.
- **HTTP:** `axios` — TMDb na API; chamadas do web para a API (JWT no interceptor).

### Fora do Must

Ticketmaster, pista, websocket do mapa, entidade estabelecimento, Next.js, Fastify, CQRS, Redis, refresh token, API serverless, E2E de browser.

## 4. Arquitetura de Dados

### 4.1. Glossário técnico

| Termo PRD | Entidade | Atributos principais |
| --------- | -------- | -------------------- |
| Usuário | `User` | `id, email, passwordHash, role, status, organizerId, mustChangePassword` |
| Cartaz | `Exhibition` | `id, organizerId, tmdbId, title, posterUrl, publishStatus` |
| Sessão | `Event` | `id, exhibitionId, startsAt, venueName, venueAddress, priceFull, priceHalf, maxTicketsPerOrder, publishStatus` |
| Assento | `Seat` | `id, eventId, label` |
| Retenção | `Hold` | `id, customerId, eventId, fullCount, halfCount, expiresAt, holdStatus` |
| Assento retido | `HoldSeat` | `holdId, seatId` |
| Pedido | `Order` | `id, customerId, holdId, paymentStatus, totalCents, paidAt` |
| Ingresso | `Ticket` | `id, orderId, eventId, seatId, customerId, kind, code, shareToken, usedAt, validatedByUserId, cancelledAt` |

`role`: `admin` \| `organizer` \| `customer` \| `gate`  
`holdStatus`: `active` \| `converted` \| `expired` \| `cancelled`  
`kind`: `full` \| `half`  
`User.organizerId`: preenchido em `gate`  
Unique: `(organizerId, tmdbId)` em Exhibition; `(exhibitionId, startsAt, venueName)` em Event; `(eventId, label)` em Seat; HoldSeat por `seatId` com hold `active`; um Ticket não cancelado por `seatId`

**Implementation:** `HoldSeat.seatId` é único no Postgres. Hold expirado, cancelado ou convertido apaga as linhas de `HoldSeat`. O `Hold` permanece (`expired`, `cancelled` ou `converted`).

### 4.2. Modelagem (fonte do Prisma)

> **Instrução para a IA:** Gere `schema.prisma` e migrações a partir deste diagrama. Campo ou relação nova = migração + atualizar este mermaid na mesma mudança.

```mermaid
erDiagram
  User ||--o{ Exhibition : organizes
  User ||--o{ User : employsGate
  User ||--o{ Hold : places
  User ||--o{ Order : pays
  User ||--o{ Ticket : owns
  User ||--o{ Ticket : validates
  Exhibition ||--o{ Event : schedules
  Event ||--|{ Seat : has
  Event ||--o{ Hold : receives
  Event ||--o{ Ticket : forSession
  Seat ||--o| HoldSeat : maybeHeld
  Seat ||--o| Ticket : soldAs
  Hold ||--|{ HoldSeat : locks
  Hold ||--o| Order : convertsTo
  Order ||--|{ Ticket : issues

  User {
    uuid id PK
    string email
    string passwordHash
    enum role
    enum status
    uuid organizerId FK
    boolean mustChangePassword
  }

  Exhibition {
    uuid id PK
    uuid organizerId FK
    string tmdbId
    string title
    string posterUrl
    enum publishStatus
  }

  Event {
    uuid id PK
    uuid exhibitionId FK
    datetime startsAt
    string venueName
    string venueAddress
    int priceFull
    int priceHalf
    int maxTicketsPerOrder
    enum publishStatus
  }

  Seat {
    uuid id PK
    uuid eventId FK
    string label
  }

  Hold {
    uuid id PK
    uuid customerId FK
    uuid eventId FK
    int fullCount
    int halfCount
    datetime expiresAt
    enum holdStatus
  }

  HoldSeat {
    uuid holdId FK
    uuid seatId FK
  }

  Order {
    uuid id PK
    uuid customerId FK
    uuid holdId FK
    enum paymentStatus
    int totalCents
    datetime paidAt
  }

  Ticket {
    uuid id PK
    uuid orderId FK
    uuid eventId FK
    uuid seatId FK
    uuid customerId FK
    enum kind
    string code
    string shareToken
    datetime usedAt
    uuid validatedByUserId FK
    datetime cancelledAt
  }
```

**Implementação:** preços em centavos. `code` e `shareToken` com entropia alta (UUID v4 ou 32 bytes hex). `Exhibition.posterUrl` é opcional: a TMDb não tem pôster para todo filme. Título e pôster ficam no cartaz. Hold, ingresso e mapa apontam para a sessão.

## 5. Contratos Globais (DTOs)

> Tipagem de entrada. ValidationPipe com `whitelist: true`.

- **LoginDto:** `{ email, password }` → `{ accessToken, user: { id, email, role } }`
- **CreateExhibitionDto:** `{ tmdbId }`
- **UpdateExhibitionDto:** `{ tmdbId?, publishStatus? }`
- **CreateEventsDto:** `{ events: [{ startsAt, venueName, venueAddress?, priceFull, priceHalf?, maxTicketsPerOrder? }] }` (1 a 62 itens)
- **UpdateEventDto:** campos parciais de uma sessão + `publishStatus?`
- **CreateHoldDto:** `{ eventId, seatLabels: string[], fullCount, halfCount }`
- **PayOrderDto:** `{ holdId, result: "approved" | "declined" }`
- **GateScanDto:** `{ eventId, code }`
- **RegisterCustomerDto (Should):** `{ email, password, name? }`

Regra de preço: se `priceHalf` omitido na criação/atualização de `priceFull`, API define `floor(priceFull / 2)` na sessão.

## 6. Scaffolding da API

### 6.1. Diretórios (`apps/api/src`)

> **Instrução para a IA:** Um domínio = uma pasta na raiz de `src/`, no padrão Nest CLI.

- **`auth/`** — login, JWT, guards de papel  
- **`users/`** — leitura de perfil; gestão Admin/org (Should)  
- **`catalog/`** — proxy TMDb  
- **`exhibitions/`** — CRUD de cartaz  
- **`events/`** — sessões do cartaz + geração de Seats  
- **`reservations/`** — Hold, HoldSeat, expiração  
- **`orders/`** — pagamento simulado  
- **`tickets/`** — meus ingressos, share público, QR payload  
- **`gate/`** — scan e respostas da portaria  
- **`common/`** — filters, pipes, decorators  
- **`prisma/`** — `PrismaService` global

### 6.2. Services

| Service | Responsabilidade |
| ------- | ---------------- |
| `PrismaService` | Conexão Postgres |
| `AuthService` | Credenciais e JWT |
| `CatalogService` | Busca TMDb e detalhe por `tmdbId` (título e poster) |
| `ExhibitionsService` | Cartaz, publicação, vitrine |
| `EventsService` | Sessão, preços, layout de assentos |
| `ReservationsService` | Hold, unicidade, expiração |
| `OrdersService` | Pagamento simulado → Ticket |
| `TicketsService` | Lista do dono, share público |
| `GateService` | Validação e auditoria |

## 7. Segurança

- **ValidationPipe** global com `whitelist: true`.  
- **JWT** no header `Authorization: Bearer`; `sub` + `role`; expiry via env.  
- **Guards** de autenticação e de papel no Nest.  
- **CORS** restrito a `CORS_ORIGIN` / front.  
- **Share público:** só por `shareToken`; sem e-mail/senha; rate limit no GET.  
- **Segredos:** nunca no repositório (`JWT_SECRET`, `DATABASE_URL`, `TMDB_API_KEY`).  
- **Exception Filter** global. Formato de erro:

```json
{
  "statusCode": 400,
  "timestamp": "2026-08-17T00:00:00.000Z",
  "path": "/api/rota",
  "message": "Dados inválidos",
  "fieldErrors": {
    "email": ["Informe um e-mail válido"]
  }
}
```

`fieldErrors` é um objeto campo → lista de mensagens. Sem erro de campo, vem `{}`.

## 8. Contratos de API (Must)

> **Instrução para a IA:** Controllers e DTOs seguem estes endpoints. Papéis entre parênteses.

### Auth

- **POST** `/auth/login` (público) — LoginDto → token + user  
- **GET** `/users/me` (autenticado) — perfil

### Catálogo, cartaz e sessões

- **GET** `/catalog/movies?q=` (organizer) — busca TMDb  
- **POST** `/exhibitions` (organizer) — cria cartaz draft  
- **GET** `/exhibitions` (público) — cartazes publicados  
- **GET** `/exhibitions/:id` (público) — detalhe do cartaz + sessões publicadas  
- **GET** `/exhibitions/mine` (organizer)  
- **GET** `/exhibitions/mine/:id` (organizer)  
- **PATCH** `/exhibitions/:id` (organizer) — filme (só sem sessão) e publicação  
- **POST** `/exhibitions/:id/events` (organizer) — uma ou várias sessões + seats  
- **PATCH** `/events/:id` (organizer)
- **GET** `/events/:id` (público, JWT opcional) — sessão publicada, cartaz e `freeSeatCount`
- **GET** `/events/:id/seats` (customer) — mapa: `free` \| `held_by_me` \| `taken`

**Implementation:** a busca devolve `tmdbId`, `title`, `posterUrl` e `releaseDate`. `CatalogService.getMovie(tmdbId)` carrega o mesmo recorte por id. Título e poster ficam no `Exhibition`. `GET /exhibitions` lê o banco e não chama a TMDb.

**Implementation:** o cartaz nasce `draft`. A vitrine lista cartaz `published` mesmo sem sessão publicada. `GET /exhibitions/:id` de draft responde 404. O detalhe público omite sessão draft. Um organizador, um `tmdbId`: unique no cartaz. Trocar o filme com sessão existente responde 409.

**Implementation:** `POST /exhibitions/:id/events` recebe `events[]` (1 a 62). Cada item gera o evento e o layout de 96 assentos (fileiras A–H, 12 por fileira) na mesma transação. Mesmo `startsAt` e mesmo `venueName` no cartaz responde 409. Teto por compra entre 1 e 20.

**Implementation:** `GET /events/:id` de sessão ou cartaz draft responde 404. `freeSeatCount` conta poltronas sem ingresso e sem hold ativo vigente de outra pessoa. Hold do consumidor logado conta como disponível. A soma inteira + meia não pode passar do teto nem de `freeSeatCount`. `POST /reservations/holds` recusa sessão com `startsAt` já passado. Sem duração de filme, a venda fecha no horário de início.

### Reserva e pagamento

- **POST** `/reservations/holds` (customer) — CreateHoldDto  
- **GET** `/reservations/holds/mine` (customer) — pedidos pendentes do dono  
- **GET** `/reservations/holds/:id` (customer) — pedido pendente do dono  
- **POST** `/orders/pay` (customer) — PayOrderDto

**Implementation:** hold de 10 minutos (`expiresAt`). Transação no POST. Unique de `HoldSeat.seatId` no Postgres: segundo insert no mesmo lugar responde 409. Hold `active` vencido: a API apaga os `HoldSeat` e marca `expired` no GET do mapa, no POST e num job a cada 60 s. O registro do `Hold` permanece. Um consumidor, uma sessão, um hold `active`: o POST novo cancela o anterior. `GET /events/:id/seats` exige `customer` e devolve `myHold` quando há hold vigente. `GET /reservations/holds/:id` de hold expirado, convertido, cancelado ou de outro dono não devolve checkout. `GET /reservations/holds/mine` devolve holds `active` vigentes sem `Order`, no mesmo shape do checkout.

**Implementation:** `POST /orders/pay` exige `customer` e hold do dono ainda `active`. A transação chama `releaseExpired`, grava `Order` e converte o hold. `approved` emite um `Ticket` por assento e preenche `paidAt`. `declined` não cria ticket; os lugares voltam a livres. `totalCents` usa os preços da sessão. Os primeiros `fullCount` assentos, em ordem de label (`en`), recebem `kind` full. `code` e `shareToken` nascem com 32 hex; a resposta do pay não os inclui. O JSON devolve `id`, `holdId`, `paymentStatus`, `totalCents`, `paidAt` e `tickets` com `seatLabel` e `kind`. Segundo pay no mesmo hold responde 409.

### Ingressos

- **GET** `/tickets/mine` (customer)  
- **GET** `/tickets/share/:shareToken` (público)

**Implementation:** `GET /tickets/mine` lista tickets do dono (`cancelledAt` nulo) com `code`, `shareToken`, sessão, cartaz, assento e `kind`. `GET /tickets/share/:shareToken` devolve um ingresso: sessão, assento, `kind` e `code` (payload do QR). Sem e-mail, senha, `customerId`, `shareToken` nem lista de outros. Rate limit só no share (`ThrottlerGuard` no handler; 30 req/min por IP). QR no web com `qrcode.react`; a portaria (#8) lê o `code`, não a URL do link.

### Portaria

- **POST** `/gate/scan` (gate) — GateScanDto → `valid` \| `invalid` \| `already_used` \| `wrong_event`

## 9. Variáveis de Ambiente

> **Instrução para a IA:** Nada sensível hardcoded. `ConfigModule` valida na subida.

**Implementation:** `apps/api/.env` e `apps/web/.env` são arquivos separados. Produção na droplet usa `.env.prod` só no Compose.

| Variável | Onde | Uso |
| -------- | ---- | --- |
| `DATABASE_URL` | api | Postgres |
| `JWT_SECRET` | api | Assinatura JWT |
| `JWT_EXPIRES_IN` | api | Ex.: `8h` |
| `CORS_ORIGIN` | api | Origem do front |
| `TMDB_API_KEY` | api | Catálogo |
| `VITE_API_URL` | web | Base da API |

## 10. Testes

Cada issue da API lista casos success e fail. Ordem: escrever testes → falhar → implementar → verde. Skill `tdd-api`.

Must: auth/papéis, CRUD sessão, hold/unicidade, pagamento, share/QR, portaria (quatro respostas + segundo scan).

## 11. Seed e Deploy

**Seed (README):** 1 admin, 1 organizador, 2 consumidores, 1 portaria (`organizerId` do org), 1 sessão publicada com mapa e lugares livres.

**Must:** subir local (API + web + Postgres) via README.  
**Should:** Docker Compose local (`docker compose up --build`) e Compose de produção na droplet (`docker-compose.prod.yml`).  

**Implementation:** na droplet, `docker-compose.prod.yml` publica só 80/443. Caddy faz proxy de `/api` para o Nest e do restante para o Nginx do front. Postgres não abre porta no host. `VITE_API_URL=/api` (mesma origem).

## 12. Design Tokens

Fonte da verdade: [visual.md](visual.md).

| Token | Hex | Uso |
| ----- | --- | --- |
| Preto | `#161A1D` | texto, ocupado |
| Principal | `#660708` | CTA, selecionado, marca |
| Apoio | `#BA181B` | erro, já utilizado, recusa |
| Sucesso | `#2D6A4F` | válido, pagamento ok |
| Branca | `#F5F3F4` | fundo |

**Tipografia:** Roboto 400 / 500 / 700 (`theme.fontFamily` no Mantine).
