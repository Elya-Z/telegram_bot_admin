const pool = require('../config/db');

class SalaryRepository {
    async getAllSalaryDays() {
        try {
            const { rows } = await pool.query(`
                SELECT id, salary_day 
                FROM test.salary
                ORDER BY id
            `);
            return rows;
        } catch (error) {
            console.error('Error fetching salary days:', error);
            throw error;
        }
    }

    async updateSalaryDay(userId, day) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO test.salary_days (user_id, salary_day)
                VALUES ($1, $2)
                ON CONFLICT (user_id) 
                DO UPDATE SET salary_day = $2
                RETURNING user_id, salary_day
            `;

            const { rows } = await client.query(query, [userId, day]);

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

module.exports = new SalaryRepository();