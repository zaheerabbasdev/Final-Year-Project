const db = require('../config/db');

const Wallet = {
    /**
     * Get wallet for a user, creating it if it doesn't exist.
     */
    getOrCreate: async (userId) => {
        const [rows] = await db.execute('SELECT * FROM wallets WHERE user_id = ?', [userId]);
        if (rows.length > 0) return rows[0];
        await db.execute('INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)', [userId]);
        const [newRows] = await db.execute('SELECT * FROM wallets WHERE user_id = ?', [userId]);
        return newRows[0];
    },

    /**
     * Add funds to a wallet and record the transaction.
     */
    credit: async (userId, amount, description, referenceType = 'topup', referenceId = null) => {
        const wallet = await Wallet.getOrCreate(userId);
        const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
        await db.execute('UPDATE wallets SET balance = ? WHERE user_id = ?', [newBalance, userId]);
        const [result] = await db.execute(
            `INSERT INTO wallet_transactions
             (user_id, type, amount, description, reference_type, reference_id, balance_after)
             VALUES (?, 'credit', ?, ?, ?, ?, ?)`,
            [userId, parseFloat(amount), description, referenceType, referenceId, newBalance]
        );
        return { newBalance, transactionId: result.insertId };
    },

    /**
     * Deduct funds from a wallet and record the transaction.
     * Throws if balance is insufficient.
     */
    debit: async (userId, amount, description, referenceType = 'payment', referenceId = null) => {
        const wallet = await Wallet.getOrCreate(userId);
        const current = parseFloat(wallet.balance);
        const deductAmount = parseFloat(amount);
        if (current < deductAmount) {
            throw new Error('Insufficient wallet balance');
        }
        const newBalance = current - deductAmount;
        await db.execute('UPDATE wallets SET balance = ? WHERE user_id = ?', [newBalance, userId]);
        const [result] = await db.execute(
            `INSERT INTO wallet_transactions
             (user_id, type, amount, description, reference_type, reference_id, balance_after)
             VALUES (?, 'debit', ?, ?, ?, ?, ?)`,
            [userId, deductAmount, description, referenceType, referenceId, newBalance]
        );
        return { newBalance, transactionId: result.insertId };
    },

    /**
     * Paginated transaction history for a user.
     */
    getTransactions: async (userId, limit = 20, offset = 0) => {
        const safeLimit  = parseInt(limit)  || 20;
        const safeOffset = parseInt(offset) || 0;
        const [rows] = await db.execute(
            `SELECT * FROM wallet_transactions
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ${safeLimit} OFFSET ${safeOffset}`,
            [userId]
        );
        return rows;
    },

    /**
     * Total transaction count (for pagination).
     */
    getTransactionCount: async (userId) => {
        const [[{ count }]] = await db.execute(
            'SELECT COUNT(*) AS count FROM wallet_transactions WHERE user_id = ?',
            [userId]
        );
        return parseInt(count);
    },
};

module.exports = Wallet;
