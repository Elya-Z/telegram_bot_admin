const pool = require('../config/db');
const subscriptionRepository = require('../repositories/subscriptionRepository');

process.on('uncaughtException', (err) => {
    console.error('Неперехваченная ошибка:', err);
});
class SubscriptionController {
    async getSubscriptions(req, res) {
        try {
            const subscriptions = await subscriptionRepository.getAllSubscriptions();
            res.json(subscriptions.map(sub => ({
                sub_id: sub.sub_id,
                name: sub.name,
                price: typeof sub.price === 'string' ? JSON.parse(sub.price) : sub.price
            })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateSubscriptionPrice(req, res) {
        try {

            const subId = parseInt(req.params.id);
            const { price } = req.body;

            if (!subId || isNaN(subId)) {
                return res.status(400).json({
                    success: false,
                    message: "Неверный ID подписки"
                });
            }

            if (!price || !price.month || !price.year) {
                return res.status(400).json({
                    success: false,
                    message: "Необходимо указать цены для месяца и года"
                });
            }

            const updated = await subscriptionRepository.updateSubscriptionPrice(
                subId,
                {
                    month: parseFloat(price.month),
                    year: parseFloat(price.year)
                }
            );
            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            console.error('Ошибка обновления цены:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createSubscription(req, res) {
        try {
            const { name, price } = req.body;
            if (!name || !price || !price.month || !price.year) {
                return res.status(400).json({
                    error: "Необходимо указать название и цены подписки"
                });
            }

            const subscription = await subscriptionRepository.createSubscription(
                name,
                {
                    month: parseFloat(price.month),
                    year: parseFloat(price.year)
                }
            );
            res.json({
                success: true,
                data: subscription
            });
        } catch (error) {
            console.error('Ошибка создания подписки:', error);
            res.status(500).json({
                error: error.message
            });
        }
    }

    async deleteSubscription(req, res) {
        try {
            const subId = parseInt(req.params.id);
            if (isNaN(subId) || subId <= 0) {
                console.error('[CONTROLLER] Invalid subId:', subId);
                return res.status(400).json({
                    success: false,
                    error: "Неверный ID подписки"
                });
            }
            const result = await subscriptionRepository.deleteSubscription(subId);
            res.json({
                success: true,
                deletedId: result.sub_id,
                deletedName: result.name,
                message: "Подписка успешно удалена"
            });
        } catch (error) {
            console.error('[CONTROLLER] Error:', {
                message: error.message,
                stack: error.stack
            });
            const status = error.message.includes("не найдена") ? 404 : 500;
            console.error(`[CONTROLLER] Sending error response (status ${status})`);

            res.status(status).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new SubscriptionController();