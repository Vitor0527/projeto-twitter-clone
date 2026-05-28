require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const {
  getPublicUrl,
  getDevFrontendUrl,
  getFrontendDistPath,
  isProduction,
} = require('./config/publicUrl');

const publicUrl = getPublicUrl();
const swaggerSpec = {
  ...swaggerDocument,
  servers: [{ url: publicUrl, description: isProduction() ? 'Production' : 'Local' }],
};
const frontendDist = getFrontendDistPath();
const serveSpa = fs.existsSync(path.join(frontendDist, 'index.html'));

// Criar app
const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROTAS =====
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tweetRoutes = require('./routes/tweetRoutes');
const commentRoutes = require('./routes/commentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const followRoutes = require('./routes/followRoutes');
const likeRoutes = require('./routes/likeRoutes');
const retweetRoutes = require('./routes/retweetRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Raiz — JSON só quando o frontend não está compilado (ex.: dev só com API)
if (!serveSpa) {
  const frontendBase = isProduction() ? publicUrl : getDevFrontendUrl();
  app.get('/', (req, res) => {
    res.json({
      message: isProduction()
        ? 'API em execução. O frontend ainda não foi compilado neste deploy.'
        : 'API VG em execução. A aplicacao web corre no Vite (dev).',
      server: publicUrl,
      frontend: frontendBase,
      admin: `${frontendBase}/admin`,
      apiDocs: `${publicUrl}/api-docs`,
      health: `${publicUrl}/api/health`,
    });
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', url: publicUrl });
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Registar rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', followRoutes);
app.use('/api/tweets', likeRoutes);
app.use('/api/tweets', retweetRoutes);
app.use('/api/chat', chatRoutes);

// Frontend (produção / Render) — mesma origem que a API
if (serveSpa) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/api-docs|\/uploads).*/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ===== ERROR HANDLING =====
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
