# PHCTickets

Plataforma de sessões de cinema e ingressos (desafio Elite Dev / Verzel).

- [PRD](docs/PRD.md)
- [SDD](docs/SDD.md)
- [Visual](docs/visual.md)
- [Uso de IA](docs/ai-process.md)

## Stack

Monorepo npm workspaces: `apps/api` (NestJS + Prisma + PostgreSQL) e `apps/web` (Vite + React + Mantine).

Dependências ficam em `node_modules` na raiz. Node.js 20.x ou superior.

## Como subir (Docker)

O Compose local usa os defaults do `docker-compose.yml`. No host, a API lê `apps/api/.env` e o front lê `apps/web/.env`.

```bash
docker compose up --build
```

API: `http://localhost:3000/api`. Swagger: `http://localhost:3000/api/docs`. Front: `http://localhost:5173`.

Só o banco (API e web no host):

```bash
docker compose up db -d
```

## Droplet (produção)

O Compose de produção publica só 80 e 443. Postgres, API e Nginx ficam na rede interna. O Caddy encaminha `/` ao front e `/api` ao Nest.

1. Copie e edite o ambiente. Não commite este arquivo.

```bash
cp .env.prod.example .env.prod
```

2. Troque senhas e `JWT_SECRET`. Em acesso por IP, use `SITE_ADDRESS=:80` e `CORS_ORIGIN=http://SEU_IP`. Com domínio apontando para a droplet, use o hostname (`SITE_ADDRESS=tickets.seudominio.com` e `CORS_ORIGIN=https://tickets.seudominio.com`) para o Caddy emitir HTTPS.

3. `VITE_API_URL=/api` faz o browser chamar a mesma origem. Rebuild da imagem `web` é obrigatório se essa variável mudar.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

Abra `http://SEU_IP` (ou o domínio). A porta 5432 não fica exposta.

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

| Papel       | E-mail                       | Senha          |
| ----------- | ---------------------------- | -------------- |
| Admin       | `admin@phctickets.local`     | `admin123`     |
| Organizador | `organizer@phctickets.local` | `organizer123` |
| Consumidor  | `customer@phctickets.local`  | `customer123`  |
| Portaria    | `gate@phctickets.local`      | `gate123`      |

A portaria fica ligada ao organizador do seed (`organizerId`).

Prisma Studio (Postgres no ar, `apps/api/.env` com `DATABASE_URL`):

```bash
npm run prisma:studio
```

Abre `http://localhost:5555`. É a UI do Prisma para ver e editar tabelas. Não entra no Compose de produção.

## Testes

```bash
npm test
```

## O que já existe

Scaffold do monorepo, schema Prisma, tema Mantine (Roboto e paleta PHCTickets), Docker Compose e Auth JWT na API (`POST /api/auth/login`, `GET /api/users/me`, guards de papel).

## O que falta

Catálogo TMDb, mapa, hold, pagamento, QR, portaria e seed completo da sessão. Ver [issues](docs/github-issues.md).
