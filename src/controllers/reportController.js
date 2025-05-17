const pool = require('../config/db');
const XLSX = require('xlsx');

exports.generateUserReportExcel = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, balance, ice, status 
            FROM test.users
        `);

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Нет пользователей для формирования отчета' });
        }

        const totalUsers = result.rows.length;
        const activeUsers = result.rows.filter(u => u.status === 1).length;
        const blockedUsers = totalUsers - activeUsers;
        const totalBalance = result.rows.reduce((sum, user) => sum + parseFloat(user.balance), 0);
        const averageBalance = totalBalance / totalUsers;

        const users = result.rows.map(u => ({
            ID: u.id,
            Баланс: parseFloat(u.balance),
            ICE: parseFloat(u.ice),
            Статус: u.status === 1 ? 'Активен' : 'Заблокирован'
        }));

        const summary = [
            ['Метрика', 'Значение'],
            ['Общее число пользователей', totalUsers],
            ['Активные пользователи', activeUsers],
            ['Заблокированные пользователи', blockedUsers],
            ['Общий баланс', `${totalBalance.toFixed(2)} RUB`],
            ['Средний баланс', `${averageBalance.toFixed(2)} RUB`]
        ];

        const wb = XLSX.utils.book_new();

        const ws1 = XLSX.utils.json_to_sheet(users);
        XLSX.utils.book_append_sheet(wb, ws1, 'Пользователи');

        const ws2 = XLSX.utils.aoa_to_sheet(summary);
        XLSX.utils.book_append_sheet(wb, ws2, 'Сводка');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=FinanceReport.xlsx');

        res.send(excelBuffer);

    } catch (error) {
        console.error('Ошибка при формировании отчета:', error);
        res.status(500).json({ error: 'Не удалось сформировать отчет' });
    }
};