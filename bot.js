// bot.js
require("dotenv").config();
const { Bot } = require("grammy");

function startBot() {
  const bot = new Bot(process.env.BOT_TOKEN);

  // Команда /start
  bot.command("start", async (ctx) => {
    await ctx.reply("Привет! Нажмите кнопку, чтобы открыть Склад", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть Склад",
              web_app: { url: process.env.WEBAPP_URL },
            },
          ],
        ],
      },
    });
  });

  bot.start({
    onStart: ({ username }) =>
      console.log(`🤖 Бот @${username} запущен (polling)`),
  });
}

module.exports = { startBot };
