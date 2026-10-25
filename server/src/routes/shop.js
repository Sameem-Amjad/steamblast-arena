const express = require('express');
const { Op } = require('sequelize');
const { ShopItem, UserShopItem, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/items', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const items = await ShopItem.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { weeklyRotationDate: null },
          { weeklyRotationDate: { [Op.between]: [weekAgo, today] } },
        ],
      },
      order: [['category', 'ASC'], ['coinPrice', 'ASC']],
    });

    // Mark owned items
    const ownedItems = await UserShopItem.findAll({ where: { userId: req.user.id } });
    const ownedIds = new Set(ownedItems.map((ui) => ui.shopItemId));

    const itemsWithOwnership = items.map((item) => ({
      ...item.toJSON(),
      owned: ownedIds.has(item.id),
    }));

    res.json({ items: itemsWithOwnership, coins: req.user.coins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchase/:itemId', authenticate, async (req, res) => {
  try {
    if (!req.user.isPremium) {
      return res.status(403).json({ error: 'Shop access requires a premium subscription.' });
    }

    const item = await ShopItem.findByPk(req.params.itemId);
    if (!item || !item.isActive) return res.status(404).json({ error: 'Item not found.' });

    const alreadyOwned = await UserShopItem.findOne({
      where: { userId: req.user.id, shopItemId: item.id },
    });
    if (alreadyOwned) return res.status(409).json({ error: 'You already own this item.' });

    if (req.user.coins < item.coinPrice) {
      return res.status(402).json({ error: 'Insufficient coins.' });
    }

    await UserShopItem.create({ userId: req.user.id, shopItemId: item.id });
    await req.user.update({ coins: req.user.coins - item.coinPrice });

    res.json({ message: 'Item purchased!', coins: req.user.coins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
