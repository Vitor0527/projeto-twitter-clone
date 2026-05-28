/**
 * Garante que existe uma conta administrador (por defeito admin / admin123).
 * Chamado no arranque do servidor.
 */
const { User, Profile } = require('../models');
const { hashPassword } = require('../utils/passwordUtils');

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const email = process.env.ADMIN_EMAIL || 'admin@vg.local';
  const name = process.env.ADMIN_NAME || 'Administrador';

  let user = await User.findOne({
    where: { username },
  });

  if (!user) {
    user = await User.create({
      name,
      username,
      email,
      password: await hashPassword(password),
      role: 'admin',
    });
    await Profile.create({
      userId: user.id,
      bio: 'Administrador da plataforma VG.',
    });
    console.log(`✅ Conta admin criada — login: ${username} / ${password}`);
    return;
  }

  if (user.role !== 'admin') {
    await user.update({ role: 'admin' });
    console.log(`✅ Utilizador "${username}" promovido a administrador`);
  }
}

module.exports = { ensureDefaultAdmin };
