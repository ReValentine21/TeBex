const express = require('express');
const crypto = require('crypto');
const app = express();

// Render сам выдаст нужный порт, оставляем этот параметр
const PORT = process.env.PORT || 3000;

// Сюда потом вставим твой секретный ключ от Tebex
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(express.json());

// Простая проверка, что сервер вообще запустился
app.get('/', (req, res) => {
    res.send('Сервер вебхуков работает!');
});

// Основной адрес для получения платежей от Tebex
app.post('/tebex-webhook', (req, res) => {
    const signature = req.headers['x-tebex-signature'];
    const rawBody = JSON.stringify(req.body);
    
    const hash = crypto.createHmac('sha256', WEBHOOK_SECRET)
                       .update(rawBody)
                       .digest('hex');
                       
    if (hash === signature) {
        const event = req.body;
        console.log('Вебхук успешно принят:', event);
        
        // [ЗДЕСЬ БУДЕТ КОД ДЛЯ ВЫДАЧИ ВАЛЮТЫ ИГРОКУ]
        
        res.status(200).send('OK');
    } else {
        console.log('Ошибка подписи вебхука');
        res.status(401).send('Недействительная подпись');
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
