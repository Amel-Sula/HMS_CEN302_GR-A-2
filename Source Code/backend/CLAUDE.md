# HMS Backend

Node.js/Express/PostgreSQL REST API for the Hotel Management System.

## Quick Start

```bash
npm install
# copy .env.example to .env and fill in DB_PASSWORD
cp .env.example .env
npm run db:seed
npm run dev
```

## Architecture

- **Routes** → thin controllers (validate input, call service, return JSON)
- **Services** → all business logic and DB queries via Sequelize
- **Models** → `src/models/index.js` defines all 10 models + associations
- **Middleware** → `auth.js` (JWT), `logger.js` (SystemLog writes)

## Key Notes

- All passwords hashed with bcryptjs (10 rounds)
- JWT in `Authorization: Bearer <token>` header
- Roles: `guest`, `receptionist`, `admin`
- `sequelize.sync({ alter: true })` runs automatically in development mode
- Walk-in flow creates a guest account on the fly if email not found

## Seeded Credentials (password: `password123`)

| Role | Email |
|------|-------|
| Admin | admin@hotel.com |
| Receptionist | receptionist@hotel.com |
| Guest | john@example.com |
| Guest | alice@example.com |
