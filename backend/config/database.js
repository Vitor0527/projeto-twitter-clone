const { Sequelize } = require('sequelize');
const fs = require('fs');
require('dotenv').config();

function createSequelize() {
  if (process.env.DATABASE_URL) {
    const isMysql =
      process.env.DATABASE_URL.startsWith('mysql') ||
      process.env.DB_DIALECT === 'mysql';

    const useSsl =
      process.env.DB_SSL === 'true' ||
      (process.env.DB_SSL_MODE && process.env.DB_SSL_MODE.toUpperCase() === 'REQUIRED');

    let dialectOptions = {};

    if (useSsl) {
      const rejectUnauthorized = process.env.DB_REJECT_UNAUTHORIZED !== 'false';
      const ssl = { rejectUnauthorized };

      if (process.env.DB_SSL_CA_PATH) {
        ssl.ca = fs.readFileSync(process.env.DB_SSL_CA_PATH);
      } else if (process.env.DB_SSL_CA) {
        ssl.ca = Buffer.from(process.env.DB_SSL_CA, 'base64');
      }

      dialectOptions = { ssl };
    }

    return new Sequelize(process.env.DATABASE_URL, {
      dialect: isMysql ? 'mysql' : 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions,
    });
  }

  return new Sequelize(
    process.env.DB_NAME || 'projeto_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'password',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    },
  );
}

const sequelize = createSequelize();

module.exports = { sequelize };
