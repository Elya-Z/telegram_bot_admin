const pool = require('../config/db');

class SubscriptionRepository {
    async getAllSubscriptions() {
        try {
            const { rows } = await pool.query(`
                SELECT sub_id, name, price 
                FROM test.sub
            `);
            return rows;
        } catch (error) {
            console.error('Ошибка запроса подписок:', error);
            throw error;
        }
    }

    async updateSubscriptionPrice(subId, price) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                UPDATE test.sub 
                SET price = $1
                WHERE sub_id = $2
                RETURNING *
            `;

            const values = [
                JSON.stringify(price),
                subId
            ];

            const { rows } = await client.query(query, values);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async createSubscription(name, price) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO test.sub (name, price, channels, collaboration, visible)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const values = [
                name,
                JSON.stringify(price),
                JSON.stringify([]),
                JSON.stringify({}),
                true
            ];

            const { rows } = await client.query(query, values);
            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteSubscription(subId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                DELETE FROM test.sub
                WHERE sub_id = $1
                RETURNING sub_id, name
            `;

            const { rows } = await client.query(query, [subId]);
            if (rows.length === 0) {
                console.error('[REPO] No subscription found with subId:', subId);
                throw new Error(`Подписка с ID ${subId} не найдена`);
            }
            await client.query('COMMIT');

            const deletedSubscription = rows[0];
            return deletedSubscription;
        } catch (error) {
            console.error('[REPO] Error:', {
                message: error.message,
                stack: error.stack
            });
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new SubscriptionRepository();