const pool = require('../config/db');

class UserController {
    async getUsers(req, res) {
        try {
            const { status } = req.query;
            let query = `
                SELECT id, balance, ice, status 
                FROM test.users
            `;

            if (status === '1') {
                query += ` WHERE status = 1`;
            } else if (status === '0') {
                query += ` WHERE status = 0`;
            }

            const result = await pool.query(query);

            if (!result.rows.length) {
                return res.status(404).json({ error: 'Пользователи не найдены' });
            }

            res.json(result.rows.map(u => ({
                id: u.id,
                balance: parseFloat(u.balance),
                ice: parseFloat(u.ice),
                status: u.status
            })));
        } catch (error) {
            console.error('Ошибка при получении пользователей:', error);
            res.status(500).json({ error: 'Не удалось загрузить пользователей' });
        }
    }

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

    async updateBalance(req, res) {
        const { id, amount } = req.body;
        if (!id || !amount) {
            return res.status(400).json({ error: "ID пользователя и сумма обязательны" });
        }
        try {
            const user = await pool.query(
                'SELECT balance FROM test.users WHERE id = $1',
                [id]
            );

            if (user.rows.length === 0) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }
            const newBalance = parseFloat(amount);
            await pool.query(
                'UPDATE test.users SET balance = $1 WHERE id = $2',
                [newBalance, id]
            );
            res.json({
                success: true,
                newBalance,
                message: `Баланс для пользователя ${id} успешно обновлен`
            });
        } catch (error) {
            console.error('Ошибка при обновлении баланса:', error);
            res.status(500).json({ error: "Произошла ошибка при обновлении баланса" });
        }
    }
}

module.exports = new UserController();  