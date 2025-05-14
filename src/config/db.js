const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.query('SELECT NOW()')
    .then(() => console.log('✅ Подключение к PostgreSQL установлено'))
    .catch(err => console.error('❌ Ошибка подключения к PostgreSQL:', err));
module.exports = pool;