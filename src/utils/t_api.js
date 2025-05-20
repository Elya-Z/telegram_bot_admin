/**
 * TinkoffAcquiringAPI - Node.js library for Tinkoff Payment System API
 * 
 * A comprehensive client for Tinkoff Acquiring API with full support for all payment operations
 * Complete implementation of the Tinkoff Acquiring API with validation and error handling
 */

const crypto = require('crypto');
const axios = require('axios');

/**
 * Available payment statuses in Tinkoff API
 * @readonly
 * @enum {string}
 */
const PAYMENT_STATUS = {
    NEW: 'NEW',                     // Создан
    FORMSHOWED: 'FORMSHOWED',       // Платежная форма открыта покупателем
    AUTHORIZING: 'AUTHORIZING',     // Покупатель начал вводить данные карты
    AUTHORIZED: 'AUTHORIZED',       // Проведена предавторизация
    REJECTED: 'REJECTED',           // Платеж отклонен
    CONFIRMED: 'CONFIRMED',         // Платеж подтвержден
    REVERSED: 'REVERSED',           // Платеж отменен
    REFUNDING: 'REFUNDING',         // Происходит возврат денежных средств
    PARTIAL_REFUNDED: 'PARTIAL_REFUNDED', // Произведен частичный возврат
    REFUNDED: 'REFUNDED',           // Произведен возврат денежных средств
    CHECKING: 'CHECKING',           // Платеж в процессе проверки
    COMPLETED: 'COMPLETED'          // Платеж завершен
};

/**
 * Generates a token for Tinkoff API requests
 * @param {Object} body - Request body
 * @param {string} password - Terminal password
 * @returns {string} - SHA-256 hash of the generated string
 * @private
 */
function generateToken(body, password) {
    // Create array of key-value pairs for root level parameters only
    const pairs = [];

    // Add only root level parameters, excluding nested objects and arrays
    for (let key in body) {
        const value = body[key];
        // Skip if value is an object or array
        if (value !== null && value !== undefined &&
            typeof value !== 'object' && !Array.isArray(value)) {
            pairs.push({ [key]: value.toString() });
        }
    }

    // Add password pair
    pairs.push({ Password: password });

    // Sort pairs by key alphabetically
    pairs.sort((a, b) => {
        const keyA = Object.keys(a)[0];
        const keyB = Object.keys(b)[0];
        return keyA.localeCompare(keyB);
    });

    // Concatenate only values in order
    const concatValues = pairs.map(pair => Object.values(pair)[0]).join('');

    // Generate SHA-256 hash with UTF-8 support
    const token = crypto.createHash('sha256')
        .update(concatValues)
        .digest('hex');

    return token;
}

/**
 * Creates a TinkoffAcquiringAPI instance
 * @param {Object} config - Configuration options
 * @param {string} config.terminalKey - Terminal identifier
 * @param {string} config.password - Terminal password
 * @param {string} [config.apiUrl] - API URL (default: https://securepay.tinkoff.ru/v2)
 * @returns {Object} - API instance with methods
 */
function TinkoffAcquiringAPI(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('Configuration object is required');
    }

    if (!config.terminalKey) {
        throw new Error('terminalKey is required');
    }

    if (!config.password) {
        throw new Error('password is required');
    }

    const terminalKey = config.terminalKey;
    const password = config.password;
    const apiUrl = config.apiUrl || 'https://securepay.tinkoff.ru/v2';
    const httpClient = axios;

    /**
     * Makes a request to the Tinkoff API
     * @param {string} method - API method
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} - API response
     * @private
     */
    async function _makeRequest(method, params) {
        // Create request body with terminal key
        const body = Object.assign({}, params);
        body.TerminalKey = terminalKey;

        // Generate and add token to the request
        body.Token = generateToken(body, password);

        // Отладочная информация
        console.log(`[TinkoffAPI Debug] Making request to ${method}:`, JSON.stringify(body, null, 2));

        try {
            // Make the request
            const response = await httpClient.post(`${apiUrl}/${method}`, body);

            // Отладочная информация
            console.log(`[TinkoffAPI Debug] Response from ${method}:`, JSON.stringify(response.data, null, 2));

            // Return response data
            return response.data;
        } catch (error) {
            // Handle errors
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error(`[TinkoffAPI Error] ${method} request failed:`,
                    error.response.status, error.response.data);
                return error.response.data;
            } else if (error.request) {
                // The request was made but no response was received
                console.error('[TinkoffAPI Error] No response received:', error.request);
                throw new Error(`No response from Tinkoff API for ${method}`);
            } else {
                // Something happened in setting up the request
                console.error('[TinkoffAPI Error] Request setup failed:', error.message);
                throw error;
            }
        }
    }

    /**
     * Creates a payment object with validation
     * @param {Object} paymentParams - Payment parameters
     * @returns {Object} - Validated payment object
     */
    function createPaymentObject(paymentParams) {
        // Validate required fields
        if (!paymentParams.OrderId) {
            throw new Error('OrderId is required');
        }

        if (!paymentParams.Amount) {
            throw new Error('Amount is required');
        }

        // Ensure Amount is in kopecks (integer)
        if (typeof paymentParams.Amount === 'number' && paymentParams.Amount % 1 !== 0) {
            // Convert from rubles to kopecks if it's a decimal number
            paymentParams.Amount = Math.round(paymentParams.Amount * 100);
        }

        // Validate and handle Description
        if (paymentParams.Description && typeof paymentParams.Description === 'string') {
            // Ensure description doesn't exceed 140 characters
            if (paymentParams.Description.length > 140) {
                paymentParams.Description = paymentParams.Description.substring(0, 140);
            }
        }

        // Validate CustomerKey and Recurrent relationship
        if (paymentParams.Recurrent === 'Y' && !paymentParams.CustomerKey) {
            // CustomerKey is required if Recurrent is 'Y', except for SBP payments
            // Check if this is an SBP payment
            const isSbpPayment = paymentParams.DATA &&
                (paymentParams.DATA.QR === true ||
                    paymentParams.DATA.QR === 'true');

            if (!isSbpPayment) {
                throw new Error('CustomerKey is required when Recurrent is Y');
            }
        }

        // Handle PayType validation
        if (paymentParams.PayType && !['O', 'T'].includes(paymentParams.PayType)) {
            throw new Error("PayType must be 'O' (one-stage) or 'T' (two-stage)");
        }

        // Handle Language validation
        if (paymentParams.Language && !['ru', 'en'].includes(paymentParams.Language)) {
            throw new Error("Language must be 'ru' or 'en'");
        }

        // Handle RedirectDueDate validation
        if (paymentParams.RedirectDueDate) {
            try {
                const dueDate = new Date(paymentParams.RedirectDueDate);
                const now = new Date();
                const maxDate = new Date(now);
                maxDate.setDate(maxDate.getDate() + 90); // 90 days from now

                if (dueDate < now) {
                    throw new Error('RedirectDueDate must be in the future');
                }

                if (dueDate > maxDate) {
                    throw new Error('RedirectDueDate cannot be more than 90 days in the future');
                }
            } catch (error) {
                throw new Error('Invalid RedirectDueDate format. Use ISO 8601 format (YYYY-MM-DDTHH:MM:SS+TZ)');
            }
        }

        // Validate DATA object
        if (paymentParams.DATA) {
            // Ensure DATA doesn't have more than 20 key-value pairs
            const dataKeys = Object.keys(paymentParams.DATA);
            if (dataKeys.length > 20) {
                throw new Error('DATA object cannot have more than 20 key-value pairs');
            }

            // Validate key and value lengths
            for (const key of dataKeys) {
                if (key.length > 20) {
                    throw new Error(`DATA key '${key}' exceeds maximum length of 20 characters`);
                }

                const value = paymentParams.DATA[key];
                if (typeof value === 'string' && value.length > 100) {
                    throw new Error(`DATA value for key '${key}' exceeds maximum length of 100 characters`);
                }
            }

            // Validate OperationInitiatorType if present
            if (paymentParams.DATA.InitType) {
                const validTypes = ['0', '1', '2', 'R', 'I'];
                if (!validTypes.includes(paymentParams.DATA.InitType)) {
                    throw new Error("InitType must be one of: '0', '1', '2', 'R', 'I'");
                }
            }
        }

        // Validate Receipt if present
        if (paymentParams.Receipt) {
            // Check for Email or Phone
            if (!paymentParams.Receipt.Email && !paymentParams.Receipt.Phone) {
                throw new Error('Receipt must contain either Email or Phone');
            }

            // Validate Email format if present
            if (paymentParams.Receipt.Email && typeof paymentParams.Receipt.Email === 'string') {
                if (paymentParams.Receipt.Email.length > 64) {
                    throw new Error('Receipt Email cannot exceed 64 characters');
                }

                // Simple email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(paymentParams.Receipt.Email)) {
                    throw new Error('Invalid Receipt Email format');
                }
            }

            // Validate Phone format if present
            if (paymentParams.Receipt.Phone && typeof paymentParams.Receipt.Phone === 'string') {
                if (paymentParams.Receipt.Phone.length > 64) {
                    throw new Error('Receipt Phone cannot exceed 64 characters');
                }
            }

            // Validate Taxation
            if (!paymentParams.Receipt.Taxation) {
                paymentParams.Receipt.Taxation = 'osn'; // Default taxation system
            } else {
                const validTaxations = ['osn', 'usn_income', 'usn_income_outcome', 'envd', 'esn', 'patent'];
                if (!validTaxations.includes(paymentParams.Receipt.Taxation)) {
                    throw new Error('Invalid Taxation value');
                }
            }

            // Check for items
            if (!Array.isArray(paymentParams.Receipt.Items) || paymentParams.Receipt.Items.length === 0) {
                throw new Error('Receipt.Items must be a non-empty array');
            }

            // Validate FfdVersion if present
            if (paymentParams.Receipt.FfdVersion &&
                !['1.05', '1.2'].includes(paymentParams.Receipt.FfdVersion)) {
                throw new Error("FfdVersion must be '1.05' or '1.2'");
            }

            // Sum of all item amounts for validation
            let totalItemsAmount = 0;

            // Validate each item
            paymentParams.Receipt.Items.forEach(function (item, index) {
                if (!item.Name) {
                    throw new Error(`Item ${index} must have a Name`);
                }

                if (typeof item.Name === 'string' && item.Name.length > 128) {
                    throw new Error(`Item ${index} Name cannot exceed 128 characters`);
                }

                if (!item.Price || typeof item.Price !== 'number') {
                    throw new Error(`Item ${index} must have a valid Price`);
                }

                if (!item.Quantity || typeof item.Quantity !== 'number') {
                    throw new Error(`Item ${index} must have a valid Quantity`);
                }

                if (!item.Amount) {
                    // Calculate Amount if not provided
                    item.Amount = Math.round(item.Price * item.Quantity);
                }

                if (!item.Tax) {
                    // Set default tax
                    item.Tax = 'vat20';
                } else {
                    // Validate Tax value
                    const validTaxes = ['none', 'vat0', 'vat10', 'vat20', 'vat110', 'vat120'];
                    if (!validTaxes.includes(item.Tax)) {
                        throw new Error(`Item ${index} has invalid Tax value`);
                    }
                }

                // Add to total
                totalItemsAmount += item.Amount;
            });

            // Validate total amount matches sum of items
            if (totalItemsAmount !== paymentParams.Amount) {
                throw new Error(`Total amount (${paymentParams.Amount}) doesn't match sum of item amounts (${totalItemsAmount})`);
            }

            // Validate Payments if present
            if (paymentParams.Receipt.Payments) {
                if (!paymentParams.Receipt.Payments.Electronic) {
                    throw new Error('Electronic payment amount is required in Receipt.Payments');
                }

                // Calculate total payments
                let totalPayments = paymentParams.Receipt.Payments.Electronic || 0;
                totalPayments += paymentParams.Receipt.Payments.Cash || 0;
                totalPayments += paymentParams.Receipt.Payments.AdvancePayment || 0;
                totalPayments += paymentParams.Receipt.Payments.Credit || 0;
                totalPayments += paymentParams.Receipt.Payments.Provision || 0;

                // Validate total payments match total amount
                if (totalPayments !== paymentParams.Amount) {
                    throw new Error(`Total payments (${totalPayments}) doesn't match total amount (${paymentParams.Amount})`);
                }

                // Ensure Electronic payment matches Amount
                if (paymentParams.Receipt.Payments.Electronic !== paymentParams.Amount) {
                    throw new Error(`Electronic payment (${paymentParams.Receipt.Payments.Electronic}) must equal total amount (${paymentParams.Amount})`);
                }
            }

            // Validate Shops if present
            if (paymentParams.Receipt.Shops && Array.isArray(paymentParams.Receipt.Shops)) {
                // Validate each shop
                let totalShopsAmount = 0;

                paymentParams.Receipt.Shops.forEach(function (shop, index) {
                    if (!shop.ShopCode) {
                        throw new Error(`Shop ${index} must have a ShopCode`);
                    }

                    if (!shop.Amount || typeof shop.Amount !== 'number') {
                        throw new Error(`Shop ${index} must have a valid Amount`);
                    }

                    totalShopsAmount += shop.Amount;
                });

                // Validate total shops amount matches total amount
                if (totalShopsAmount !== paymentParams.Amount) {
                    throw new Error(`Total shops amount (${totalShopsAmount}) doesn't match total amount (${paymentParams.Amount})`);
                }
            }
        }

        return paymentParams;
    }

    /**
     * Initialize a payment
     * @param {Object} paymentParams - Payment parameters
     * @returns {Promise<Object>} - Payment information
     */
    async function initPayment(paymentParams) {
        try {
            // Validate the payment object
            const validatedParams = createPaymentObject(paymentParams);

            // Make the request
            const response = await _makeRequest('Init', validatedParams);

            return response;
        } catch (error) {
            console.error('[TinkoffAPI Error] Payment initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Check payment status
     * @param {string|Object} paymentId - Payment ID or object with parameters
     * @param {Object} [options] - Additional parameters
     * @returns {Promise<Object>} - Payment state information
     */
    async function getState(paymentId, options) {
        try {
            let params = {};

            // Handle different parameter formats
            if (typeof paymentId === 'object') {
                // If first parameter is an object with all options
                params = paymentId;
            } else {
                // If first parameter is just the paymentId string
                params = Object.assign({}, options || {});
                params.PaymentId = paymentId;
            }

            // Validate required parameters
            if (!params.PaymentId) {
                throw new Error('PaymentId is required');
            }

            // Validate PaymentId format and length
            if (typeof params.PaymentId === 'string' && params.PaymentId.length > 20) {
                throw new Error('PaymentId cannot exceed 20 characters');
            }

            // Validate IP if provided
            if (params.IP && typeof params.IP === 'string') {
                // Simple IP validation (both IPv4 and IPv6)
                const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
                const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;

                if (!ipv4Regex.test(params.IP) && !ipv6Regex.test(params.IP)) {
                    console.warn('Warning: Invalid IP format provided');
                    // We don't throw an error here to be more forgiving, but we log a warning
                }
            }

            // Make the request
            const response = await _makeRequest('GetState', params);

            return response;
        } catch (error) {
            console.error('[TinkoffAPI Error] Get payment state failed:', error.message);
            throw error;
        }
    }

    /**
     * Alias for getState, for backward compatibility
     * @param {string|Object} paymentId - Payment ID or object with parameters
     * @param {Object} [options] - Additional parameters
     * @returns {Promise<Object>} - Payment state information
     */
    async function checkPayment(paymentId, options) {
        return getState(paymentId, options);
    }

    /**
     * Process a recurring payment using saved card data (RebillId)
     * @param {string|Object} paymentId - Payment ID or object with all parameters
     * @param {string} [rebillId] - Rebill ID for the saved card
     * @param {Object} [options] - Additional parameters
     * @returns {Promise<Object>} - Payment processing result
     */
    async function charge(paymentId, rebillId, options) {
        try {
            let params = {};

            // Handle different parameter formats
            if (typeof paymentId === 'object') {
                // If first parameter is an object with all options
                params = paymentId;
            } else {
                // If parameters are provided separately
                params = Object.assign({}, options || {});
                params.PaymentId = paymentId;
                params.RebillId = rebillId;
            }

            // Validate required parameters
            if (!params.PaymentId) {
                throw new Error('PaymentId is required');
            }

            if (!params.RebillId) {
                throw new Error('RebillId is required');
            }

            // Validate PaymentId format and length
            if (typeof params.PaymentId === 'string' && params.PaymentId.length > 20) {
                throw new Error('PaymentId cannot exceed 20 characters');
            }

            // Validate IP if provided
            if (params.IP && typeof params.IP === 'string') {
                // Simple IP validation (both IPv4 and IPv6)
                const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
                const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;

                if (!ipv4Regex.test(params.IP) && !ipv6Regex.test(params.IP)) {
                    console.warn('Warning: Invalid IP format provided');
                    // We don't throw an error here to be more forgiving, but we log a warning
                }
            }

            // Validate SendEmail and InfoEmail relationship
            if (params.SendEmail === true && !params.InfoEmail) {
                throw new Error('InfoEmail is required when SendEmail is true');
            }

            // Validate InfoEmail format if provided
            if (params.InfoEmail && typeof params.InfoEmail === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(params.InfoEmail)) {
                    throw new Error('Invalid InfoEmail format');
                }
            }

            // Make the request
            const response = await _makeRequest('Charge', params);

            return response;
        } catch (error) {
            console.error('[TinkoffAPI Error] Charge operation failed:', error.message);
            throw error;
        }
    }

    /**
     * Alias for charge, for backward compatibility
     * @param {string|Object} paymentId - Payment ID or object with parameters
     * @param {string} [rebillId] - Rebill ID for the saved card
     * @param {Object} [options] - Additional parameters
     * @returns {Promise<Object>} - Payment processing result
     */
    async function recurrentPayment(paymentId, rebillId, options) {
        return charge(paymentId, rebillId, options);
    }

    /**
     * Отмена платежа
     * @param {Object} options - Параметры отмены платежа
     * @param {string} options.paymentId - Идентификатор платежа
     * @param {number} [options.amount] - Сумма отмены в копейках (если не указана, отменяется полная сумма)
     * @param {Object} [options.receipt] - Данные чека для отмены (если требуется)
     * @param {string} [options.ip] - IP-адрес клиента
     * @param {string} [options.externalRequestId] - Идентификатор операции на стороне мерчанта
     * @returns {Promise<Object>} - Результат отмены платежа
     */
    async function cancelPayment(options) {
        try {
            // Проверяем обязательные параметры
            if (!options.paymentId) {
                throw new Error('paymentId is required');
            }

            // Создаем объект для отмены платежа
            const cancelObj = {
                PaymentId: options.paymentId
            };

            // Добавляем необязательные параметры, если они указаны
            if (options.amount) {
                cancelObj.Amount = options.amount;
            }

            if (options.ip) {
                cancelObj.IP = options.ip;
            }

            if (options.receipt) {
                cancelObj.Receipt = options.receipt;
            }

            if (options.externalRequestId) {
                cancelObj.ExternalRequestId = options.externalRequestId;
            }

            // Отправляем запрос на отмену платежа
            const response = await _makeRequest('Cancel', cancelObj);

            return response;
        } catch (error) {
            console.error('[TinkoffAPI Error] Cancel payment failed:', error.message);
            throw error;
        }
    }

    /**
     * Helper method to create a receipt object
     * @param {Object} options - Receipt options
     * @returns {Object} - Formatted receipt object
     */
    async function createReceipt(options) {
        if (!options || typeof options !== 'object') {
            throw new Error('Receipt options must be an object');
        }

        // Create base receipt object
        const receipt = {
            Items: [],
            Taxation: options.taxation || 'osn' // Default taxation
        };

        // Set email and/or phone
        if (options.email) receipt.Email = options.email;
        if (options.phone) receipt.Phone = options.phone;

        // Validate at least one contact method is provided
        if (!receipt.Email && !receipt.Phone) {
            throw new Error('Receipt must have either Email or Phone');
        }

        // Set FFD version if provided
        if (options.ffdVersion) {
            if (['1.05', '1.2'].includes(options.ffdVersion)) {
                receipt.FfdVersion = options.ffdVersion;
            } else {
                throw new Error("FfdVersion must be '1.05' or '1.2'");
            }
        }

        // Process items
        if (!options.items || !Array.isArray(options.items) || options.items.length === 0) {
            throw new Error('Receipt items must be a non-empty array');
        }

        // Calculate total amount for validation
        let totalAmount = 0;

        // Process each item
        receipt.Items = options.items.map(function (item, index) {
            // Validate required fields
            if (!item.name) {
                throw new Error(`Item ${index} must have a name`);
            }

            if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
                throw new Error(`Item ${index} must have a valid price (positive number)`);
            }

            const quantity = item.quantity !== undefined ? Number(item.quantity) : 1;
            if (isNaN(quantity) || quantity <= 0) {
                throw new Error(`Item ${index} must have a valid quantity (positive number)`);
            }

            // Create formatted item
            const receiptItem = {
                Name: item.name,
                Price: Math.round(item.price * 100), // Convert to kopecks
                Quantity: quantity,
                Amount: item.amount
                    ? Math.round(item.amount * 100)
                    : Math.round(item.price * 100 * quantity),
                Tax: item.tax || 'vat20' // Default tax
            };

            // Validate tax value
            const validTaxes = ['none', 'vat0', 'vat10', 'vat20', 'vat110', 'vat120'];
            if (!validTaxes.includes(receiptItem.Tax)) {
                throw new Error(`Item ${index} has invalid tax value`);
            }

            // Add payment attributes if provided
            if (item.paymentMethod) {
                receiptItem.PaymentMethod = item.paymentMethod;
            }

            if (item.paymentObject) {
                receiptItem.PaymentObject = item.paymentObject;
            }

            // Add optional attributes
            if (item.ean13) receiptItem.Ean13 = item.ean13;
            if (item.shopCode) receiptItem.ShopCode = item.shopCode;
            if (item.agentData) receiptItem.AgentData = item.agentData;
            if (item.supplierInfo) receiptItem.SupplierInfo = item.supplierInfo;

            // Add to total
            totalAmount += receiptItem.Amount;

            return receiptItem;
        });

        // Set Payments if provided
        if (options.payments) {
            receipt.Payments = {
                Electronic: options.payments.electronic ?
                    Math.round(options.payments.electronic * 100) : totalAmount
            };

            // Add other payment types if provided
            if (options.payments.cash) {
                receipt.Payments.Cash = Math.round(options.payments.cash * 100);
            }

            if (options.payments.advancePayment) {
                receipt.Payments.AdvancePayment = Math.round(options.payments.advancePayment * 100);
            }

            if (options.payments.credit) {
                receipt.Payments.Credit = Math.round(options.payments.credit * 100);
            }

            if (options.payments.provision) {
                receipt.Payments.Provision = Math.round(options.payments.provision * 100);
            }
        }

        // Set Shops if provided
        if (options.shops && Array.isArray(options.shops) && options.shops.length > 0) {
            receipt.Shops = options.shops.map(function (shop) {
                const formattedShop = {
                    ShopCode: shop.shopCode,
                    Amount: Math.round(shop.amount * 100) // Convert to kopecks
                };

                if (shop.name) formattedShop.Name = shop.name;
                if (shop.fee) formattedShop.Fee = Math.round(shop.fee * 100);
                if (shop.descriptor) formattedShop.Descriptor = shop.descriptor;

                return formattedShop;
            });
        }

        return receipt;
    }

    /**
     * Получение списка карт клиента
     * @param {Object} options - Параметры запроса
     * @param {string} options.customerKey - Идентификатор клиента в системе мерчанта
     * @param {boolean} [options.savedCard] - Признак сохранения карты для оплаты в 1 клик
     * @param {string} [options.ip] - IP-адрес запроса
     * @returns {Promise<Array>} - Список карт клиента
     */
    async function getCardList(options) {
        try {
            // Проверяем обязательные параметры
            if (!options.customerKey) {
                throw new Error('customerKey is required');
            }

            // Создаем объект для запроса
            const params = {
                CustomerKey: options.customerKey
            };

            // Добавляем необязательные параметры, если они указаны
            if (options.savedCard !== undefined) {
                params.SavedCard = options.savedCard;
            }

            if (options.ip) {
                params.IP = options.ip;
            }

            // Отправляем запрос
            const response = await _makeRequest('GetCardList', params);

            return response;
        } catch (error) {
            console.error('[TinkoffAPI Error] Get card list failed:', error.message);
            throw error;
        }
    }

    // Return API methods
    return {
        initPayment: initPayment,
        getState: getState,
        checkPayment: checkPayment,
        charge: charge,
        recurrentPayment: recurrentPayment,
        cancelPayment: cancelPayment,
        createReceipt: createReceipt,
        getCardList: getCardList
    };
}

// Export the API constructor and constants
module.exports = {
    TinkoffAcquiringAPI: TinkoffAcquiringAPI,
    PAYMENT_STATUS: PAYMENT_STATUS
};