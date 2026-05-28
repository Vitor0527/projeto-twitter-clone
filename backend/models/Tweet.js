const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tweet = sequelize.define('Tweet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  retweets: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  }
}, {
  tableName: 'tweets',
  timestamps: true
});

module.exports = Tweet;
