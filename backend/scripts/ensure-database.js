/**
 * Cria a base de dados MySQL se ainda nao existir (usa credenciais do .env).
 *   node scripts/ensure-database.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

async function ensureDatabase() {
  const dbName = process.env.DB_NAME || 'twitter_projeto';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`Base de dados "${dbName}" pronta.`);
  await connection.end();
}

ensureDatabase().catch((err) => {
  console.error('Erro ao criar base de dados:', err.message);
  console.error('Verifica se o MySQL esta a correr e se backend/.env esta correto.');
  process.exit(1);
});
