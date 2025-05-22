const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getTransactions);
router.post('/', paymentController.createTransaction);
router.get('/:transactionId/status', paymentController.checkPaymentStatus);
router.post('/:transactionId/confirm', paymentController.confirmPayment);
router.post('/:transactionId/cancel', paymentController.cancelPayment);

module.exports = router;