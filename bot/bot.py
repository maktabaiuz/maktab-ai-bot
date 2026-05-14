import os
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEBAPP_URL = os.getenv("WEBAPP_URL", "https://maktab-ai-one.vercel.app")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    name = user.first_name or "O'quvchi"

    keyboard = [[
        InlineKeyboardButton(
            "📚 MAKTAB AI ni ochish",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"Salom, {name}! 👋\n\n"
        "🎓 *MAKTAB AI* ga xush kelibsiz!\n\n"
        "Bu O'zbekiston 1-11 sinf o'quvchilari uchun AI mentor.\n"
        "• Darslik asosida tushuntiradi\n"
        "• Sizning yoshingizga mos tilda gapiradi\n"
        "• Test topshirishingizga yordam beradi\n\n"
        "Quyidagi tugmani bosib boshlang! ⬇️",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📚 *MAKTAB AI — Yordam*\n\n"
        "/start — Botni ishga tushirish\n"
        "/help — Yordam\n\n"
        "Web ilovani ochish uchun /start buyrug'ini yuboring.",
        parse_mode="Markdown"
    )


def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN topilmadi!")
        return

    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))

    logger.info("Bot ishga tushdi...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
