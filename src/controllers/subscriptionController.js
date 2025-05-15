const subscriptionRepository = require('../repositories/subscriptionRepository');

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
            console.log(`Получен запрос на обновление подписки ${subId}:`, price);

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
}

module.exports = new SubscriptionController();