// Restaurant waiter bot — button based, no typing required.
// Flow: /order -> pick table -> pick items (multi-tap) -> Done -> sends to website

const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");

const BOT_TOKEN = process.env.BOT_TOKEN || "8882540037:AAEsT1SnoBxEBUhV_WDa6f1i8cBFZggadXw";
const WEBSITE_URL = process.env.WEBSITE_URL || "https://restaurant-order-app-qnd8.onrender.com/order";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// In-memory state per waiter chat (fine for testing / single-instance use)
// { chatId: { table: "5", items: ["Lagmon", "Cola"] } }
const sessions = {};

const MENU = [
  { label: "🍜 Lagmon", data: "item_lagmon" },
  { label: "🍚 Osh", data: "item_osh" },
  { label: "🍢 Shashlik", data: "item_shashlik" },
  { label: "🥤 Cola", data: "item_cola" },
];

function tableKeyboard() {
  const rows = [];
  for (let r = 0; r < 2; r++) {
    const row = [];
    for (let c = 1; c <= 5; c++) {
      const n = r * 5 + c;
      row.push({ text: String(n), callback_data: `table_${n}` });
    }
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

function menuKeyboard(selectedItems = []) {
  const rows = [];
  for (let i = 0; i < MENU.length; i += 2) {
    rows.push(
      MENU.slice(i, i + 2).map(m => ({ text: m.label, callback_data: m.data }))
    );
  }
  const doneLabel = selectedItems.length
    ? `✅ Done (${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""})`
    : "✅ Done";
  rows.push([{ text: doneLabel, callback_data: "done" }]);
  return { inline_keyboard: rows };
}

// /order command -> show table picker
bot.onText(/\/order/, (msg) => {
  const chatId = msg.chat.id;
  sessions[chatId] = { table: null, items: [] };
  bot.sendMessage(chatId, "Pick a table:", { reply_markup: tableKeyboard() });
});

// Handle all button taps
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const session = sessions[chatId] || { table: null, items: [] };

  if (data.startsWith("table_")) {
    session.table = data.replace("table_", "");
    sessions[chatId] = session;
    await bot.answerCallbackQuery(query.id, { text: `Table ${session.table} selected` });
    await bot.editMessageText(`Table ${session.table} — now pick items:`, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: menuKeyboard(session.items),
    });
    return;
  }

  if (data.startsWith("item_")) {
    const itemKey = data.replace("item_", "");
    const menuItem = MENU.find(m => m.data === data);
    const label = menuItem ? menuItem.label.replace(/^[^\s]+\s/, "") : itemKey; // strip emoji
    session.items.push(label);
    sessions[chatId] = session;
    await bot.answerCallbackQuery(query.id, { text: `${label} added` });
    await bot.editMessageReplyMarkup(menuKeyboard(session.items), {
      chat_id: chatId,
      message_id: query.message.message_id,
    });
    return;
  }

  if (data === "done") {
    if (!session.table) {
      await bot.answerCallbackQuery(query.id, { text: "Pick a table first!", show_alert: true });
      return;
    }
    if (!session.items.length) {
      await bot.answerCallbackQuery(query.id, { text: "Add at least one item!", show_alert: true });
      return;
    }

    await bot.answerCallbackQuery(query.id, { text: "Sending order..." });

    try {
      const res = await fetch(WEBSITE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seat: session.table,
          items: session.items,
          waiter: query.from.first_name || "Waiter",
        }),
      });

      if (!res.ok) throw new Error(`Website responded ${res.status}`);

      await bot.editMessageText(
        `✅ Order sent!\nTable ${session.table}: ${session.items.join(", ")}`,
        { chat_id: chatId, message_id: query.message.message_id }
      );
    } catch (err) {
      console.error("Failed to send order:", err);
      await bot.sendMessage(chatId, "❌ Failed to send order to website. Try /order again.");
    }

    delete sessions[chatId];
    return;
  }
});

console.log("Waiter bot running...");
