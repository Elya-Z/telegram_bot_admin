const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers);
router.post('/block/:id', userController.blockUser);
router.post('/unblock/:id', userController.unblockUser);
router.post('/update-balance', userController.updateBalance);

module.exports = router;