/**
 * Alarga colunas de imagens (avatar, coverImage) para TEXT.
 *   node scripts/migrate-media-columns.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE `users` MODIFY `avatar` TEXT NULL');
    await sequelize.query('ALTER TABLE `profiles` MODIFY `coverImage` TEXT NULL');
    console.log('Colunas avatar e coverImage atualizadas para TEXT.');
  } catch (err) {
    console.error('Erro na migracao:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
