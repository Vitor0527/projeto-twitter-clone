const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Retweet = sequelize.define(
  'Retweet',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tweetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'retweets',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'tweetId'] }],
  },
);

module.exports = Retweet;
