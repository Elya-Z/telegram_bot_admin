const pool = require('../config/db');

class UserController {
    async getUsers(req, res) {
        try {
            console.log('Попытка получить пользователей из БД...');

            const query = `
                SELECT 
                    u.id, 
                    u.balance, 
                    u.ice, 
                    u.status
                FROM test.users u
                
            `;

            const { rows } = await pool.query(query);
            console.log(`Получено ${rows.length} пользователей`);

            const users = rows.map(row => ({
                id: row.id,
                balance: parseFloat(row.balance),
                ice: parseFloat(row.ice),
                status: row.status,
                status_text: row.status === 1 ? 'Активен' : 'Заблокирован'
            }));
            res.json(users);


        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({
                error: 'Failed to fetch users',
                details: error.message  // Добавляем детали ошибки
            });
        }
    }

    /**
     * Заблокировать пользователя
     */
    async blockUser(req, res) {
        const userId = parseInt(req.params.id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        try {
            const { rows } = await pool.query(
                'UPDATE test.users SET status = 0 WHERE id = $1 RETURNING id, status',
                [userId]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                message: `User ${userId} blocked successfully`,
                userId,
                newStatus: 0
            });

        } catch (error) {
            console.error('Error blocking user:', error);
            res.status(500).json({
                error: 'Failed to block user',
                details: error.message
            });
        }
    }

    /**
     * Разблокировать пользователя
     */
    async unblockUser(req, res) {
        const userId = parseInt(req.params.id);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        try {
            const { rows } = await pool.query(
                'UPDATE test.users SET status = 1 WHERE id = $1 RETURNING id, status',
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                message: `User ${userId} unblocked successfully`,
                userId,
                newStatus: 1
            });

        } catch (error) {
            console.error('Error unblocking user:', error);
            res.status(500).json({
                error: 'Failed to unblock user',
                details: error.message
            });
        }
    }

    /**
     * Обновить баланс пользователя
     */
    async updateBalance(req, res) {
        const userId = parseInt(req.params.id);
        const { amount, currency = 'RUB' } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        try {
            // Проверяем существует ли пользователь
            const userCheck = await pool.query(
                'SELECT id, balance FROM test.users WHERE id = $1',
                [userId]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Обновляем баланс
            const newBalance = parseFloat(userCheck.rows[0].balance) + parseFloat(amount);

            await pool.query(
                'UPDATE test.users SET balance = $1 WHERE id = $2',
                [newBalance, userId]
            );

            logAction('ADMIN', 'Balance updated', {
                userId,
                amount,
                currency,
                newBalance
            });

            res.json({
                success: true,
                newBalance,
                message: `Balance for user ${userId} updated successfully`
            });
        } catch (error) {
            console.error('Error updating balance:', error);
            logAction('SYSTEM', 'Error updating balance', {
                userId,
                error: error.message
            });
            res.status(500).json({
                error: 'Failed to update balance',
                details: error.message
            });
        }
    }
}

module.exports = new UserController();  