const salaryRepository = require('../repositories/salaryRepository');

class SalaryController {
    async getSalaryDays(req, res) {
        try {
            const days = await salaryRepository.getAllSalaryDays();
            res.json(days);
        } catch (error) {
            console.error('Error getting salary days:', error);
            res.status(500).json({
                error: 'Ошибка при получении зарплатных дней',
                details: error.message
            });
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

            res.json({
                success: true,
                data: {
                    id: updated.id,
                    salary_day: updated.salary_day
                }
            });
        } catch (error) {
            console.error('Error updating salary day:', error);
            res.status(500).json({
                error: "Ошибка при обновлении зарплатного дня",
                details: error.message
            });
        }
    }
}

module.exports = new SalaryController();