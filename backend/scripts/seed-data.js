// Scripts de inicialização úteis

/**
 * Exemplo de seed data - adicionar dados de teste
 * 
 * Uso: node scripts/seed-data.js
 */

const { User, Tweet, Comment, Profile } = require('../models');
const { hashPassword } = require('../utils/passwordUtils');

const seedData = async () => {
  try {
    console.log('🌱 A semear dados de teste...');

    // Limpar dados anteriores (opcional)
    // await User.destroy({ where: {}, truncate: true });

    // Criar utilizadores de teste
    const users = await User.bulkCreate([
      {
        name: 'João Silva',
        email: 'joao@example.com',
        password: await hashPassword('password123'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=João'
      },
      {
        name: 'Maria Santos',
        email: 'maria@example.com',
        password: await hashPassword('password123'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
      },
      {
        name: 'Carlos Oliveira',
        email: 'carlos@example.com',
        password: await hashPassword('password123'),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'
      }
    ]);

    // Criar profiles para cada utilizador
    for (const user of users) {
      await Profile.create({
        userId: user.id,
        bio: `Olá, sou ${user.name}!`,
        location: 'Portugal',
        website: 'https://example.com'
      });
    }

    // Criar tweets de exemplo
    const tweets = await Tweet.bulkCreate([
      {
        content: '🎉 Olá mundo! Este é o meu primeiro tweet!',
        userId: users[0].id
      },
      {
        content: 'Adorei este novo projeto de Twitter! #awesome',
        userId: users[1].id
      },
      {
        content: 'Alguém quer aprender Node.js comigo? 👨‍💻',
        userId: users[2].id
      }
    ]);

    // Criar comentários de exemplo
    await Comment.bulkCreate([
      {
        content: 'Que legal! Bem-vindo! 👋',
        userId: users[1].id,
        tweetId: tweets[0].id
      },
      {
        content: 'Eu quero! Tens algum recurso recomendado?',
        userId: users[0].id,
        tweetId: tweets[2].id
      }
    ]);

    console.log('✅ Dados de teste criados com sucesso!');
    console.log('\nCredenciais de teste:');
    console.log('Email: joao@example.com | Password: password123');
    console.log('Email: maria@example.com | Password: password123');
    console.log('Email: carlos@example.com | Password: password123');

  } catch (error) {
    console.error('❌ Erro ao semear dados:', error);
  } finally {
    process.exit(0);
  }
};

seedData();
