# VG - Clone Twitter/X

Projeto frontend para DWFE Projeto II 2025/2026. A aplicacao e uma SPA em React que simula as funcionalidades principais de um clone Twitter/X e deixa a integracao com backend preparada numa camada propria.

## Funcionalidades implementadas

- Layout com header, footer e menu lateral responsivo.
- Landing page de entrada.
- Alternancia de tema claro/escuro aplicada globalmente por CSS variables.
- Login e registo de utilizadores.
- Feed cronologico inverso com tweets dos utilizadores seguidos.
- Criacao de tweets ate 280 caracteres.
- Publicacao de tweets com imagem por upload local.
- Likes em tweets.
- Seguir/deixar de seguir utilizadores.
- Pesquisa/exploracao de utilizadores e tweets.
- Perfil publico com rota dinamica `/perfil/:username`.
- Backoffice com gestao de utilizadores e tweets.
- Persistencia de demonstracao em `localStorage`.

## Contas de teste

- Administrador: `admin` / `admin123`
- Utilizador: `ana.codes` / `123456`

## Como executar

```bash
npm install
npm run dev
```

Depois abrir o URL indicado pelo Vite.

Para validar build:

```bash
npm run build
```

## Arquitetura

```text
src/
  components/   Componentes reutilizaveis de layout, tweets, utilizadores e protecao de rotas
  context/      Contextos React para autenticacao e tema
  data/         Dados iniciais para a demonstracao
  pages/        Paginas ligadas ao router
  services/     Camada de API local, preparada para ser substituida por chamadas HTTP
  utils/        Funcoes auxiliares
```

A logica de dados esta isolada em `src/services/storageApi.js`. Para integrar o backend, essa API local deve ser substituida por `fetch`/`axios` para endpoints REST, mantendo as paginas e componentes praticamente iguais.

## Endpoints sugeridos para backend

- `POST /auth/login`
- `POST /auth/register`
- `GET /users`
- `GET /users/:username`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `POST /users/:id/follow`
- `GET /tweets`
- `GET /feed`
- `POST /tweets`
- `PATCH /tweets/:id`
- `DELETE /tweets/:id`
- `POST /tweets/:id/like`

## Modelo de dados sugerido

```text
users(id, username, name, email, password_hash, role, bio, avatar, created_at)
tweets(id, author_id, body, image_url, created_at)
follows(follower_id, followed_id)
likes(user_id, tweet_id)
```

## Notas de avaliacao

O frontend cobre os requisitos funcionais do enunciado com dados mock. O backend, a base de dados real, autenticacao segura e upload persistente de ficheiros ficam como trabalho de integracao nas unidades de Back-End e GBD.
