# Product Requirements Document (PRD) — PHCTickets

**Projeto:** PHCTickets (sessões de cinema e ingressos)  
**Versão:** 1.2.0  
**Status:** Definido (Must do desafio Elite Dev / Verzel)  
**Referências:** [SDD](SDD.md) · [Visual](visual.md) · [Issues](github-issues.md) · enunciado em `docs/Desafio-Elite-Dev-2026.pdf`

---

## 1. Visão Geral e Objetivo

O **PHCTickets** é uma plataforma em que o organizador publica sessões a partir do catálogo TMDb, o consumidor escolhe assentos (inteira e meia), paga de forma simulada e recebe um ingresso com QR. Na entrada, a portaria valida o código.

O objetivo do Must é o fluxo ponta a ponta: login por papel, sessão com mapa, retenção de assento, pagamento simulado, QR, link de compartilhamento, validação na porta, seed, testes da API e README. Should e Could enriquecem o produto depois que o Must roda.

## 2. Glossário

- **Sessão (`Event`):** Exibição de um filme em data, local e preços definidos pelo organizador.
- **Assento (`Seat`):** Poltrona identificada no mapa da sessão (ex.: `F12`).
- **Retenção (`Hold`):** Bloqueio temporário de assentos (10 minutos) até o pagamento.
- **Pedido (`Order`):** Pagamento simulado (`approved` ou `declined`) ligado a um hold.
- **Ingresso (`Ticket`):** Código opaco + QR; pode ser inteira ou meia (`kind`).
- **shareToken:** Token do link público de um ingresso.
- **Teto:** Máximo de ingressos por compra na sessão (padrão 6).
- **Portaria:** Papel que escolhe a sessão ativa e valida o QR.
- **Must / Should / Could / Won’t:** Prioridade MoSCoW deste PRD.

## 3. Atores e Permissões

- **Admin:** Cadastra organizadores (telas Should). Seed traz um admin.
- **Organizador:** Cria e edita sessões (Must). Cria e desativa portaria (Should).
- **Consumidor:** Lista sessões, compra, vê ingressos, compartilha link. Registro aberto (Should); seed traz dois consumidores.
- **Portaria (`gate`):** Escolhe a sessão e valida QR ou código digitado.
- **Sistema:** JWT, autorização por papel, unicidade de assento, expiração de hold, resposta padronizada de erro.

## 4. Escopo Funcional, Histórias e Aceite (MoSCoW)

> **Instrução para IA:** Uma história Must só está Done com critérios de aceite atendidos e testes da issue verdes (success e fail). Ordem: casos na issue → testes → implementação. Ver skill `tdd-api` e [github-issues.md](github-issues.md).

### Must Have

#### US01 — Login e papéis

**Ator:** Admin, Organizador, Consumidor, Portaria  
**História:** Como usuário do seed, quero entrar com meu papel para acessar só as ações permitidas.

**Critérios de Aceitação:**

- [x] Login emite JWT com `sub` e `role`.
- [x] Seed cobre os quatro papéis; README lista e-mails e senhas.
- [x] Rota protegida recusa token ausente, inválido ou papel errado.

#### US02 — Catálogo TMDb e CRUD de sessão

**Ator:** Organizador  
**História:** Como organizador, quero montar uma sessão a partir de um filme TMDb com data, local, preços e teto.

**Critérios de Aceitação:**

- [ ] Busca TMDb devolve título e poster.
- [ ] Criar/editar/listar sessão com `priceFull`, `priceHalf`, `maxTicketsPerOrder` (padrão 6).
- [ ] Sem `priceHalf` no request, a API grava `floor(priceFull / 2)`.
- [ ] Falha da TMDb não apaga sessões já salvas.

#### US03 — Compra: quantidade, mapa e retenção

**Ator:** Consumidor  
**História:** Como consumidor, quero informar inteira e meia, escolher esses assentos e retê-los por 10 minutos.

**Critérios de Aceitação:**

- [ ] Soma inteira + meia ≤ teto da sessão.
- [ ] Mapa exige exatamente essa quantidade de lugares.
- [ ] Prosseguir cria hold de 10 minutos se os assentos estão livres.
- [ ] Dois holds no mesmo assento: o segundo recebe conflito.
- [ ] Hold expirado libera o assento.

#### US04 — Pagamento simulado

**Ator:** Consumidor  
**História:** Como consumidor, quero aprovar ou recusar o pagamento simulado.

**Critérios de Aceitação:**

- [ ] `approved` gera um ticket por assento (`kind` full ou half).
- [ ] `declined` não vende; o lugar volta a livre conforme a regra do hold.

#### US05 — Meus ingressos, QR e link

**Ator:** Consumidor (e qualquer um com o link)  
**História:** Como dono, quero ver o QR e copiar um link; quem tem o link vê aquele ingresso.

**Critérios de Aceitação:**

- [ ] Meus ingressos exige JWT do dono.
- [ ] `code` e `shareToken` são opacos e únicos.
- [ ] `GET` público por `shareToken` devolve sessão, assento, kind e QR.
- [ ] A resposta pública não inclui e-mail, senha nem outros ingressos.

#### US06 — Portaria

**Ator:** Portaria  
**História:** Como funcionário da porta, quero escolher a sessão e validar o ingresso.

**Critérios de Aceitação:**

- [ ] Sessão ativa obrigatória antes do scan.
- [ ] Respostas: `valid`, `invalid`, `already_used`, `wrong_event`.
- [ ] Validação grava `validatedAt` e `validatedByUserId`.
- [ ] Segundo scan do mesmo ingresso → `already_used`.
- [ ] Câmera e digitação usam o mesmo endpoint.

#### US07 — Seed, README e testes da API

**Ator:** Avaliador / Desenvolvedor  
**História:** Como avaliador, quero subir o projeto, logar com o seed e ver os testes do Must.

**Critérios de Aceitação:**

- [ ] Seed: 1 admin, 1 organizador, 2 consumidores, ≥1 portaria, ≥1 sessão com lugares.
- [ ] README: como subir, usuários, o que ainda não funciona, uso de IA.
- [ ] Cada operação Must tem teste success e fail; `npm test` (API) passa.

### Should Have

#### US08 — Registro e gestão de contas

Registro do consumidor. Admin cria/desativa organizador. Organizador cria/desativa portaria. Primeiro acesso: senha temporária na tela e `mustChangePassword`.

#### US09 — Busca, cancelamento e deploy

Busca/filtro de sessões. Cancelamento até 24 h antes de `startsAt` com devolução do lugar. Docker Compose. Regenerar `shareToken`.

### Could Have

Mapa ao vivo (websocket). Entidade estabelecimento com portaria por local. Ticketmaster e pista. Escala de staff por sessão. Gateway de pagamento real.

### Won’t Have

Nota fiscal, revenda entre usuários, app nativo, recuperação de senha, e-mail de ingresso.

## 5. Regras de Negócio

- **RN01 — Papel:** Operação privada exige JWT válido e `role` adequado.
- **RN02 — Unicidade:** Dois consumidores não compram o mesmo assento na mesma sessão.
- **RN03 — Retenção:** Hold de 10 minutos; sucesso vende; recusa, cancelamento do hold ou expiração libera.
- **RN04 — Teto:** Soma da compra ≤ `maxTicketsPerOrder` da sessão.
- **RN05 — Preço meia:** Default `floor(priceFull / 2)`; valor enviado pelo organizador prevalece.
- **RN06 — Meia na compra:** Declaração do consumidor (`Ticket.kind`). A portaria valida o QR, não a categoria.
- **RN07 — Ingresso:** `code` na porta; `shareToken` no link público; um ingresso valida uma vez.
- **RN08 — Evento errado:** `ticket.eventId` ≠ sessão ativa da porta.
- **RN09 — Fonte da verdade:** Regras de negócio na API; a UI não autoriza sozinha.
- **RN10 — TDD:** Issue fecha só com testes da API verdes.

## 6. Fora de Escopo

Won’t do enunciado e do prazo. Pista e Ticketmaster. Escala de staff por sessão. Tabela de estabelecimento no Must. Aplicativo fora do navegador. E2E de browser no Must.

## 7. Requisitos Não Funcionais

- **Arquitetura:** Monorepo `apps/web` + `apps/api`; Nest em Controllers / Services / Modules.
- **Segurança:** DTO + ValidationPipe (`whitelist`); JWT Bearer; segredos só em ambiente.
- **Integridade:** Transação no hold e na confirmação; unique de assento/ticket no Postgres.
- **Qualidade:** Jest na API; success e fail por operação Must.
- **Operação:** README local obrigatório; Docker Compose é Should.
- **Visual:** [visual.md](visual.md) — Roboto, paleta PHCTickets, Mantine.

## 8. Fluxos Principais

### Consumidor compra

1. Lista sessões publicadas → detalhe.  
2. Quantidade inteira e meia → mapa.  
3. Prosseguir → hold 10 min → pagamento.  
4. Sucesso → ingresso, QR, link.

### Organizador publica

1. Busca filme TMDb.  
2. Data, local, inteira (meia = metade, editável), teto.  
3. Publica.

### Portaria valida

1. Login → escolhe sessão.  
2. Lê QR ou digita código.  
3. Vê válido / inválido / já utilizado / evento errado.

## 9. Matriz Issue × História

| História | Issue / PR (ver github-issues.md) |
| -------- | --------------------------------- |
| US01     | Auth e papéis · `feat/auth-catalog` |
| US02     | TMDb + CRUD de sessão · `feat/auth-catalog` / `feat/events-seats` |
| US03     | Mapa e retenção · `feat/events-seats` |
| US04     | Pagamento simulado · `feat/checkout-tickets` |
| US05     | Ingresso, QR e link · `feat/checkout-tickets` |
| US06     | Portaria · `feat/gate-share` |
| US07     | Seed, README, testes · `chore/seed-readme-deploy` |
| US08–US09 | Issues Should |
