const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/', salaryController.getSalaryDays);
router.post('/:userId', salaryController.updateSalaryDay);

module.exports = router;