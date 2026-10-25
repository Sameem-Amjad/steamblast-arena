const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserShopItem = sequelize.define('UserShopItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  shopItemId: { type: DataTypes.UUID, allowNull: false },
  purchasedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'user_shop_items',
  timestamps: false,
});

module.exports = UserShopItem;
