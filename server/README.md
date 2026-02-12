# Backend Kanban

Node + Express + PostgreSQL.

## Pré-requisitos

- Node 18+
- PostgreSQL

## Configuração

1. Crie um banco PostgreSQL (ex.: `createdb kanban`).
2. Copie `server/.env.example` para `server/.env` e preencha:
   - `DATABASE_URL=postgresql://usuario:senha@localhost:5432/kanban`
   - `JWT_SECRET=um-secret-forte`
   - `CORS_ORIGIN=http://localhost:5173` (ou a URL do frontend, ex. `http://192.168.x.x:5173` para rede interna)
   - `PORT=3001`
3. Instale e rode as migrations e o seed (primeiro gestor):

```bash
cd server
npm install
npm run migrate
npm run seed
```

Para definir email/senha do gestor: `node scripts/seed-gestor.js email@exemplo.com senha123 Nome do Gestor`.

4. Inicie o servidor:

```bash
npm run dev
```

O servidor sobe em `http://0.0.0.0:3001` (acessível pela rede pelo IP da máquina).

## Frontend

Na raiz do projeto, crie `.env` com `VITE_API_URL=http://localhost:3001/api` (ou o IP da máquina do backend na rede). Depois `npm run dev` para subir o frontend.
