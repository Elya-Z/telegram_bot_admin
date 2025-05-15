const merchantRepository = require('../repositories/merchantRepository');
const pool = require('../config/db');
class MerchantController {
    async getMerchants(req, res) {
        try {
            const result = await pool.query(`
                SELECT id, merchant_name AS name 
                FROM test.merchant
            `);

            if (!result.rows.length) {
                return res.status(404).json({ error: 'Мерчанты не найдены' });
            }

            res.json(result.rows.map(m => ({
                id: m.id,
                name: m.name
            })));
        } catch (error) {
            console.error('Ошибка при получении мерчантов:', error);
            res.status(500).json({ error: 'Не удалось загрузить мерчантов' });
        }
    }

    async addMerchant(req, res) {
        console.log("Получен запрос на добавление. Тело:", req.body);

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
    async updateMerchant(req, res) {
        try {
            const { id, merchant_name } = req.body;

            if (!merchant_name || !merchant_name.trim()) {
                return res.status(400).json({ error: "Имя мерчанта не может быть пустым" });
            }

            const updated = await merchantRepository.updateMerchant(id, merchant_name);

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            console.error("Ошибка обновления мерчанта:", error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new MerchantController();