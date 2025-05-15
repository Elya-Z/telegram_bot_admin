const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.get('/', subscriptionController.getSubscriptions);
router.post('/:id/price', subscriptionController.updateSubscriptionPrice);

module.exports = router;