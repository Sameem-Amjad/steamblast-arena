'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      stripeSubscriptionId: { type: Sequelize.STRING, unique: true },
      stripePriceId: { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete'), defaultValue: 'active' },
      currentPeriodStart: { type: Sequelize.DATE },
      currentPeriodEnd: { type: Sequelize.DATE },
      cancelAtPeriodEnd: { type: Sequelize.BOOLEAN, defaultValue: false },
      plan: { type: Sequelize.ENUM('premium', 'class', 'school'), defaultValue: 'premium' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('shop_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      category: { type: Sequelize.ENUM('hat', 'outfit', 'water_skin', 'steam_effect', 'victory_dance'), allowNull: false },
      coinPrice: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 100 },
      assetKey: { type: Sequelize.STRING, allowNull: false },
      previewUrl: { type: Sequelize.STRING },
      rarity: { type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'), defaultValue: 'common' },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      weeklyRotationDate: { type: Sequelize.DATEONLY, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('user_shop_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      shopItemId: { type: Sequelize.UUID, allowNull: false, references: { model: 'shop_items', key: 'id' } },
      purchasedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('user_shop_items');
    await queryInterface.dropTable('shop_items');
    await queryInterface.dropTable('subscriptions');
  },
};
