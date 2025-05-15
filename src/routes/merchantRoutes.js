const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');

router.get('/', merchantController.getMerchants);
router.post('/', merchantController.addMerchant);
router.put('/:id', merchantController.updateMerchant);
router.delete('/:id', merchantController.deleteMerchant);

module.exports = router;