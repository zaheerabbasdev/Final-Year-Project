const Wallet = require('../models/walletModel');

/**
 * GET /api/wallet
 * Returns the authenticated user's wallet balance + last 5 transactions.
 */
const getWallet = async (req, res) => {
    try {
        const wallet = await Wallet.getOrCreate(req.user.id);
        const recentTransactions = await Wallet.getTransactions(req.user.id, 5, 0);

        // Escrow only applies to customers — providers always see 0
        let escrowBalance = 0;
        if (req.user.role === 'customer') {
            escrowBalance = await Wallet.getCustomerEscrow(req.user.id);
        }

        res.json({
            balance: parseFloat(wallet.balance),
            escrow_balance: escrowBalance,
            recent_transactions: recentTransactions,
        });
    } catch (error) {
        console.error('getWallet error:', error);
        res.status(500).json({ message: 'Error fetching wallet' });
    }
};

/**
 * GET /api/wallet/transactions?limit=20&offset=0
 * Returns paginated transaction history.
 */
const getTransactions = async (req, res) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
        const offset = parseInt(req.query.offset) || 0;
        const [transactions, total] = await Promise.all([
            Wallet.getTransactions(req.user.id, limit, offset),
            Wallet.getTransactionCount(req.user.id),
        ]);
        res.json({ transactions, total, limit, offset });
    } catch (error) {
        console.error('getTransactions error:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

/**
 * POST /api/wallet/topup  { amount }
 * Simulated top-up (in production: hook into JazzCash / EasyPaisa callback).
 */
const topUp = async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }
        if (amount < 100) {
            return res.status(400).json({ message: 'Minimum top-up is PKR 100' });
        }
        if (amount > 50000) {
            return res.status(400).json({ message: 'Maximum top-up is PKR 50,000 per transaction' });
        }

        const result = await Wallet.credit(
            req.user.id,
            amount,
            `Wallet top-up — PKR ${amount.toLocaleString()}`,
            'topup'
        );

        res.json({
            message: 'Wallet topped up successfully',
            new_balance: result.newBalance,
            amount_added: amount,
        });
    } catch (error) {
        console.error('topUp error:', error);
        res.status(500).json({ message: 'Error processing top-up' });
    }
};

/**
 * POST /api/wallet/withdraw  { amount, method?, account_details? }
 * Simulated withdrawal request.
 */
const withdraw = async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);
        const method = req.body.method || 'bank_transfer';

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }
        if (amount < 500) {
            return res.status(400).json({ message: 'Minimum withdrawal is PKR 500' });
        }

        const result = await Wallet.debit(
            req.user.id,
            amount,
            `Withdrawal — PKR ${amount.toLocaleString()} via ${method}`,
            'withdrawal'
        );

        res.json({
            message: 'Withdrawal request submitted successfully',
            new_balance: result.newBalance,
            amount_withdrawn: amount,
        });
    } catch (error) {
        if (error.message === 'Insufficient wallet balance') {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        console.error('withdraw error:', error);
        res.status(500).json({ message: 'Error processing withdrawal' });
    }
};

module.exports = { getWallet, getTransactions, topUp, withdraw };
