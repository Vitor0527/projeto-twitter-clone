require('dotenv').config();
const { getPublicUrl } = require('./config/publicUrl');

const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const outputFile = './swagger.json';
const endpointsFiles = ['./app.js'];

const doc = {
  info: {
    title: 'Projeto API',
    description: 'API REST do projeto (Express + Sequelize).',
  },
  servers: [
    { url: getPublicUrl(), description: 'API' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, doc);

