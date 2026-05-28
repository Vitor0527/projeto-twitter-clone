# VG — Clone Twitter/X

Monorepo com **React (Vite)** no frontend e **Node/Express + MySQL** no backend.

## Requisitos

- Node.js + npm
- MySQL a correr localmente

## Instalação

Na raiz do projeto:

```bash
npm run setup
```

Copia `backend/.env.example` para `backend/.env` e ajusta user/password da base de dados.

Edita `backend/.env` (nome da base, utilizador MySQL, `JWT_SECRET`, etc.).

## Arrancar

Na **raiz** (frontend + backend ao mesmo tempo):

```bash
npm run dev
```

| O quê | Porta | Abrir no browser |
|-------|-------|------------------|
| **App (interface)** | 5173 | http://127.0.0.1:5173 |
| **API** | 3001 | http://localhost:3001/api/health |

O frontend na 5173 chama a API através de proxy (`/api` → 3001). **Não uses a 3001 para navegar na app** — lá só está a API (JSON).

Em separado, se precisares:

```bash
npm run dev:frontend
npm run dev:backend
```

## Base de dados

MySQL tem de estar a correr. Primeira vez (cria a base + tabelas):

```bash
cd backend
npm run db:init
```

Se a base `twitter_projeto` ja existir mas as tabelas estiverem em conflito:

```bash
cd backend
npm run db:reset
```

Se `npm run dev` falhar com **Unknown database**, corre `npm run db:create` na pasta `backend`.

Volta à raiz e corre outra vez `npm run dev`.

## Contas de teste

No arranque do servidor é criada/atualizada uma conta admin (valores em `backend/.env`):

- Utilizador: `admin`
- Password: `admin123`
- Backoffice: http://127.0.0.1:5173/admin

Podes registar outras contas em http://127.0.0.1:5173/login. Várias contas ficam guardadas no browser com chaves `vg-*` no localStorage.

## Links úteis

- Swagger: http://localhost:3001/api-docs
- Health: http://localhost:3001/api/health
- Postman: importa `postman/VG-API.postman_collection.json` (Login guarda o token automaticamente)

## Build do frontend

```bash
npm run build
npm run preview
```
