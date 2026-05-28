/**
 * Recria as tabelas do Sequelize (apaga dados existentes).
 * Usar quando o schema antigo não coincide com os models.
 *
 *   node scripts/reset-database.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { sequelize } = require('../config/database');
require('../models');

async function reset() {
  try {
    await sequelize.authenticate();
    console.log(`Conectado a ${process.env.DB_NAME}@${process.env.DB_HOST}`);

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

  const [existing] = await sequelize.query('SHOW TABLES');
  const key = Object.keys(existing[0] || {})[0] || 'Tables_in_twitter_projeto';

  for (const row of existing) {
    const table = row[key];
    await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
    console.log(`Removida: ${table}`);
  }

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  await sequelize.sync({ force: true });
  console.log('Tabelas criadas com sucesso.');

  const [rows] = await sequelize.query('SHOW TABLES');
  console.log('Tabelas atuais:', rows);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

reset();
