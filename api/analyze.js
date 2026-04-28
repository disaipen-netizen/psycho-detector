// api/analyze.js — Vercel Serverless Function
// Поддерживает: текст, скриншот (GPT-4o Vision), голосовое (Whisper → GPT-4o)

import { Buffer } from "buffer";

const SYSTEM_PROMPT = `Ты — экспертный психоаналитический детектор коммуникаций. Проведи глубокий анализ переписки или расшифровки голосового сообщения.

Верни ответ СТРОГО в формате JSON без markdown и пояснений вне JSON:

{
  "name": "имя собеседника или Собеседник",
  "toxicity": 75,
  "psychotype": {
    "name": "Холодный Нарцисс",
    "icon": "🪞",
    "description": "Описание 1-2 предложения"
  },
  "manipulation_techniques": ["Газлайтинг", "Обесценивание"],
  "evidence": [
    { "quote": "цитата", "label": "Газлайтинг", "explanation": "объяснение" },
    { "quote": "цитата", "label": "Изоляция",   "explanation": "объяснение" }
  ],
  "dark_traits": { "manipulation": 9, "empathy": 2, "dominance": 8 },
  "boundary_violation": "Как нарушает границы",
  "main_weakness": "Главный страх и триггер",
  "ideal_response": "Точная фраза для ответа",
  "summary": "Итоговый вывод 2-3 предложения"
}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY не задан в Vercel Environment Variables" });

  const { text, image, audio, audioType } = req.body || {};
  if (!text && !image && !audio) return res.status(400).json({ error: "Нужен text, image или audio" });

  try {
    let analysisText = text || null;

    // ── 1. Голосовое → Whisper расшифровка ──────────────────────────────────
    if (audio) {
      const audioBuffer = Buffer.from(audio, "base64");
      const formData = new FormData();
      const mimeType = audioType || "audio/webm";
      const ext = mimeType.includes("mp3") ? "mp3" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("m4a") ? "m4a" : "webm";
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, `audio.${ext}`);
      formData.append("model", "whisper-1");
      formData.append("language", "ru");
      formData.append("response_format", "text");

      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (!whisperRes.ok) {
        const err = await whisperRes.json();
        return res.status(500).json({ error: "Ошибка расшифровки голосового: " + (err.error?.message || "unknown") });
      }

      analysisText = await whisperRes.text();
      if (!analysisText?.trim()) return res.status(400).json({ error: "Не удалось расшифровать аудио. Попробуй с более чётким звуком." });
      analysisText = `[Расшифровка голосового сообщения]\n\n${analysisText}`;
    }

    // ── 2. gpt-4o-mini анализ ─────────────────────────────────────────────────────
    let userContent;
    if (image) {
      userContent = [
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}`, detail: "high" } },
        { type: "text", text: "Прочитай переписку на скриншоте и проведи полный психологический анализ согласно инструкции." },
      ];
    } else {
      userContent = `Проведи полный психологический анализ:\n\n${analysisText}`;
    }

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1500,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!gptRes.ok) {
      const err = await gptRes.json();
      return res.status(500).json({ error: err.error?.message || "Ошибка OpenAI" });
    }

    const gptData = await gptRes.json();
    const raw = gptData.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    // Если было голосовое — добавляем расшифровку в ответ
    if (audio && analysisText) result.transcription = analysisText;

    return res.status(200).json(result);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Ошибка сервера: " + e.message });
  }
}
