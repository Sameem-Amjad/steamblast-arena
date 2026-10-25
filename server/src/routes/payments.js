const express = require('express');
const stripe = require('stripe');
const env = require('../config/env');
const { User, Subscription } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const stripeClient = env.STRIPE_SECRET_KEY ? stripe(env.STRIPE_SECRET_KEY) : null;

router.post('/create-checkout-session', authenticate, async (req, res) => {
  if (!stripeClient) return res.status(503).json({ error: 'Payments not configured.' });
  try {
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: req.user.email,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      await req.user.update({ stripeCustomerId: customerId });
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: env.STRIPE_PRICE_ID_PREMIUM, quantity: 1 }],
      success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.CLIENT_URL}/payment/cancel`,
      metadata: { userId: req.user.id },
    });

    res.json({ sessionUrl: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cancel-subscription', authenticate, async (req, res) => {
  if (!stripeClient) return res.status(503).json({ error: 'Payments not configured.' });
  try {
    const subscription = await Subscription.findOne({ where: { userId: req.user.id, status: 'active' } });
    if (!subscription) return res.status(404).json({ error: 'No active subscription found.' });

    await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await subscription.update({ cancelAtPeriodEnd: true });

    res.json({ message: 'Subscription will cancel at end of billing period.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscription', authenticate, async (req, res) => {
  const subscription = await Subscription.findOne({ where: { userId: req.user.id } });
  res.json({ subscription: subscription || null });
});

// Stripe webhook
router.post('/webhook', async (req, res) => {
  if (!stripeClient) return res.sendStatus(200);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const stripeSubscription = await stripeClient.subscriptions.retrieve(session.subscription);
        await Subscription.upsert({
          userId,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0].price.id,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          plan: 'premium',
        });
        await User.update({ isPremium: true }, { where: { id: userId } });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const dbSub = await Subscription.findOne({ where: { stripeSubscriptionId: sub.id } });
        if (dbSub) {
          await dbSub.update({
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
          if (sub.status !== 'active') {
            await User.update({ isPremium: false }, { where: { id: dbSub.userId } });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const dbSub = await Subscription.findOne({ where: { stripeSubscriptionId: sub.id } });
        if (dbSub) {
          await dbSub.update({ status: 'canceled' });
          await User.update({ isPremium: false }, { where: { id: dbSub.userId } });
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
