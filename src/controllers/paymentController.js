const { TinkoffAcquiringAPI, PAYMENT_STATUS } = require('../utils/t_api');
const transactionRepository = require('../repositories/transactionRepository');
const logger = require('../utils/logger');
require('dotenv').config();

const tinkoffAPI = new TinkoffAcquiringAPI({
    terminalKey: process.env.TINKOFF_TERMINAL_ID,
    password: process.env.TINKOFF_PASSWORD
});

class PaymentController {
    async getTransactions(req, res) {
        try {
            const transactions = await transactionRepository.getAllTransactions();
            res.json(transactions);
        } catch (error) {
            console.error('Error getting transactions:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async createTransaction(req, res) {
        try {
            const { adminId, amount } = req.body;
            if (!adminId || !amount) {
                return res.status(400).json({ error: "Admin ID и сумма обязательны" });
            }

            const amountValue = parseFloat(amount);
            if (isNaN(amountValue) || amountValue < 10 || amountValue > 100000) {
                return res.status(400).json({ error: "Сумма должна быть от 10 до 100 000" });
            }

            const transaction = await transactionRepository.createTransaction(adminId, amountValue);
            const paymentParams = {
                OrderId: `ADMIN-${transaction.id}`,
                Amount: Math.round(amountValue * 100),
                Description: `Пополнение баланса администратора ${adminId}`,
                DATA: {
                    TransactionType: 'admin_payment'
                },
                NotificationURL: `${process.env.API_BASE_URL}/api/payments/notifications`,
                SuccessURL: `${process.env.FRONTEND_URL}/admin_panel.html?payment_success=true`,
                FailURL: `${process.env.FRONTEND_URL}/admin_panel.html?payment_error=true`
            };

            const paymentResponse = await tinkoffAPI.initPayment(paymentParams);
            if (paymentResponse.Success) {
                const updatedTransaction = await transactionRepository.updateTransactionWithPaymentDetails(
                    transaction.id,
                    paymentResponse.PaymentId,
                    paymentResponse.PaymentURL
                );

                await logger.logAction(
                    adminId,
                    'create_payment',
                    {
                        transaction_id: transaction.id,
                        amount: amountValue,
                        tinkoff_payment_id: paymentResponse.PaymentId
                    }
                );
                res.json({
                    success: true,
                    transaction: updatedTransaction,
                    paymentUrl: paymentResponse.PaymentURL
                });
            } else {
                await transactionRepository.updateTransactionStatus(transaction.id, 'ERROR');
                throw new Error(paymentResponse.Message || 'Ошибка инициализации платежа');
            }
        } catch (error) {
            console.error('Payment creation error:', error);
            res.status(500).json({
                error: "Произошла ошибка при создании платежа",
                details: error.message
            });
        }
    }

    async checkPaymentStatus(req, res) {
        try {
            const { transactionId } = req.params;
            const transaction = await transactionRepository.getTransactionById(transactionId);

            if (!transaction) {
                return res.status(404).json({ error: "Транзакция не найдена" });
            }

            if (!transaction.tinkoff_payment_id) {
                return res.json({
                    success: true,
                    status: transaction.status,
                    message: "Платеж не был инициализирован в Tinkoff"
                });
            }

            const statusResponse = await tinkoffAPI.getState(transaction.tinkoff_payment_id);

            if (statusResponse.Success) {
                if (transaction.status !== statusResponse.Status) {
                    await transactionRepository.updateTransactionStatus(
                        transaction.id,
                        statusResponse.Status
                    );
                }
                res.json({
                    success: true,
                    tinkoffStatus: statusResponse.Status,
                    status: statusResponse.Status,
                    amount: transaction.amount,
                    message: getStatusMessage(statusResponse.Status)
                });
            } else {
                throw new Error(statusResponse.Message || 'Ошибка получения статуса платежа');
            }
        } catch (error) {
            console.error('Check payment status error:', error);
            res.status(500).json({
                error: "Произошла ошибка при проверке статуса платежа",
                details: error.message
            });
        }
    }

    async confirmPayment(req, res) {
        try {
            const { transactionId } = req.params;
            const { adminId } = req.body;

            if (!adminId) {
                return res.status(400).json({ error: "ID администратора обязателен" });
            }

            const transaction = await transactionRepository.getTransactionById(transactionId);

            if (!transaction) {
                return res.status(404).json({ error: "Транзакция не найдена" });
            }

            if (transaction.status === PAYMENT_STATUS.CONFIRMED ||
                transaction.status === PAYMENT_STATUS.COMPLETED) {
                return res.json({
                    success: true,
                    status: transaction.status,
                    message: "Платеж уже подтвержден"
                });
            }

            await transactionRepository.updateTransactionStatus(
                transaction.id,
                PAYMENT_STATUS.CONFIRMED
            );

            await logger.logAction(
                adminId,
                'confirm_payment',
                {
                    transaction_id: transaction.id,
                    amount: transaction.amount,
                    previous_status: transaction.status
                }
            );

            res.json({
                success: true,
                status: PAYMENT_STATUS.CONFIRMED,
                message: "Платеж успешно подтвержден"
            });
        } catch (error) {
            console.error('Confirm payment error:', error);
            res.status(500).json({
                error: "Произошла ошибка при подтверждении платежа",
                details: error.message
            });
        }
    }

    async cancelPayment(req, res) {
        try {
            const { transactionId } = req.params;
            const { adminId } = req.body;

            if (!adminId) {
                return res.status(400).json({ error: "ID администратора обязателен" });
            }

            const transaction = await transactionRepository.getTransactionById(transactionId);

            if (!transaction) {
                return res.status(404).json({ error: "Транзакция не найдена" });
            }

            if (transaction.status === PAYMENT_STATUS.CANCELLED ||
                transaction.status === PAYMENT_STATUS.REJECTED) {
                return res.json({
                    success: true,
                    status: transaction.status,
                    message: "Платеж уже отменен"
                });
            }

            if (transaction.tinkoff_payment_id) {
                try {
                    const cancelResponse = await tinkoffAPI.cancelPayment({
                        paymentId: transaction.tinkoff_payment_id
                    });

                    if (!cancelResponse.Success) {
                        console.warn('Tinkoff cancellation warning:', cancelResponse.Message);
                    }
                } catch (tinkoffError) {
                    console.warn('Tinkoff cancellation error:', tinkoffError);
                }
            }

            await transactionRepository.updateTransactionStatus(
                transaction.id,
                'CANCELLED'
            );

            await logger.logAction(
                adminId,
                'cancel_payment',
                {
                    transaction_id: transaction.id,
                    amount: transaction.amount,
                    previous_status: transaction.status
                }
            );

            res.json({
                success: true,
                status: 'CANCELLED',
                message: "Платеж успешно отменен"
            });
        } catch (error) {
            console.error('Cancel payment error:', error);
            res.status(500).json({
                error: "Произошла ошибка при отмене платежа",
                details: error.message
            });
        }
    }
}

function getStatusMessage(status) {
    const statusMessages = {
        [PAYMENT_STATUS.NEW]: 'Новый платеж',
        [PAYMENT_STATUS.FORMSHOWED]: 'Платежная форма открыта',
        [PAYMENT_STATUS.AUTHORIZING]: 'Авторизация',
        [PAYMENT_STATUS.AUTHORIZED]: 'Авторизован',
        [PAYMENT_STATUS.REJECTED]: 'Отклонен',
        [PAYMENT_STATUS.CONFIRMED]: 'Подтвержден',
        [PAYMENT_STATUS.REVERSED]: 'Отменен',
        [PAYMENT_STATUS.REFUNDING]: 'В процессе возврата',
        [PAYMENT_STATUS.PARTIAL_REFUNDED]: 'Частичный возврат',
        [PAYMENT_STATUS.REFUNDED]: 'Возвращен',
        [PAYMENT_STATUS.CHECKING]: 'Проверка',
        [PAYMENT_STATUS.COMPLETED]: 'Завершен',
        'CANCELLED': 'Отменен администратором'
    };

    return statusMessages[status] || 'Неизвестный статус';
}

module.exports = new PaymentController();