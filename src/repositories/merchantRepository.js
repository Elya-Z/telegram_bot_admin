const pool = require('../config/db');

class MerchantRepository {
    async getAllMerchants() {
        try {
            const result = await pool.query(`
                SELECT id, merchant_name AS name 
                FROM test.merchant
            `);
            return result.rows;
        } catch (error) {
            console.error('Ошибка при получении мерчантов:', error);
            throw new Error('Не удалось загрузить мерчантов');
        }
    }

    async addMerchant({ merchant_name }) {
        const client = await pool.connect();
        console.log("Подключение к БД получено");

        try {
            console.log("Начало транзакции");
            await client.query('BEGIN');

            console.log("Выполнение INSERT запроса");
            const res = await client.query(
                `INSERT INTO test.merchant (merchant_name) 
                 VALUES ($1) 
                 RETURNING id, merchant_name`,
                [merchant_name]
            );

            await client.query('COMMIT');
            console.log("Транзакция завершена успешно");
            return res.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Ошибка в транзакции:", {
                message: error.message,
                query: error.query,
                stack: error.stack
            });
            throw error;
        } finally {
            client.release();
            console.log("Подключение к БД освобождено");
        }
    }

    async updateMerchant(merchantId, merchantName) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(
                'UPDATE test.merchant SET merchant_name = $1 WHERE id = $2 RETURNING *',
                [merchantName, merchantId]
            );

            await client.query('COMMIT');

            if (result.rows.length === 0) {
                throw new Error('Мерчант не найден');
            }

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Ошибка при обновлении мерчанта:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteMerchant(merchantId) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM test.merchant WHERE id = $1', [merchantId]);
            await client.query('DELETE FROM test.users WHERE id = $1', [merchantId]);
            await client.query('COMMIT');
            return { success: true };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Ошибка при удалении мерчанта:', error);
            throw new Error('Не удалось удалить мерчанта');
        } finally {
            client.release();
        }
    }
}

module.exports = new MerchantRepository();