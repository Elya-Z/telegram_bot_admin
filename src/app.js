require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const salaryRoutes = require('./routes/salaryRoutes');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'views')));

const subscriptionRoutes = require('./routes/subscriptionRoutes');
const otherRoutes = require('./routes');

app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', otherRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin_panel.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
const exportRoutes = require('./routes/exportRoutes');
app.use('/api', exportRoutes);

const merchantRoutes = require('./routes/merchantRoutes');
app.use('/api/merchants', merchantRoutes);

app.use('/api/salary', salaryRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`CORS configured for: http://localhost:3000`);
    console.log(`Available methods: GET, POST, PUT, DELETE, OPTIONS`);
});