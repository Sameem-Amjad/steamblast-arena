const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    unique: true,
  },
  stripePriceId: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete'),
    defaultValue: 'active',
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  plan: {
    type: DataTypes.ENUM('premium', 'class', 'school'),
    defaultValue: 'premium',
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
});

module.exports = Subscription;
