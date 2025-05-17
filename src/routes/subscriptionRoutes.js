const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.get('/', subscriptionController.getSubscriptions);
router.post('/:id/price', subscriptionController.updateSubscriptionPrice);
router.post('/', subscriptionController.createSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;