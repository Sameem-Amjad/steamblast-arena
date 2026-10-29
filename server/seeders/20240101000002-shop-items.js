'use strict';
const { v4: uuidv4 } = require('uuid');
const shopItems = require('./data/shop-items');

const now = new Date();
const items = shopItems.map((item) => ({ id: uuidv4(), ...item, createdAt: now, updatedAt: now }));

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('shop_items', items);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('shop_items', {});
  },
};
