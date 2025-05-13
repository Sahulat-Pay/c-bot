const axios = require("axios");
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, (req, res) => {
    console.log(`Example app listening on port ${PORT}`);
});

app.get("/", (req, res) => {
    return res.status(200).json({ status: "success" });
});

// Replace with your bot token
const BOT_TOKEN = "7877638829:AAHiBx8jOGV-6N-wEMx0rhfzBHkEPXhhTes";

// Create a bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// API URLs
const CALLBACK_API_URL = "https://server.sahulatpay.com/backoffice/payin-callback";
const SETTLE_API_URL = "https://server.sahulatpay.com/backoffice/settle-transactions/tele";
const PAYOUT_API_URL = "https://server.sahulatpay.com/disbursement/tele";
const PAYOUT_CALLBACK_API_URL = "https://server.sahulatpay.com/backoffice/payout-callback";
const FAIL_API_URL = "https://server.sahulatpay.com/backoffice/fail-transactions/tele";

// Cache id object as a Map and validate on startup
const idMap = new Map(Object.entries({
    // THINK TECH CONSULTANCY
    87: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    88: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    89: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    90: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    91: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    92: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    93: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    94: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    96: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    97: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    98: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    99: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    100: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    101: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    103: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    104: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    105: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    106: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    107: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    108: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    109: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    110: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    111: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    112: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    113: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    114: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    115: "3c0ba58b-5a69-4376-b40d-4d497d561ba2",
    // DEVINERA TECHNOLOGIES
    119: "f2e2586e-d17b-4fe6-a905-2148f5e4bf15",
    // SASTA TECH SOLUTIONS
    126: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    127: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    128: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    129: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    130: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    131: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    132: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    133: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    134: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    135: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    136: "6d612b47-6405-4237-9b0c-7d639eb960ee",
    // NEXTERA SPHERE
    137: "a6b7c-32f3-423b-968e-9fd709b6ccc3",
    138: "a6b7c-32f3-423b-968e-9fd709b6ccc3",
    139: "a6b7c-32f3-423b-968e-9fd709b6ccc3",
    140: "a6b7c-32f3-423b-968e-9fd709b6ccc3"
}));

// Validate idMap on startup and log initialization
console.log(`idMap initialized with ${idMap.size} entries`);
if (idMap.size === 0) {
    throw new Error("ID mapping is empty. Please check configuration.");
}

// Function to handle the transaction
const handleTransactionAndPayout = async (chatId, order, type = "transaction") => {
    try {
        console.log(`Starting ${type} handling for order: ${order}`);
        
        let apiUrl;
        if (type === "transaction") {
            apiUrl = `https://server.sahulatpay.com/transactions/tele?merchantTransactionId=${order}`;
        } else if (type === "payout") {
            apiUrl = `${PAYOUT_API_URL}?merchantTransactionId=${order}`;
        } else {
            console.error("Invalid type specified.");
            await bot.sendMessage(chatId, "Invalid transaction type.");
            return;
        }

        console.log(`Making API request to: ${apiUrl}`);
        const response = await axios.get(apiUrl);
        console.log("API Response:", response.data);

        let transaction;
        if (type === "transaction") {
            transaction = response.data.transactions?.[0];
        } else {
            const payoutData = response.data?.data?.transactions;
            if (!payoutData || !payoutData.length) {
                console.log(`No transactions found for order: ${order}`);
                await bot.sendMessage(chatId, `Transaction (${order}) not found in back-office.`);
                return;
            }
            transaction = payoutData[0];
        }

        if (!transaction) {
            console.log(`Transaction with order ID ${order} not found.`);
            await bot.sendMessage(chatId, `Transaction "${order}" not found in back-office.`);
            return;
        }

        console.log("Transaction Details:", JSON.stringify(transaction, null, 2));

        let status = transaction.status.trim().toLowerCase();
        let merchantTransactionId = transaction.merchant_transaction_id || transaction.merchant_custom_order_id;
        let txn_id = transaction.transaction_id;
        let uid = transaction.merchant?.uid || transaction.merchant?.groups?.[0]?.uid || transaction.merchant?.groups?.[0]?.merchant?.uid;

        if (status === "completed") {
            let merchantTransactionId = type === "payout" 
                ? transaction.merchant_custom_order_id 
                : transaction.merchant_transaction_id; // Corrected field name
        
            if (!merchantTransactionId) {
                console.error("Error: merchantTransactionId is undefined.");
                await bot.sendMessage(chatId, "Error: Missing transaction ID.");
                return;
            }
        
            console.log(`Transaction ${merchantTransactionId} is already completed. TxnID: ${txn_id}`);
        
            // Determine the correct callback API based on type
            const callbackUrl = type === "payout" ? PAYOUT_CALLBACK_API_URL : CALLBACK_API_URL;
        
            try {
                const callbackResponse = await axios.post(callbackUrl, { transactionIds: [merchantTransactionId] });
                console.log("Callback API Response:", callbackResponse.data);
                await bot.sendMessage(chatId, `Transaction Status ${merchantTransactionId} : Completed.\n\nTxnID: ${txn_id}`);
            } catch (error) {
                console.error("Error calling callback API:", error.response?.data || error.message);
                await bot.sendMessage(chatId, "Error updating transaction status.");
            }
        
            return;
        }   
        // Only perform status inquiry if the transaction is not completed
        if (type === "transaction" && uid) {
            let providerName = transaction.providerDetails?.name?.toLowerCase();
            let inquiryUrl, inquiryResponse;

            if (providerName === "easypaisa") {
                // Fetch easyPaisaMerchantId from the transaction response
                let easyPaisaMerchantId = transaction.providerDetails?.id;
                console.log(`Retrieved easyPaisaMerchantId: ${easyPaisaMerchantId}`);

                // Map easyPaisaMerchantId to the corresponding id using idMap
                let mappedId = idMap.get(String(easyPaisaMerchantId));
                console.log(`Mapped ID for easyPaisaMerchantId ${easyPaisaMerchantId}: ${mappedId}`);

                if (!mappedId) {
                    console.error(`No mapped ID found for easyPaisaMerchantId: ${easyPaisaMerchantId}`);
                    await bot.sendMessage(chatId, "Merchant not found");
                    return;
                }

                // Get all unique UUIDs from idMap
                const uniqueMerchantIds = [...new Set(idMap.values())];
                console.log(`Unique merchant IDs: ${uniqueMerchantIds}`);

                // Try each unique merchant ID until a valid response is received
                for (const merchantId of uniqueMerchantIds) {
                    inquiryUrl = `https://server.sahulatpay.com/payment/inquiry-ep/${merchantId}?orderId=${order}`;
                    console.log(`Constructed inquiry URL: ${inquiryUrl}`);

                    try {
                        inquiryResponse = await axios.get(inquiryUrl, { params: { transaction_id: merchantTransactionId } });
                        console.log("Inquiry API Response:", inquiryResponse.data);

                        // Check if response indicates "Transaction Not Found"
                        if (
                            inquiryResponse.data.success === true &&
                            inquiryResponse.data.message === "Transaction Not Found" &&
                            inquiryResponse.data.data?.statusCode === 500 &&
                            inquiryResponse.data.statusCode === 200
                        ) {
                            console.log(`Transaction not found for merchant ID ${merchantId}, trying next ID`);
                            continue; // Try the next merchant ID
                        }

                        // Process valid response (FAILED or COMPLETED)
                        let inquiryStatus = inquiryResponse?.data?.data?.transactionStatus?.toLowerCase();
                        let inquiryStatusCode = inquiryResponse?.data?.data?.statusCode;

                        if (inquiryStatus === "failed" || inquiryStatusCode === 500) {
                            try {
                                await axios.post(FAIL_API_URL, { transactionIds: [merchantTransactionId] });
                                console.log(`Transaction ${merchantTransactionId} marked as failed.`);
                                await bot.sendMessage(chatId, ` ${merchantTransactionId} Status : Failed.`);
                            } catch (failError) {
                                console.error(`Error marking transaction ${merchantTransactionId} as failed:`, {
                                    message: failError.message,
                                    status: failError.response?.status,
                                    data: failError.response?.data
                                });
                                await bot.sendMessage(chatId, ` ${merchantTransactionId} Status : Failed.`);
                            }
                            return;
                        } else if (inquiryStatus === "completed") {
                            console.log(`Transaction ${merchantTransactionId} marked as completed.`);
                            await bot.sendMessage(chatId, `Transaction Status ${merchantTransactionId} : Completed.`);
                            try {
                                await axios.post(SETTLE_API_URL, { transactionId: merchantTransactionId });
                                console.log(`Easypaisa inquiry completed successfully for order ${order} with merchant ID ${merchantId}`);
                            } catch (settleError) {
                                console.error(`Error settling transaction ${merchantTransactionId}:`, {
                                    message: settleError.message,
                                    status: settleError.response?.status,
                                    data: settleError.response?.data
                                });
                            }
                            return;
                        }
                    } catch (error) {
                        console.error(`Error during inquiry for merchant ID ${merchantId}:`, {
                            message: error.message,
                            status: error.response?.status,
                            data: error.response?.data,
                            url: error.config?.url
                        });
                        continue; // Try the next merchant ID on error
                    }
                }

                // If all merchant IDs return "Transaction Not Found", mark as failed
                console.log(`All merchant IDs tried, transaction ${merchantTransactionId} not found. Marking as failed.`);
                try {
                    await axios.post(FAIL_API_URL, { transactionIds: [merchantTransactionId] });
                    console.log(`Transaction ${merchantTransactionId} marked as failed.`);
                    await bot.sendMessage(chatId, ` ${merchantTransactionId} Status : Failed.`);
                } catch (failError) {
                    console.error(`Error marking transaction ${merchantTransactionId} as failed:`, {
                        message: failError.message,
                        status: failError.response?.status,
                        data: failError.response?.data
                    });
                    await bot.sendMessage(chatId, ` ${merchantTransactionId} Status : Failed.`);
                }
                return;
            }
        }

        console.log(`Final Status for transaction ${merchantTransactionId}: Failed.`);
        try {
            await axios.post(FAIL_API_URL, { transactionIds: [merchantTransactionId] });
            await bot.sendMessage(chatId, ` ${merchantTransactionId} Status : Failed.`);
        } catch (failError) {
            console.error(`Error marking transaction ${merchantTransactionId} as failed:`, {
                message: failError.message,
                status: failError.response?.status,
                data: failError.response?.data
            });
            await bot.sendMessage(chatId, ` ${merchantTransactionId} Status : Failed.`);
        }
    } catch (error) {
        console.error(`Error handling transaction for order ${order}:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
        });
        let userMessage = "An error occurred while processing the transaction.";
        if (error.response?.status === 500) {
            userMessage = "Server error at SahulatPay. Please try again later or contact support.";
        }
        await bot.sendMessage(chatId, userMessage);
    }
};

// Handle /in command for transactions (multiple IDs supported)
bot.onText(/\/in (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const orders = match[1].trim().split(/\s+/); // Split message into multiple order IDs

    orders.forEach(order => {
        handleTransactionAndPayout(chatId, order, "transaction");
    });
});

// Handle /out command for payouts (multiple IDs supported)
bot.onText(/\/out (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const orders = match[1].trim().split(/\s+/); // Split message into multiple order IDs

    orders.forEach(order => {
        handleTransactionAndPayout(chatId, order, "payout");
    });
});

// Handle image messages with caption (multiple IDs supported)
bot.on("photo", (msg) => {
    const chatId = msg.chat.id;

    if (msg.caption) {
        const parts = msg.caption.split(/\s+/); // Split caption into words
        const command = parts[0];

        if (command === "/out" || command === "/in") {
            const type = command === "/out" ? "payout" : "transaction";
            const orders = parts.slice(1); // Extract all order IDs

            if (orders.length > 0) {
                orders.forEach(order => {
                    handleTransactionAndPayout(chatId, order.trim(), type);
                });
            } else {
                bot.sendMessage(chatId, "Please provide at least one order ID after the command.");
            }
        }
    }
});