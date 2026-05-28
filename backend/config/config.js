// Configurações gerais da aplicação

module.exports = {
  // Upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    folder: process.env.UPLOAD_FOLDER || './uploads'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION || '24h'
  },

  // API
  api: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'projeto_db',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql'
  }
};
