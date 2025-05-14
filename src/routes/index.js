const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const merchantRoutes = require('./merchantRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const salaryRoutes = require('./salaryRoutes');

router.use('/users', userRoutes);
router.use('/merchants', merchantRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/salary', salaryRoutes);

module.exports = router;