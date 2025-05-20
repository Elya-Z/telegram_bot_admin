const pool = require('../config/db');

class TransactionRepository {
    async getAllTransactions() {
        try {
            const { rows } = await pool.query(`
                SELECT 
                    id,
                    admin_id,
                    amount,
                    tinkoff_payment_id,
                    status,
                    payment_url,
                    created_at,
                    updated_at
                FROM test.admin_transactions
                ORDER BY created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    }

    async createTransaction(adminId, amount) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(`
                INSERT INTO test.admin_transactions 
                (admin_id, amount, status, created_at, updated_at) 
                VALUES ($1, $2, $3, NOW(), NOW())
                RETURNING id, admin_id, amount, status, created_at
            `, [adminId, amount, 'NEW']);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating transaction:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async updateTransactionWithPaymentDetails(id, paymentId, paymentUrl) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(`
                UPDATE test.admin_transactions 
                SET tinkoff_payment_id = $1, payment_url = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING id, tinkoff_payment_id, payment_url, status
            `, [paymentId, paymentUrl, id]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating transaction:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async updateTransactionStatus(id, status) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(`
                UPDATE test.admin_transactions 
                SET status = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING id, status, updated_at
            `, [status, id]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating transaction status:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getTransactionById(id) {
        try {
            const { rows } = await pool.query(`
                SELECT 
                    id,
                    admin_id,
                    amount,
                    tinkoff_payment_id,
                    status,
                    payment_url,
                    created_at,
                    updated_at
                FROM test.admin_transactions
                WHERE id = $1
            `, [id]);

            return rows[0];
        } catch (error) {
            console.error('Error fetching transaction:', error);
            throw error;
        }
    }
}

module.exports = new TransactionRepository();