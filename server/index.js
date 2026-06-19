require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const BANNED = ['porno','seks','eryotik','narkotik','terror','bomb','yasiliq','qotil'];
function isBanned(text = '') {
  const lower = text.toLowerCase();
  return BANNED.some(w => lower.includes(w));
}

app.post('/api/chat', async (req, res) => {
  const { grade, subject, message, mode, text } = req.body;

  if (isBanned(message || text)) {
    return res.json({ reply: "Kechirasiz, bu mavzuda javob bera olmayman. O'quv mavzusiga qaytaylik 📚" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let userMessage, systemText;

    if (mode === 'explain') {
      systemText = `Sen Maktab AI yordamchisisisan. Maqolalarni o'zbek tilida, maktab o'quvchilari tushunadigan sodda tilda qisqacha tushuntir. Maksimum 150 so'z.`;
      userMessage = `Quyidagi maqolani sodda tushuntir:\n\n${text}`;
    } else {
      systemText = `Sen Maktab AI repetitorisan — O'zbekiston maktab o'quvchilari uchun yordamchi. Foydalanuvchi ${grade || '?'}-sinf ${subject || 'umumiy'} fanidan savol bermoqda.

Qoidalar:
- Faqat o'zbek tilida (lotin alifbosi) javob ber
- Yoshga mos va sodda tushuntir
- Javobni to'g'ridan-to'g'ri berma — qadam-baqadam yo'naltir, o'quvchini o'ylashga unda
- O'zbekiston o'quv dasturi (Xalq ta'limi vazirligi darsliklari) doirasida javob ber
- Maksimum 5-6 jumla, aniq va qisqa
- MUHIM: siyosiy, diniy, kattalarga oid yoki nomaqbul mavzularni mutlaqo muhokama qilma`;
      userMessage = message;
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemText }] },
      generationConfig: { maxOutputTokens: 600, temperature: 0.4 }
    });

    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ reply: "Kechirasiz, xato yuz berdi. Qayta urinib ko'ring." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Maktab AI server http://localhost:${PORT} da ishlamoqda`));
