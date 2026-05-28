require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  try {
    const hasDbUser = !!process.env.DB_USER && process.env.DB_USER.length > 0;
    const useUrl = !hasDbUser && !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;

    if (hasDbUser) console.log('Using explicit DB_* env vars');
    else if (useUrl) console.log('Using DATABASE_URL from env');

    const config = hasDbUser
      ? {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT || 3306),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        }
      : useUrl
      ? undefined
      : {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT || 3306),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        };

    // add ssl ca if available
    if (process.env.DB_SSL_CA_PATH && fs.existsSync(process.env.DB_SSL_CA_PATH)) {
      const ca = fs.readFileSync(process.env.DB_SSL_CA_PATH);
      if (config) config.ssl = { ca };
      else console.log('DATABASE_URL used; ensure SSL params are in the URL or driver will use default.');
    }

    const conn = await mysql.createConnection(config || process.env.DATABASE_URL);
    console.log('OK: connected to database');
    await conn.end();
  } catch (err) {
    console.error('Connection error:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
