const pool = require('../config/db');

class SalaryRepository {
    async getAllSalaryDays() {
        try {
            const { rows } = await pool.query(`
                SELECT id, salary_day, salary_props 
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

            const checkQuery = 'SELECT id FROM test.salary WHERE id = $1';
            const checkResult = await client.query(checkQuery, [userId]);

            let result;
            if (checkResult.rows.length > 0) {
                const updateQuery = `
                    UPDATE test.salary 
                    SET salary_day = $1 
                    WHERE id = $2 
                    RETURNING id, salary_day, salary_props
                `;
                result = await client.query(updateQuery, [day, userId]);
            } else {
                const insertQuery = `
                    INSERT INTO test.salary (id, salary_day, salary_props)
                    VALUES ($1, $2, $3)
                    RETURNING id, salary_day, salary_props
                `;
                result = await client.query(insertQuery, [
                    userId,
                    day,
                    '{}'
                ]);
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating salary day:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new SalaryRepository();