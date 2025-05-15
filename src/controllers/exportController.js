const pool = require('../config/db');
const XLSX = require('xlsx');

exports.exportUsersToExcel = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, balance, ice, status 
            FROM test.users
        `);

        const users = result.rows.map(u => ({
            ID: u.id,
            Баланс: parseFloat(u.balance),
            Ice: parseFloat(u.ice),
            Статус: u.status === 1 ? 'Активен' : 'Заблокирован'
        }));

        const worksheet = XLSX.utils.json_to_sheet(users);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Пользователи');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=Пользователи.xlsx');
        res.send(excelBuffer);

    } catch (error) {
        console.error('Ошибка при экспорте пользователей:', error);
        res.status(500).json({ error: 'Не удалось создать Excel-файл' });
    }
};

exports.exportMerchantsToExcel = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, merchant_name AS name 
            FROM test.merchant
        `);

        const merchants = result.rows.map(m => ({
            ID: m.id,
            Имя: m.name
        }));

        const worksheet = XLSX.utils.json_to_sheet(merchants);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Мерчанты');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=Merchants.xlsx');

        res.send(excelBuffer);

    } catch (error) {
        console.error('Ошибка при экспорте мерчантов:', error);
        res.status(500).json({ error: 'Не удалось создать Excel-файл' });
    }

    // exports.exportSubscriptionsToExcel = async (req, res) => {
    //     try {
    //         const result = await pool.query(`
    //             SELECT sub_id AS id, name, price 
    //             FROM test.sub
    //         `);

    //         if (!result.rows.length) {
    //             return res.status(404).json({ error: 'Подписки не найдены' });
    //         }

    //         const subscriptions = result.rows.map(sub => ({
    //             ID: sub.id,
    //             Название: sub.name,
    //             Цена: JSON.parse(sub.price).month + ' (месяц), ' + JSON.parse(sub.price).year + ' (год)'
    //         }));

    //         const worksheet = XLSX.utils.json_to_sheet(subscriptions);
    //         const workbook = XLSX.utils.book_new();
    //         XLSX.utils.book_append_sheet(workbook, worksheet, 'Подписки');

    //         const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    //         res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    //         res.header('Content-Disposition', 'attachment; filename=Subs.xlsx');

    //         res.send(excelBuffer);

    //     } catch (error) {
    //         console.error('Ошибка при экспорте подписок:', error);
    //         res.status(500).json({ error: 'Не удалось создать Excel-файл' });
    //     }
    // };
};