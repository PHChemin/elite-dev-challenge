# Deploy em produção

Guia para subir o PHCTickets em um droplet (DigitalOcean), VPS Hostinger ou ambiente local usando o stack de produção (`docker-compose.prod.yml`).

## Pré-requisitos

- Ubuntu 22.04+ (ou distro Linux com Docker)
- [Docker Engine](https://docs.docker.com/engine/install/) e [Compose plugin](https://docs.docker.com/compose/install/)
- Portas **80** e **443** liberadas no firewall
- Domínio apontando para o servidor (opcional; HTTP na porta 80 funciona com `SITE_ADDRESS=:80`)
- Git instalado no servidor

## 1. Clone do repositório

```bash
git clone https://github.com/SEU_USUARIO/elite-dev-challenge.git
cd elite-dev-challenge
```

Substitua a URL pelo remote real do projeto.

## 2. Variáveis de ambiente

Copie o template e edite com valores reais:

```bash
cp .env.prod.example .env.prod
```

| Variável           | Exemplo                         | Uso                                              |
| ------------------ | ------------------------------- | ------------------------------------------------ |
| `POSTGRES_USER`    | `phctickets`                    | Usuário do Postgres                              |
| `POSTGRES_PASSWORD`| senha forte                     | Senha do banco                                   |
| `POSTGRES_DB`      | `phctickets`                    | Nome do banco                                    |
| `JWT_SECRET`       | string longa aleatória          | Assinatura JWT                                   |
| `JWT_EXPIRES_IN`   | `8h`                            | Expiração do token                               |
| `TMDB_API_KEY`     | chave TMDb                      | Catálogo do organizador (opcional no gate)       |
| `SITE_ADDRESS`     | `:80` ou `tickets.seudominio.com` | Endereço do Caddy (HTTP ou HTTPS automático)   |
| `CORS_ORIGIN`      | `http://SEU_IP` ou `https://…`  | Origem permitida pelo Nest                       |
| `VITE_API_URL`     | `/api`                          | Base da API no build do front (mesma origem)     |

**Não commite** `.env.prod` com segredos reais.

Para teste local do stack prod:

```env
SITE_ADDRESS=:80
CORS_ORIGIN=http://localhost
VITE_API_URL=/api
```

## 3. Subir os serviços

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

O Compose sobe:

- **db** — Postgres 16 (sem porta exposta no host)
- **api** — NestJS na porta interna 3000
- **web** — Nginx com SPA estático
- **proxy** — Caddy na 80/443; `/api*` → API, resto → front

Aguarde o healthcheck da API antes de usar o sistema.

## 4. Seed inicial (obrigatório)

Após o primeiro `up`, popule usuários, sessão demo e ingresso de teste:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api npx prisma db seed
```

Contas e dados demo estão no [README](../README.md) (usuários do seed e sessão demo).

## 5. Verificação

1. Abra `http://SEU_IP` (ou `https://tickets.seudominio.com`).
2. Faça login com `gate@phctickets.local` / `gate123`.
3. Em **Portaria**, escolha a sessão demo (Clube da Luta — 15/12/2026).
4. Valide o código demo `cccccccccccccccccccccccccccccccc` — resposta `valid`.
5. Segundo scan do mesmo código → `already_used`.

Health da API (via proxy):

```bash
curl -s http://localhost/api
```

## 6. HTTPS com domínio

No `.env.prod`:

```env
SITE_ADDRESS=tickets.seudominio.com
CORS_ORIGIN=https://tickets.seudominio.com
```

Aponte o DNS (registro A) para o IP do servidor. O Caddy obtém certificado Let's Encrypt automaticamente na porta 443.

Recrie o proxy se necessário:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate proxy
```

## 7. Hostinger VPS

1. No painel Hostinger, crie ou acesse o VPS e anote o IP.
2. Conecte via SSH: `ssh root@SEU_IP`.
3. Instale Docker seguindo a [documentação oficial](https://docs.docker.com/engine/install/ubuntu/).
4. Repita os passos 1–5 deste guia no servidor.
5. Libere as portas no firewall:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 8. Troubleshooting

**Front não encontra a API**

- Confirme `VITE_API_URL=/api` no `.env.prod` antes do build.
- Rebuild do web:  
  `docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d web proxy`

**Erro de CORS**

- `CORS_ORIGIN` deve coincidir com a URL que o browser usa (incluindo `http` vs `https`).

**Banco vazio / login falha**

- Rode o seed (passo 4).

**Logs**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f api
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f proxy
```

**Parar e remover containers**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

Os volumes `pgdata` e `caddy_*` persistem dados entre subidas.

## 9. Teste local do stack prod

Antes de publicar no VPS, valide o compose de produção na máquina de desenvolvimento:

```bash
cp .env.prod.example .env.prod
# Edite: SITE_ADDRESS=:80, CORS_ORIGIN=http://localhost

docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api npx prisma db seed
```

Acesse `http://localhost` e repita a verificação do passo 5.
