const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// if (!exportController || !exportController.exportSubscriptionsToExcel) {
//     console.error('Контроллеры не найдены');
//     throw new Error('Необходимые контроллеры отсутствуют');
// }

router.get('/export/users', exportController.exportUsersToExcel);
router.get('/export/merchants', exportController.exportMerchantsToExcel);
// router.get('/export/subscriptions', exportController.exportSubscriptionsToExcel);

module.exports = router;