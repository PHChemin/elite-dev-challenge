# Identidade visual

Referência de produto: [Sympla](https://www.sympla.com.br/) — lista clara, card de evento com data e preço, checkout curto, pouco ornamento.

Componentes: [Mantine](https://mantine.dev/).

Ideias de tela: Stitch, em `docs/design/`. A implementação segue este arquivo.

Nome: **PHCTickets**. PNGs de referência em `docs/design/`.

## Tipografia

**Roboto.** É a fonte do produto. Pesos 400, 500 e 700.

No Mantine, `theme.fontFamily` aponta para Roboto (`@fontsource/roboto` ou equivalente). Títulos e corpo na mesma família; hierarquia por peso e tamanho.

## Paleta

| Nome | Hex | Uso |
| --- | --- | --- |
| Preto | `#161A1D` | texto, barras, ocupado no mapa |
| Principal | `#660708` | botão primário, assento selecionado, marca |
| Apoio | `#BA181B` | alerta, “já utilizado”, erro de leitura, recusa |
| Sucesso | `#2D6A4F` | “válido” na portaria, pagamento aprovado, confirmação |
| Branca | `#F5F3F4` | fundo da página, superfícies |

“Válido” usa **Sucesso**. Livre no mapa: branco ou cinza claro. Retido por você: Principal em contorno ou preenchimento leve.

## Princípios

- Uma ação principal por tela.
- Hierarquia: título da sessão, data, lugar, preço. Poster ao lado, em tamanho de apoio.
- Mapa de assentos: livre, retido por você, ocupado, selecionado. Legenda curta.
- Portaria: sessão atual sempre visível. Resultado da leitura grande (válido / inválido / já utilizado / evento errado).

## O que puxar da Sympla

Lista em grade ou lista densa. Filtro discreto (Should). Checkout em poucos passos. Botão de comprar óbvio.

## Fora do Must visual

Landing institucional. Carrossel de destaques. Dark mode. Mapa em 3D.

## Telas Must

1. Login
2. Lista de sessões
3. Detalhe da sessão (quantidade inteira e meia antes do mapa)
4. Criar / editar sessão (organizador): busca TMDb, preço inteira, meia preenchida com a metade (editável)
5. Mapa de assentos
6. Pagamento simulado (aprovar / recusar)
7. Meus ingressos
8. Ingresso (QR + copiar link)
9. Portaria: escolher sessão
10. Portaria: câmera e código, com o nome da sessão no topo

## Telas Should

Registro do consumidor. Admin: criar e desativar organizador. Organizador: lista de portaria, adicionar, desativar. Primeiro acesso: senha temporária na tela.
