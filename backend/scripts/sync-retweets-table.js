require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../config/database');
const { Retweet } = require('../models');

async function sync() {
  try {
    await sequelize.authenticate();
    await Retweet.sync();
    console.log('Tabela retweets criada/sincronizada.');
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

sync();
