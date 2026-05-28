# Backend - Twitter-like API

Express.js backend API for the Twitter-like application, using Aiven managed MySQL database.

## Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn
- Aiven MySQL service credentials

### Installation

```bash
npm install
```

### Environment Setup

Create or update `.env` in the `backend/` folder with your Aiven database credentials:

```env
# Server
NODE_ENV=development
PORT=3001

# Aiven MySQL credentials (explicit vars preferred for reliability)
DB_DIALECT=mysql
DB_HOST=mysql-2453e603-projeto-curso.i.aivencloud.com
DB_PORT=24718
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD_HERE

# SSL configuration (required for Aiven)
DB_SSL_MODE=REQUIRED
DB_SSL_CA_PATH=./ca.pem
DB_REJECT_UNAUTHORIZED=true

# JWT
JWT_SECRET=sua_chave_super_secreta_mude_em_producao
JWT_EXPIRATION=24h

# File uploads
MAX_FILE_SIZE=5242880
UPLOAD_FOLDER=./uploads
```

#### Aiven SSL Certificate

1. Download the CA certificate from your Aiven service console.
2. Save it as `backend/ca.pem` in this directory.

#### Alternative: DATABASE_URL

You can use a single `DATABASE_URL` instead of individual `DB_*` vars:

```env
DATABASE_URL=mysql://avnadmin:YOUR_PASSWORD@mysql-2453e603-projeto-curso.i.aivencloud.com:24718/defaultdb
```

**Note:** When using `DATABASE_URL`, the `ssl-mode` query parameter is not parsed by mysql2; use explicit `DB_SSL_MODE=REQUIRED` alongside it.

### Running

**Development** (with nodemon auto-restart):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

### Database Scripts

- `npm run db:create` — Create database tables
- `npm run db:reset` — Reset database (schema + seed)
- `npm run db:admin` — Create default admin user
- `npm run db:migrate` — Run migrations
- `npm run db:retweets` — Sync retweets table

### Testing Connection

Use the included connection test script:

```bash
node test-conn.js
```

This will verify that your Aiven credentials and SSL settings are correct.

### API Docs

Swagger documentation is available at `http://localhost:3001/api-docs` when the server is running.

Generate/update Swagger docs:
```bash
npm run swagger
```

## Project Structure

```
backend/
├── bin/www                 # Server entry point
├── config/
│   ├── database.js         # Sequelize ORM setup
│   └── config.js           # App configuration
├── models/                 # Sequelize models (User, Tweet, etc.)
├── controllers/            # Route handlers
├── routes/                 # API routes
├── middlewares/            # Express middleware
├── scripts/                # Database and utility scripts
├── utils/                  # Helper functions
├── public/                 # Static files
├── uploads/                # User-uploaded files
└── ca.pem                  # Aiven SSL certificate (git-ignored)
```

## Troubleshooting

### "Access denied for user 'avnadmin'@'X.X.X.X'"

1. Check credentials in `.env` match your Aiven service.
2. Confirm your IP is allowed in Aiven's IP allowlist (should be "Open to all" for development).
3. Verify the CA certificate is saved at `./ca.pem`.
4. Reset the user password in Aiven console if needed.

### "Ignoring invalid configuration option passed to Connection: ssl-mode"

This is a mysql2 warning when using `DATABASE_URL` with `?ssl-mode=REQUIRED`. Use explicit `DB_SSL_MODE=REQUIRED` in `.env` instead.

### Database sync errors

Ensure:
- `DB_NAME` (or database in `DATABASE_URL`) exists in Aiven.
- User has permission to create tables.
- Run `npm run db:reset` to initialize tables.

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment (development/production) |
| `PORT` | 3001 | Server port |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 3306 | Database port |
| `DB_NAME` | projeto_db | Database name |
| `DB_USER` | root | Database user |
| `DB_PASSWORD` | password | Database password |
| `DB_DIALECT` | mysql | Database dialect (mysql/postgres) |
| `DATABASE_URL` | — | Full connection string (overrides individual DB_* vars if set) |
| `DB_SSL_MODE` | — | SSL mode (REQUIRED, PREFERRED, DISABLED) |
| `DB_SSL_CA_PATH` | — | Path to CA certificate file |
| `DB_SSL_CA` | — | Base64-encoded CA certificate content (alternative to `DB_SSL_CA_PATH`) |
| `DB_REJECT_UNAUTHORIZED` | true | Verify SSL certificate |
| `JWT_SECRET` | — | Secret for JWT signing |
| `JWT_EXPIRATION` | 24h | JWT token expiration |
| `MAX_FILE_SIZE` | 5242880 | Max file upload size (bytes) |
| `UPLOAD_FOLDER` | ./uploads | Directory for uploaded files |

## Development

### Code style

The project uses standard Node.js conventions. Use ESLint/Prettier for consistency (add configuration as needed).

### Adding routes

1. Create a controller in `controllers/`.
2. Add routes in `routes/`.
3. Import and use routes in `app.js`.

### Models

Sequelize models are in `models/`. Add new models as needed and sync via `npm run db:reset` or migrations.

## License

ISC
