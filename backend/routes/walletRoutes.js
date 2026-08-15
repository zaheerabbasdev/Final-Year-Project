const express = require('express');
const router = express.Router();
const { getWallet, getTransactions, topUp, withdraw } = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/auth');

router.get('/',               authMiddleware, getWallet);
router.get('/transactions',   authMiddleware, getTransactions);
router.post('/topup',         authMiddleware, topUp);
router.post('/withdraw',      authMiddleware, withdraw);

module.exports = router;
