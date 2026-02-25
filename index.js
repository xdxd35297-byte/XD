const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// UptimeRobot için Web Arayüzü
app.get("/", (req, res) => {
  res.send("Sistem Aktif! Büyük harf değişkenleri ve 3 mesaj modu çalışıyor.");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});

// Render Environment Variables (Büyük Harf Ayarları)
const tokensRaw = process.env.TOKENS; 
const channelIdsRaw = process.env.CHANNEL_IDS || process.env.CHANNEL_İDS; // İkisini de kontrol eder
const msgs = [
    process.env.MESSAGE1, 
    process.env.MESSAGE2, 
    process.env.MESSAGE3
];

// Hata Kontrolü
if (!tokensRaw || !channelIdsRaw || !msgs[0] || !msgs[1] || !msgs[2]) {
    console.error("HATA: Render panelindeki TOKENS, CHANNEL_IDS, MESSAGE1, MESSAGE2 veya MESSAGE3 eksik!");
} else {
    const tokenList = tokensRaw.split(",").map(t => t.trim());
    const channelList = channelIdsRaw.split(",").map(c => c.trim());

    // Döngü: 8 Saniye (8000ms)
    const cycleTime = 8000; 
    const staggerDelay = cycleTime / tokenList.length; 

    console.log(`${tokenList.length} bot, ${channelList.length} kanal için ${Math.round(staggerDelay)}ms aralıkla başlıyor.`);

    tokenList.forEach((token, index) => {
        const initialOffset = index * staggerDelay;

        setTimeout(() => {
            // İlk Mesaj
            sendToChannels(token, index + 1, channelList, msgs);

            // Periyodik Döngü
            setInterval(() => {
                sendToChannels(token, index + 1, channelList, msgs);
            }, cycleTime);

            console.log(`[Bot ${index + 1}] Sisteme girdi (+${Math.round(initialOffset)}ms)`);
        }, initialOffset);
    });
}

// Mesaj Gönderme Fonksiyonu
async function sendToChannels(token, botNum, channels, messages) {
    // 3 mesaj arasından rastgele seçim (%33 şans)
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    for (const channelId of channels) {
        try {
            await axios.post(
                `https://discord.com/api/v9/channels/${channelId}/messages`,
                { content: randomMsg },
                { headers: { Authorization: token } }
            );
            console.log(`[Bot ${botNum}] Başarılı -> Kanal: ${channelId}`);
        } catch (err) {
            if (err.response?.status === 429) {
                console.error(`[Bot ${botNum}] ⚠️ Hız Sınırı (Rate Limit)!`);
            } else {
                console.error(`[Bot ${botNum}] ❌ Hata Kodu: ${err.response?.status}`);
            }
        }
    }
}
