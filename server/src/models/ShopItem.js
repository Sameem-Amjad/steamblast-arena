const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShopItem = sequelize.define('ShopItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.ENUM('hat', 'outfit', 'water_skin', 'steam_effect', 'victory_dance'),
    allowNull: false,
  },
  coinPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
  },
  assetKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  previewUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    defaultValue: 'common',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  weeklyRotationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'shop_items',
  timestamps: true,
});

module.exports = ShopItem;
