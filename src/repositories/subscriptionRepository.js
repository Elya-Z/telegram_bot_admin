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
}

module.exports = new SubscriptionRepository();