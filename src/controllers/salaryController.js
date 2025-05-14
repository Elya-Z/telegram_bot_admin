const salaryRepository = require('../repositories/salaryRepository');

class SalaryController {
    async getSalaryDays(req, res) {
        try {
            const days = await salaryRepository.getAllSalaryDays();
            res.json(days);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateSalaryDay(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const { day } = req.body;

            if (isNaN(userId)) {
                return res.status(400).json({ error: "Неверный ID пользователя" });
            }

            if (isNaN(day) || day < 1 || day > 31) {
                return res.status(400).json({ error: "День должен быть числом от 1 до 31" });
            }

            const updated = await salaryRepository.updateSalaryDay(userId, day);

            if (!updated) {
                return res.status(404).json({ error: "Пользователь не найден" });
            }

            res.json({
                success: true,
                data: updated
            });
        } catch (error) {
            console.error('Ошибка обновления:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new SalaryController();