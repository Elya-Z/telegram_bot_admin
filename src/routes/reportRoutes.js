const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/reports/users/excel', reportController.generateUserReportExcel);

module.exports = router;