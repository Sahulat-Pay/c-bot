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
const BOT_TOKEN = "7737325834:AAG_yhkEnWVBesbaDgz7zwVc5h9-WaXHWJQ";

// Create a bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// API URLs
const CALLBACK_API_URL = "https://server.sahulatpay.com/backoffice/payin-callback";
const SETTLE_API_URL = "https://server.sahulatpay.com/backoffice/settle-transactions/tele";
const PAYOUT_API_URL = "https://server.sahulatpay.com/disbursement/tele";
const PAYOUT_CALLBACK_API_URL = "https://api.sahulatpay.com/backoffice/payout-callback";
const FAIL_API_URL = "https://api.sahulatpay.com/backoffice/fail-transactions/tele";

// Mapping of merchant IDs to UUIDs
const uidMap = {
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
  119: "a0eb8ba1-8962-4766-8acb-945fce7dc0c3",
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
  137: "cc961e51-8c0e-44d4-9c25-56e39e992b88",
  138: "cc961e51-8c0e-44d4-9c25-56e39e992b88",
  139: "cc961e51-8c0e-44d4-9c25-56e39e992b88",
  140: "cc961e51-8c0e-44d4-9c25-56e39e992b88",
  // JazzCash Merchant IDs
  7: "6d612b47-6405-4237-9b0c-7d639eb960ee", // SASTA TECH SOLUTIONS
  11: "a0eb8ba1-8962-4766-8acb-945fce7dc0c3", // DEVINERA TECHNOLOGIES
  32: "3c0ba58b-5a69-4376-b40d-4d497d561ba2", // THINK TECH CONSULTANCY
  27: "cc961e51-8c0e-44d4-9c25-56e39e992b88" // NEXTERA SPHERE
};

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

    let status = transaction.status?.trim().toLowerCase();
    let merchantTransactionId = transaction.merchant_transaction_id || transaction.merchant_custom_order_id;
    let txn_id = transaction.transaction_id;

    if (!merchantTransactionId) {
      console.error("Error: merchantTransactionId is undefined.");
      await bot.sendMessage(chatId, "Error: Missing transaction ID.");
      return;
    }

    if (status === "completed") {
      console.log(`Transaction ${merchantTransactionId} is already completed. TxnID: ${txn_id}`);

      // Determine the correct callback API based on type
      const callbackUrl = type === "payout" ? PAYOUT_CALLBACK_API_URL : CALLBACK_API_URL;

      try {
        const callbackResponse = await axios.post(callbackUrl, { transactionIds: [merchantTransactionId] });
        console.log("Callback API Response:", callbackResponse.data);
        await bot.sendMessage(chatId, `Transaction Status ${merchantTransactionId}: Completed.\n\nTxnID: ${txn_id}`);
      } catch (error) {
        console.error("Error calling callback API:", error.response?.data || error.message);
        await bot.sendMessage(chatId, "Error updating transaction status.");
      }
      return;
    }

    // Only perform status inquiry for transactions (not payouts) if not completed
    if (type === "transaction" && uidMap) {
      let providerName = transaction.providerDetails?.name?.toLowerCase();
      let inquiryUrl, inquiryResponse;

      if (providerName === "easypaisa") {
        let easyPaisaMerchantId = transaction.providerDetails?.id;
        console.log(`Retrieved easyPaisaMerchantId: ${easyPaisaMerchantId}`);

        // Map easyPaisaMerchantId to the corresponding UUID using uidMap
        let mappedId = uidMap[easyPaisaMerchantId];
        console.log(`Mapped ID for easyPaisaMerchantId ${easyPaisaMerchantId}: ${mappedId}`);

        if (mappedId) {
          inquiryUrl = `https://api.sahulatpay.com/payment/inquiry-ep/${mappedId}?orderId=${order}`;
          inquiryResponse = await axios.get(inquiryUrl, { params: { transaction_id: merchantTransactionId } });
        } else {
          let uid = transaction.merchant?.uid || transaction.merchant?.groups?.[0]?.uid || transaction.merchant?.groups?.[0]?.merchant?.uid;
          if (uid) {
            inquiryUrl = `https://api.sahulatpay.com/payment/inquiry-ep/${uid}?orderId=${order}`;
            inquiryResponse = await axios.get(inquiryUrl, { params: { transaction_id: merchantTransactionId } });
          } else {
            console.error(`No UID found for transaction ${merchantTransactionId}`);
            await bot.sendMessage(chatId, `No merchant mapping found for transaction ${merchantTransactionId}.`);
            return;
          }
        }
      } else if (providerName === "jazzcash") {
        let jazzCashMerchantId = transaction.providerDetails?.id;
        let mappedId = uidMap[jazzCashMerchantId];

        if (mappedId) {
          inquiryUrl = `https://server.sahulatpay.com/payment/simple-status-inquiry/${mappedId}?transactionId=${order}`;
          inquiryResponse = await axios.get(inquiryUrl, { params: { transaction_id: merchantTransactionId } });
        } else {
          let uid = transaction.merchant?.uid || transaction.merchant?.groups?.[0]?.uid || transaction.merchant?.groups?.[0]?.merchant?.uid;
          if (uid) {
            inquiryUrl = `https://api.sahulatpay.com/payment/status-inquiry/${uid}`;
            inquiryResponse = await axios.post(inquiryUrl, { transactionId: merchantTransactionId });
          } else {
            console.error(`No UID found for transaction ${merchantTransactionId}`);
            await bot.sendMessage(chatId, `No merchant mapping found for transaction ${merchantTransactionId}.`);
            return;
          }
        }
      }

      if (inquiryResponse) {
        console.log("Inquiry API Response:", inquiryResponse.data);
        let inquiryStatus = inquiryResponse?.data?.data?.transactionStatus?.toLowerCase();
        let inquiryStatusCode = inquiryResponse?.data?.data?.statusCode;

        if (inquiryStatus === "completed") {
          await axios.post(SETTLE_API_URL, { transactionId: merchantTransactionId });
          console.log(`Transaction ${merchantTransactionId} marked as completed.`);
          await bot.sendMessage(chatId, `Transaction Status ${merchantTransactionId}: Completed.`);
          return;
        } else if (!inquiryStatus || inquiryStatus === "failed" || inquiryStatusCode === 500) {
          await axios.post(FAIL_API_URL, { transactionIds: [merchantTransactionId] });
          console.log(`Transaction ${merchantTransactionId} marked as failed.`);
          await bot.sendMessage(chatId, `${merchantTransactionId} Status: Failed.`);
          return;
        }
      }
    }

    console.log(`Final Status for transaction ${merchantTransactionId}: Failed.`);
    await bot.sendMessage(chatId, `${merchantTransactionId} Status: Failed.`);
  } catch (error) {
    console.error("Error handling transaction:", error);
    await bot.sendMessage(chatId, `Error: ${error.message}`);
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