const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Sistem Aktif! 3 Farklı Mesaj Modu ve Çoklu Kanal Desteği Çalışıyor.");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});

// Render Environment Variables (Yeni İsimler)
const tokensRaw = process.env.tokens; 
const kanalIdsRaw = process.env.kanal_ids;
const msgs = [process.env.message1, process.env.message2, process.env.message3];

if (!tokensRaw || !kanalIdsRaw || !msgs[0] || !msgs[1] || !msgs[2]) {
    console.error("HATA: Değişkenler (tokens, kanal_ids veya mesajlar) eksik! Render panelini kontrol et.");
} else {
    const tokenList = tokensRaw.split(",").map(t => t.trim());
    const channelList = kanalIdsRaw.split(",").map(c => c.trim());

    // Döngü Ayarları (8 Saniye)
    const cycleTime = 8000; 
    const staggerDelay = cycleTime / tokenList.length; 

    console.log(`${tokenList.length} bot için ${Math.round(staggerDelay)}ms aralıklı düzen kuruldu.`);

    tokenList.forEach((token, index) => {
        const initialOffset = index * staggerDelay;

        setTimeout(() => {
            // İlk tetikleme
            sendToAllChannels(token, index + 1);

            // Periyodik döngü
            setInterval(() => {
                sendToAllChannels(token, index + 1);
            }, cycleTime);

            console.log(`[Bot ${index + 1}] Kuyruğa eklendi (+${Math.round(initialOffset)}ms)`);
        }, initialOffset);
    });
}

// Tüm kanallara rastgele mesaj gönderen fonksiyon
async function sendToAllChannels(token, botNum) {
    // Rastgele mesaj seçimi (%33.3 ihtimal)
    const randomMessage = msgs[Math.floor(Math.random() * msgs.length)];

    for (const channelId of channelList) {
        try {
            await axios.post(
                `https://discord.com/api/v9/channels/${channelId}/messages`,
                { content: randomMessage },
                { headers: { Authorization: token } }
            );
            console.log(`[Bot ${botNum}] Mesaj Gönderildi -> Kanal: ${channelId}`);
        } catch (err) {
            if (err.response?.status === 429) {
                console.error(`[Bot ${botNum}] ⚠️ Hız sınırı (Rate Limit)!`);
            } else {
                console.error(`[Bot ${botNum}] ❌ Hata: ${err.response?.status}`);
            }
        }
    }
}
