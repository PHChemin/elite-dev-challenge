# Issues (agrupadas por PR)

Abrir no GitHub com este texto. Um PR cobre várias issues, nesta ordem.

Toda issue de API segue o molde abaixo. Implementação: testes da seção **Casos** primeiro; controller e service depois; PR só com testes verdes.

Molde:

- Feature
- Fluxos (PRD)
- Requisitos
- Casos: pelo menos um success e um fail por operação (rota/service)

## PR `feat/auth-catalog`

### Auth e papéis

Login nos papéis admin, organizer, customer, gate. Seed no README.

Atenção: JWT Bearer. Papel no token. Guard na API.

Casos:

- Success: login com seed de cada papel; rota protegida aceita o token certo.
- Fail: senha errada; rota de organizador com token de consumidor.

### Integração TMDb

Busca de filmes para o organizador montar a sessão. Poster e título.

Atenção: erro da TMDb visível. Sessões já gravadas continuam. Chave só no ambiente da API.

Casos:

- Success: busca devolve título e poster.
- Fail: TMDb indisponível devolve erro; listar sessões já salvas ainda funciona.

## PR `feat/events-seats`

### CRUD de sessão

Criar, listar, editar. Filme TMDb, data, local, preço inteira, meia = metade se omitida, teto por compra (padrão 6).

Atenção: teto e capacidade são campos diferentes. Meia enviada pelo organizador prevalece.

Casos:

- Success: criar com inteira 4000 e sem meia persiste meia 2000; editar título; listar publicadas.
- Fail: criar sem filme ou com teto 0; consumidor POST /events.

### Mapa e retenção

Quantidade inteira e meia no detalhe. Mapa com exatamente esses lugares. Hold 10 min. Unicidade.

Atenção: dois consumidores no mesmo lugar. Transação. Segundo recebe conflito. Hold vencido volta a livre.

Casos:

- Success: hold de N assentos com N = inteira + meia; expirado libera.
- Fail: hold acima do teto; segundo hold no mesmo assento.

## PR `feat/checkout-tickets`

### Pagamento simulado

Aprovar e recusar. Recusa não vende.

Casos:

- Success: approved gera ticket por assento.
- Fail: declined mantém lugar livre após o hold.

### Ingresso e QR

Meus ingressos (JWT do dono). Código opaco. QR. GET público `/tickets/share/:shareToken` só daquele ingresso.

Atenção: `code` e `shareToken` opacos. Página pública não devolve e-mail.

Casos:

- Success: dono lista os seus; GET do shareToken devolve sessão, assento e QR.
- Fail: shareToken inexistente; token de outro ingresso não aparece na lista do dono.

## PR `feat/gate-share`

### Portaria

Escolher sessão. Câmera e digitação. Quatro respostas. `validatedByUserId`.

Atenção: um ingresso uma validação. Evento errado = sessão da porta ≠ sessão do ingresso.

Casos:

- Success: código da sessão atual → valid; grava quem leu.
- Fail: código lixo → invalid; outro evento → wrong_event; segundo scan → already_used; consumidor no endpoint de scan.

## PR `chore/seed-readme-deploy`

Seed (1 admin, 1 org, 2 consumidores, ≥1 gate, ≥1 sessão). README. Texto de IA. `npm test` da API documentado.

Should no mesmo PR se o Must já passou: Docker, Vercel.

## Should (issues à parte, depois do Must)

- Registro do consumidor
- Admin cria/desativa organizador; primeiro acesso simulado
- Organizador adiciona/desativa portaria
- Busca e filtro
- Cancelamento até 24 h antes
- Regenerar shareToken
- Docker Compose
- Front na Vercel
