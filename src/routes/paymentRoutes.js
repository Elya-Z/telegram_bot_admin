const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Get all transactions
router.get('/', paymentController.getTransactions);

// Create new transaction
router.post('/', paymentController.createTransaction);

// Check payment status
router.get('/:transactionId/status', paymentController.checkPaymentStatus);

// Confirm payment manually
router.post('/:transactionId/confirm', paymentController.confirmPayment);

// Cancel payment
router.post('/:transactionId/cancel', paymentController.cancelPayment);

module.exports = router;