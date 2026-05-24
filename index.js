const express = require('express');
const crypto = require('crypto');
const app = express();

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Перехватываем чистый body для точной проверки подписи
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// Проверка в браузере
app.get('/', (req, res) => {
    res.send('Сервер вебхуков Tebex успешно запущен и работает!');
});

// Конечная точка для приема вебхуков
app.post('/tebex-webhook', (req, res) => {
    const signature = req.headers['x-tebex-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    console.log('--- Получен запрос от Tebex ---');
    console.log('Тип события:', req.body ? req.body.type : 'неизвестно');

    // ХИТРОСТЬ: если ключ на Render не настроен, пускаем тест, чтобы привязать ссылку
    if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'твой_секретный_ключ_от_Tebex') {
        console.log('⚠️ Предупреждение: WEBHOOK_SECRET еще не настроен. Пропускаем проверку для валидации.');
        return res.status(200).json({ status: 'success', message: 'Validated' });
    }

    // Проверка настоящей подписи от Tebex
    const hash = crypto.createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    if (hash !== signature) {
        console.log('❌ Ошибка подписи! Проверь секретный ключ.');
        return res.status(401).send('Недействительная подпись');
    }

    // Если это просто проверка от Tebex
    if (req.body && req.body.type === 'validation') {
        console.log('✅ Проверочный вебхук успешно подтвержден!');
        return res.status(200).json({ status: 'success' });
    }

    // Тут обрабатываем реальные платежи
    const event = req.body;
    console.log(`✅ Принято событие: ${event.type}`);

    // [ЗДЕСЬ В БУДУЩЕМ БУДЕТ КОД ВЫДАЧИ ДОНАТА]

    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Сервер работает на порту ${PORT}`);
});
