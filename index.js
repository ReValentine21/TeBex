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

// Проверка работы сервера в браузере
app.get('/', (req, res) => {
    res.send('Сервер вебхуков Tebex успешно запущен и работает!');
});

// Конечная точка для приема вебхуков
app.post('/tebex-webhook', (req, res) => {
    const signature = req.headers['x-tebex-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    console.log('--- Получен запрос от Tebex ---');
    console.log('Тип события:', req.body ? req.body.type : 'неизвестно');

    // 1. ПРОВЕРКА ВАЛИДАЦИИ: Ловим validation или validation.webhook
    if (req.body && req.body.type && req.body.type.startsWith('validation')) {
        console.log('✅ Получен проверочный запрос от Tebex. Отправляем ID обратно.');
        // Возвращаем JSON с id запроса, как того требует Tebex
        return res.status(200).json({ id: req.body.id });
    }

    // 2. ХИТРОСТЬ: если ключ на Render еще не настроен, временно пускаем дальше
    if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'твой_секретный_ключ_от_Tebex') {
        console.log('⚠️ Предупреждение: WEBHOOK_SECRET еще не настроен в Render. Пропускаем проверку подписи.');
        return res.status(200).json({ status: 'success', message: 'Bypassed' });
    }

    // 3. Проверка настоящей подписи от Tebex для реальных платежей
    const hash = crypto.createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    if (hash !== signature) {
        console.log('❌ Ошибка подписи! Проверь секретный ключ на Render.');
        return res.status(401).send('Недействительная подпись');
    }

    // 4. Обработка реальных платежей
    const event = req.body;
    console.log(`✅ Успешно обработано событие: ${event.type}`);

    // [ЗДЕСЬ В БУДУЩЕМ БУДЕТ КОД ВЫДАЧИ ДОНАТА В ИГРУ]

    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Сервер работает на порту ${PORT}`);
});
