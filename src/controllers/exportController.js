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
        res.header('Content-Disposition', 'attachment; filename=Users.xlsx');
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
};

exports.exportSubscriptionsToExcel = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sub_id AS id, name, price 
            FROM test.sub
        `);
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Подписки не найдены' });
        }
        const subscriptions = result.rows.map(sub => {
            let priceData;
            if (typeof sub.price === 'string') {
                try {
                    priceData = JSON.parse(sub.price);
                } catch (error) {
                    console.error(`Ошибка при парсинге JSON для подписки ${sub.id}:`, error);
                    priceData = { month: null, year: null };
                }
            } else if (typeof sub.price === 'object' && sub.price !== null) {
                priceData = sub.price;
            } else {
                priceData = { month: null, year: null };
            }
            const formatPrice = (price) => {
                if (price === null || price === undefined) return 'Не определено';
                if (typeof price === 'number') return `${price} RUB`;
                return String(price);
            };
            return {
                ID: sub.id,
                Название: sub.name,
                'Месячная цена': formatPrice(priceData.month),
                'Годовая цена': formatPrice(priceData.year)
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(subscriptions);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Подписки');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=Subscriptions.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Ошибка при экспорте подписок:', error);
        res.status(500).json({
            error: 'Не удалось создать Excel-файл',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.exportSalaryDaysToExcel = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id AS id, salary_day 
            FROM test.salary
        `);
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Зарплатные дни не найдены' });
        }
        const salaryDays = result.rows.map(day => ({
            'ID пользователя': day.id,
            'Зарплатный день': day.salary_day
        }));
        const worksheet = XLSX.utils.json_to_sheet(salaryDays);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Зарплатные дни');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=Salary.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Ошибка при экспорте зарплатных дней:', error);
        res.status(500).json({ error: 'Не удалось создать Excel-файл' });
    }
};