#!/usr/bin/env node

/**
 * Script de Verificação do Backend
 * Uso: node verify-setup.js
 * 
 * Verifica se tudo está configurado corretamente
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║               VERIFICAÇÃO DO BACKEND - SETUP                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const checks = [
  {
    name: 'Node.js',
    check: () => {
      const version = process.version;
      console.log(`  ✅ Node.js ${version}`);
      return true;
    }
  },
  {
    name: 'Ficheiro package.json',
    check: () => fs.existsSync('package.json')
  },
  {
    name: 'Pasta node_modules',
    check: () => fs.existsSync('node_modules')
  },
  {
    name: 'Ficheiro .env',
    check: () => fs.existsSync('.env')
  },
  {
    name: 'Ficheiro app.js',
    check: () => fs.existsSync('app.js')
  },
  {
    name: 'Pasta models',
    check: () => fs.existsSync('models')
  },
  {
    name: 'Pasta controllers',
    check: () => fs.existsSync('controllers')
  },
  {
    name: 'Pasta routes',
    check: () => fs.existsSync('routes')
  },
  {
    name: 'Pasta middlewares',
    check: () => fs.existsSync('middlewares')
  },
  {
    name: 'Pasta config',
    check: () => fs.existsSync('config')
  },
  {
    name: 'Pasta uploads',
    check: () => {
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
      }
      return true;
    }
  }
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    const result = check();
    if (result === undefined) {
      // Se check for função customizada que faz console.log
      passed++;
    } else if (result) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name} - NÃO ENCONTRADO`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ ${name} - ERRO: ${error.message}`);
    failed++;
  }
});

console.log('\n📊 Resultado:');
console.log(`  Passou: ${passed}/${checks.length}`);
console.log(`  Falhou: ${failed}/${checks.length}`);

if (failed === 0) {
  console.log('\n✅ Setup verificado com sucesso!');
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Verifica as credenciais em .env');
  console.log('   2. Cria a base de dados: CREATE DATABASE projeto_db;');
  console.log('   3. Inicia o servidor: npm run dev');
  process.exit(0);
} else {
  console.log('\n❌ Há problemas com o setup!');
  console.log('\n💡 Soluções:');
  console.log('   1. Executa: npm install');
  console.log('   2. Verifica o diretório de trabalho');
  console.log('   3. Ver README.md para mais detalhes');
  process.exit(1);
}
