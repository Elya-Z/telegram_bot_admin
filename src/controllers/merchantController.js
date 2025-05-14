const merchantRepository = require('../repositories/merchantRepository');

class MerchantController {
    async getMerchants(req, res) {
        try {
            console.log('Попытка получить мерчантов из БД...');
            const merchants = await merchantRepository.getAllMerchants();
            res.json(merchants);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async addMerchant(req, res) {
        console.log("Получен запрос на добавление. Тело:", req.body); // 1. Логируем входящие данные

        try {
            const { merchant_name } = req.body;
            if (!merchant_name) {
                console.log("Пустое имя мерчанта");
                return res.status(400).json({ error: "Имя мерчанта обязательно" });
            }

            console.log("Попытка добавить мерчанта:", merchant_name);
            const result = await merchantRepository.addMerchant({ merchant_name });
            console.log("Результат добавления:", result);

            res.json({ success: true, merchant: result });
        } catch (error) {
            console.error("Ошибка в контроллере:", {
                message: error.message,
                stack: error.stack
            });
            res.status(500).json({ error: error.message });
        }
    }

    async deleteMerchant(req, res) {
        try {
            const merchantId = req.params.id;
            await merchantRepository.deleteMerchant(merchantId);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new MerchantController();