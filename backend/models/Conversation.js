const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define(
  'Conversation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userOneId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userTwoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'conversations',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userOneId', 'userTwoId'] }],
  },
);

module.exports = Conversation;
