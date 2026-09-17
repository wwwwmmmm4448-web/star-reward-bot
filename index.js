const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const BOT_TOKEN = '8827163418:AAGyXEd4wd7KAPf22tG69wUGTh2ZH4P9YPg';
const ADMIN_ID = 7796325082; // آيدي المالك الخاص بك
const bot = new Telegraf(BOT_TOKEN);
const app = express();

app.use(express.json());

const userAdsProgress = {};
const userStarsBalance = {};
const userWallets = {};
let totalBotViews = 0;
const uniqueUsers = new Set();

bot.start((ctx) => {
    const userId = ctx.from.id;
    uniqueUsers.add(userId);

    if (!userAdsProgress[userId]) userAdsProgress[userId] = 0;
    if (!userStarsBalance[userId]) userStarsBalance[userId] = 0;

    const watched = userAdsProgress[userId];
    const currentCycle = watched % 25;
    const remaining = 25 - currentCycle;
    const stars = userStarsBalance[userId];
    const hasWallet = userWallets[userId] ? '✅ مربوطة' : '❌ غير مربوطة';

    let menuButtons = [
        [Markup.button.callback('🎬 مشاهدة إعلان جديد', 'watch_ad')],
        [Markup.button.callback('📊 عدادي وإحصائياتي', 'my_stats')],
        [Markup.button.callback('💳 ربط أو تغيير محفظة TON', 'set_wallet')],
        [Markup.button.callback('⭐ سحب النجوم المكتسبة', 'withdraw_stars')]
    ];

    if (userId === ADMIN_ID) {
        menuButtons.push([Markup.button.callback('👑 لوحة تحكم المالك والأرباح', 'admin_panel')]);
    }

    ctx.reply(
        `🌟 أهلاً بك في بوت مكافآت النجوم الذكي\n\n` +
        `👤 حالة محفظتك: ${hasWallet}\n` +
        `⭐ رصيدك القابل للسحب: ${stars} نجمة\n` +
        `📈 إعلانات الدورة الحالية: ${currentCycle}/25 (متبقي ${remaining} إعلان)\n\n` +
        `اختر ما تحتاجه من القائمة أدناه:`,
        Markup.inlineKeyboard(menuButtons)
    );
});

bot.action('my_stats', (ctx) => {
    const userId = ctx.from.id;
    const watched = userAdsProgress[userId] || 0;
    const stars = userStarsBalance[userId] || 0;
    const remaining = 25 - (watched % 25);
    const wallet = userWallets[userId] || 'لم تقم بربط محفظة بعد';

    ctx.answerCbQuery();
    ctx.editMessageText(
        `📊 **عدادك الشخصي:**\n\n` +
        `- إجمالي الإعلانات المشاهدة: ${watched}\n` +
        `- المتبقي لإتمام النجمة التالية: ${remaining} إعلان\n` +
        `- رصيدك الجاهز للسحب: ${stars} نجمة\n` +
        `- محفظتك المسجلة: ${wallet}`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔙 رجوع للقائمة الرئيسية', 'main_menu')]
        ])
    );
});

bot.action('set_wallet', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('لربط محفظة TON الخاصة بك، يرجى إرسال عنوان محفظتك (مثال: UQD...) في رسالة هنا، وسيتم حفظها تلقائياً.');
});

bot.on('text', (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;

    if (text.startsWith('UQ') || text.startsWith('EQ') || text.length > 40) {
        userWallets[userId] = text;
        return ctx.reply('✅ تم حفظ محفظة TON الخاصة بك بنجاح! يمكنك الآن سحب نجومك في أي وقت.');
    }
});

bot.action('withdraw_stars', (ctx) => {
    const userId = ctx.from.id;
    const stars = userStarsBalance[userId] || 0;
    const wallet = userWallets[userId];

    ctx.answerCbQuery();

    if (!wallet) {
        return ctx.reply('⚠️ عذراً، يجب عليك ربط محفظة TON أولاً قبل طلب السحب.');
    }

    if (stars <= 0) {
        return ctx.reply('⚠️ رصيدك من النجوم الصافية هو 0. أكمل مشاهدة الإعلانات لتجميع النجوم أولاً!');
    }

    userStarsBalance[userId] = 0;
    ctx.reply(`🎉 تم استلام طلب سحب (${stars} نجمة) إلى محفظتك المربوطة:\n` + `${wallet}\n\n` + `سيتم المعالجة والإرسال قريباً!`);
});

bot.action('admin_panel', (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID) {
        return ctx.answerCbQuery('هذه اللوحة خاصة بمالك البوت فقط!');
    }

    ctx.answerCbQuery();
    ctx.editMessageText(
        `👑 **لوحة تحكم المالك:**\n\n` +
        `👥 إجمالي عدد المستخدمين: ${uniqueUsers.size}\n` +
        `📺 إجمالي الإعلانات المشاهدة بالبوت: ${totalBotViews}\n` +
        `💰 الأرباح والتحليلات: مسجلة وموجهة بالكامل لمحفظة TON المرتبطة بلوحة تحكم Adsgram.\n\n` +
        `ملاحظة: يمكنك كمالك الحصول على صلاحيات خاصة أو تعديل الأرصدة متى شئت.`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🎁 إضافة نجمة لنفسي (تخطي الإعلانات للمالك)', 'admin_free_star')],
            [Markup.button.callback('🔙 رجوع للقائمة الرئيسية', 'main_menu')]
        ])
    );
});

bot.action('admin_free_star', (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID) return;

    if (!userStarsBalance[userId]) userStarsBalance[userId] = 0;
    userStarsBalance[userId] += 1;

    ctx.answerCbQuery('تمت إضافة نجمة لحسابك كمالك بنجاح!');
    ctx.reply(`⭐ تمت إضافة نجمة واحدة لحسابك كمالك دون الحاجة لمشاهدة 25 إعلاناً. رصيدك الآن: ${userStarsBalance[userId]} نجمة.`);
});

bot.action('main_menu', (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText(
        `🌟 أهلاً بك مرة أخرى في القائمة الرئيسية للبوت.`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🎬 مشاهدة إعلان جديد', 'watch_ad')],
            [Markup.button.callback('📊 عدادي وإحصائياتي', 'my_stats')],
            [Markup.button.callback('💳 ربط أو تغيير محفظة TON', 'set_wallet')],
            [Markup.button.callback('⭐ سحب النجوم المكتسبة', 'withdraw_stars')]
        ])
    );
});

bot.action('watch_ad', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
        `🎬 **مشغل الإعلانات المعتمد (الوحدة: bot-48267):**\n\n` +
        `اضغط على رابط الإعلان وشاهد الفيديو بالكامل حتى النهاية ليتم احتساب المشاهدة تلقائياً في عدادك وتحديث تقدمك نحو النجمة!`
    );
});

app.get('/adsgram-webhook', (req, res) => {
    const userId = req.query.userid;
    
    if (!userId) {
        return res.status(400).send('Missing user ID');
    }

    if (!userAdsProgress[userId]) userAdsProgress[userId] = 0;
    if (!userStarsBalance[userId]) userStarsBalance[userId] = 0;

    userAdsProgress[userId] += 1;
    totalBotViews += 1;

    if (userAdsProgress[userId] % 25 === 0) {
        userStarsBalance[userId] += 1;
    }

    return res.status(200).send('Webhook processed successfully.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

bot.launch().then(() => {
    console.log('Bot is online with full owner controls!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
