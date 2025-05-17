const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

router.get('/', backupController.getBackups);
router.post('/create', backupController.createBackup);
router.get('/download/:filename', backupController.downloadBackup);
router.delete('/:id', backupController.deleteBackup);

module.exports = router;