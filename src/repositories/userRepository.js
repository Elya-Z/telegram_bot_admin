const { pool } = require('../config/db');

class UserRepository {
    async getAllUsers() {
        const query = `
      SELECT u.id, u.balance, u.ice, u.status, 
             m.merchant_name as merchant
      FROM test.users u
      LEFT JOIN test.merchant m ON u.id = m.id
    `;
        const { rows } = await pool.query(query);
        return rows;
    }

    async blockUser(userId) {
        const query = 'UPDATE test.users SET status = 0 WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [userId]);
        return rows[0];
    }

    async unblockUser(userId) {
        const query = 'UPDATE test.users SET status = 1 WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [userId]);
        return rows[0];
    }
}

module.exports = new UserRepository();