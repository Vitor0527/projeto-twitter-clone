const path = require('path');
const { Sequelize } = require('sequelize');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function shouldUseSsl(hostHint = '') {
  if (process.env.DB_SSL === 'true') return true;
  if (process.env.DB_SSL_MODE?.toUpperCase() === 'REQUIRED') return true;
  if (process.env.DB_SSL_MODE?.toUpperCase() === 'DISABLED') return false;

  const hint = hostHint || process.env.DB_HOST || '';
  return hint.includes('aivencloud.com');
}

function getDialectOptions(hostHint = '') {
  if (!shouldUseSsl(hostHint)) {
    return {};
  }

  const rejectUnauthorized = process.env.DB_REJECT_UNAUTHORIZED !== 'false';
  const ssl = { rejectUnauthorized };

  const caPath = process.env.DB_SSL_CA_PATH
    ? path.resolve(path.join(__dirname, '..'), process.env.DB_SSL_CA_PATH)
    : null;

  if (caPath && fs.existsSync(caPath)) {
    ssl.ca = fs.readFileSync(caPath);
  } else if (process.env.DB_SSL_CA) {
    ssl.ca = Buffer.from(process.env.DB_SSL_CA, 'base64');
  } else if (rejectUnauthorized) {
    // Managed DB on PaaS (e.g. Render) often has no ca.pem in the image
    ssl.rejectUnauthorized = false;
  }

  return { ssl };
}

function createSequelize() {
  if (process.env.DATABASE_URL) {
    const isMysql =
      process.env.DATABASE_URL.startsWith('mysql') ||
      process.env.DB_DIALECT === 'mysql';

    let hostHint = process.env.DB_HOST || '';
    try {
      hostHint = new URL(process.env.DATABASE_URL).hostname;
    } catch {
      // ignore invalid URL for host hint
    }

    return new Sequelize(process.env.DATABASE_URL, {
      dialect: isMysql ? 'mysql' : 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: getDialectOptions(hostHint),
    });
  }

  const host = process.env.DB_HOST || 'localhost';

  return new Sequelize(
    process.env.DB_NAME || 'projeto_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'password',
    {
      host,
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: getDialectOptions(host),
    },
  );
}

const sequelize = createSequelize();

module.exports = { sequelize };
