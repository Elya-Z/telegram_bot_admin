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
        try {
            const { merchant_name } = req.body;
            if (!merchant_name) {
                return res.status(400).json({ error: "Имя мерчанта обязательно" });
            }
            const result = await merchantRepository.addMerchant({ merchant_name });
            res.status(201).json({ success: true, merchant: result });
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
            const { id } = req.params;
            const { merchant_name } = req.body;

            if (!merchant_name) {
                return res.status(400).json({ error: 'Имя мерчанта обязательно' });
            }
            const updatedMerchant = await merchantRepository.updateMerchant(id, merchant_name);
            res.json({
                success: true,
                message: 'Мерчант успешно обновлен',
                data: updatedMerchant
            });
        } catch (error) {
            console.error('Ошибка при обновлении мерчанта:', error);
            res.status(500).json({ error: error.message || 'Не удалось обновить мерчанта' });
        }
    }
}

module.exports = new MerchantController();