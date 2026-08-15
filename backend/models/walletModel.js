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
     * Lock funds from customer wallet into escrow when a bid is accepted.
     * Deducts from customer balance and stores the amount on the booking row.
     */
    holdEscrow: async (customerId, amount, bookingId, jobTitle) => {
        const escrowAmount = parseFloat(amount);
        // Deduct from customer wallet
        const result = await Wallet.debit(
            customerId,
            escrowAmount,
            `Payment held in escrow — "${jobTitle}"`,
            'payment',
            bookingId
        );
        // Record escrow amount on the booking
        await db.execute('UPDATE bookings SET escrow_amount = ? WHERE id = ?', [escrowAmount, bookingId]);
        return result;
    },

    /**
     * Release escrow to provider when job is confirmed complete.
     * Credits provider wallet and clears the booking's escrow_amount.
     */
    releaseEscrow: async (bookingId) => {
        const [rows] = await db.execute(
            `SELECT b.escrow_amount, b.provider_id, b.customer_id, j.title
             FROM bookings b
             JOIN jobs j ON j.id = b.job_id
             WHERE b.id = ?`,
            [bookingId]
        );
        if (rows.length === 0) throw new Error('Booking not found');
        const { escrow_amount, provider_id, title } = rows[0];
        const amount = parseFloat(escrow_amount);
        if (amount <= 0) return null; // nothing held — no-op

        // Credit provider
        const result = await Wallet.credit(
            provider_id,
            amount,
            `Earnings released — "${title}"`,
            'earning',
            bookingId
        );
        // Clear escrow on booking
        await db.execute('UPDATE bookings SET escrow_amount = 0 WHERE id = ?', [bookingId]);
        return result;
    },

    /**
     * Refund escrow back to customer when booking is cancelled.
     * Credits customer wallet and clears the booking's escrow_amount.
     */
    refundEscrow: async (bookingId) => {
        const [rows] = await db.execute(
            `SELECT b.escrow_amount, b.customer_id, j.title
             FROM bookings b
             JOIN jobs j ON j.id = b.job_id
             WHERE b.id = ?`,
            [bookingId]
        );
        if (rows.length === 0) throw new Error('Booking not found');
        const { escrow_amount, customer_id, title } = rows[0];
        const amount = parseFloat(escrow_amount);
        if (amount <= 0) return null; // nothing to refund

        // Refund customer
        const result = await Wallet.credit(
            customer_id,
            amount,
            `Refund — booking cancelled for "${title}"`,
            'refund',
            bookingId
        );
        // Clear escrow on booking
        await db.execute('UPDATE bookings SET escrow_amount = 0 WHERE id = ?', [bookingId]);
        return result;
    },

    /**
     * Total amount currently locked in escrow for a customer
     * (sum of all active bookings with escrow held).
     */
    getCustomerEscrow: async (customerId) => {
        const [[row]] = await db.execute(
            `SELECT COALESCE(SUM(escrow_amount), 0) AS total
             FROM bookings
             WHERE customer_id = ?
               AND status IN ('confirmed', 'in_progress', 'awaiting_confirmation')
               AND escrow_amount > 0`,
            [customerId]
        );
        return parseFloat(row.total);
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
