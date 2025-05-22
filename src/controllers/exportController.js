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

        const merchants = result.rows
            .sort((a, b) => a.id - b.id)
            .map(m => ({
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
        const subscriptions = result.rows
            .sort((a, b) => a.id - b.id)
            .map(sub => {
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
        const salaryDays = result.rows
            .sort((a, b) => a.id - b.id)
            .map(day => ({
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

exports.exportPaymentsToExcel = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, admin_id, amount, status, created_at 
            FROM test.admin_transactions
        `);

        const payments = result.rows.map(p => ({
            ID: p.id,
            'ID Админа': p.admin_id,
            Сумма: parseFloat(p.amount).toFixed(2),
            Статус: mapPaymentStatus(p.status),
            'Дата создания': formatDate(p.created_at)
        }));

        const worksheet = XLSX.utils.json_to_sheet(payments);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Платежи');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=Payments.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Ошибка при экспорте платежей:', error);
        res.status(500).json({ error: 'Не удалось создать Excel-файл' });
    }
};

exports.exportAllDataToExcel = async (req, res) => {
    try {
        const { tables } = req.query; // Получаем список таблиц из query: ?tables=users,merchants
        const allowedTables = ['users', 'merchants', 'subscriptions', 'salary-days', 'payments'];
        const selectedTables = tables ? tables.split(',').filter(t => allowedTables.includes(t)) : allowedTables;

        if (!selectedTables.length) {
            return res.status(400).json({ error: 'Нет данных для экспорта' });
        }

        const client = await pool.connect();

        const workbook = XLSX.utils.book_new();

        if (selectedTables.includes('users')) {
            const usersRes = await client.query(`SELECT id, balance, ice, status FROM test.users`);
            const users = usersRes.rows
                .sort((a, b) => a.id - b.id)
                .map(u => ({
                    ID: u.id,
                    Баланс: parseFloat(u.balance),
                    Ice: parseFloat(u.ice),
                    Статус: u.status === 1 ? 'Активен' : 'Заблокирован'
                }));
            addSheet(workbook, users, 'Пользователи');
        }

        if (selectedTables.includes('merchants')) {
            const merchantsRes = await client.query(`SELECT id, merchant_name AS name FROM test.merchant`);
            const merchants = merchantsRes.rows
                .sort((a, b) => a.id - b.id)
                .map(m => ({
                    ID: m.id,
                    Имя: m.name
                }));
            addSheet(workbook, merchants, 'Мерчанты');
        }

        if (selectedTables.includes('subscriptions')) {
            const subscriptionsRes = await client.query(`SELECT sub_id AS id, name, price FROM test.sub`);
            const subscriptions = subscriptionsRes.rows
                .sort((a, b) => a.id - b.id)
                .map(sub => {
                    let priceData;
                    if (typeof sub.price === 'string') {
                        try {
                            priceData = JSON.parse(sub.price);
                        } catch (e) {
                            priceData = { month: null, year: null };
                        }
                    } else {
                        priceData = sub.price || {};
                    }

                    return {
                        ID: sub.id,
                        Название: sub.name,
                        'Месячная цена': priceData.month || '-',
                        'Годовая цена': priceData.year || '-'
                    };
                });
            addSheet(workbook, subscriptions, 'Подписки');
        }

        if (selectedTables.includes('salary-days')) {
            const salaryRes = await client.query(`SELECT id AS id, salary_day FROM test.salary`);
            const salaryDays = salaryRes.rows
                .sort((a, b) => a.id - b.id)
                .map(day => ({
                    'ID пользователя': day.id,
                    'Зарплатный день': day.salary_day
                }));
            addSheet(workbook, salaryDays, 'Зарплатные дни');
        }

        if (selectedTables.includes('payments')) {
            const paymentsRes = await client.query(`SELECT id, admin_id, amount, status, created_at FROM test.admin_transactions`);
            const payments = paymentsRes.rows
                .sort((a, b) => a.id - b.id)
                .map(p => ({
                    ID: p.id,
                    'ID Админа': p.admin_id,
                    Сумма: parseFloat(p.amount).toFixed(2),
                    Статус: mapPaymentStatus(p.status),
                    'Дата создания': formatDate(p.created_at)
                }));
            addSheet(workbook, payments, 'Платежи');
        }

        client.release();

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=SelectedData.xlsx');
        res.send(excelBuffer);

    } catch (error) {
        console.error('Ошибка при экспорте:', error);
        res.status(500).json({ error: 'Не удалось создать Excel-файл' });
    }
};

function addSheet(workbook, data, sheetName) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

// Вспомогательные функции

function mapPaymentStatus(status) {
    const statusMap = {
        NEW: 'Новый',
        FORMSHOWED: 'Форма показана',
        AUTHORIZING: 'Авторизация',
        AUTHORIZED: 'Авторизовано',
        CONFIRMED: 'Подтверждено',
        COMPLETED: 'Завершено',
        REJECTED: 'Отклонено',
        REVERSED: 'Отменено',
        REFUNDING: 'Возврат',
        REFUNDED: 'Возвращено',
        PARTIAL_REFUNDED: 'Частичный возврат',
        CHECKING: 'Проверка',
        CANCELLED: 'Отменено вручную'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}