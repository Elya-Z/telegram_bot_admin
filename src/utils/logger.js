const pool = require('../config/db');

module.exports = {
    logAction: async (actor, action, details = {}) => {
        try {
            await pool.query(
                'INSERT INTO test.admin_logs (actor, action, details) VALUES ($1, $2, $3)',
                [actor, action, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('Logging error:', error);
        }
    }
};