// api/analyze.js — поддержка текста, одного/нескольких скриншотов, голосовых
import { Buffer } from "buffer";

const SYSTEM_PROMPT = `Ты — экспертный психоаналитический детектор коммуникаций.

ВАЖНО: Анализируй ТОЛЬКО собеседника — того с кем общается пользователь. НЕ анализируй самого пользователя и НЕ цитируй его сообщения как улики. Пользователь — это тот кто прислал переписку на анализ. Собеседник — это другой человек в переписке.

Если переписка из Telegram или WhatsApp — сообщения пользователя обычно справа или отмечены другим цветом. Анализируй только сообщения собеседника (левая сторона / другой цвет).

Анализируй переписку и выяви психологические паттерны и манипуляции СОБЕСЕДНИКА.

Верни ответ СТРОГО в формате JSON без markdown:

{
  "name": "имя собеседника или Собеседник",
  "toxicity": 75,
  "psychotype": { "name": "Холодный Нарцисс", "icon": "🪞", "description": "1-2 предложения" },
  "manipulation_techniques": ["Газлайтинг", "Обесценивание"],
  "evidence": [
    { "quote": "цитата", "label": "Газлайтинг", "explanation": "объяснение" },
    { "quote": "цитата", "label": "Изоляция", "explanation": "объяснение" }
  ],
  "dark_traits": { "manipulation": 9, "empathy": 2, "dominance": 8 },
  "boundary_violation": "Как нарушает границы",
  "main_weakness": "Главный страх и триггер",
  "ideal_response": "Точная фраза для ответа",
  "summary": "Итоговый вывод 2-3 предложения",
  "advice": {
    "title": "Совет психолога",
    "short": "Одна ключевая рекомендация — как вести себя с этим типом человека (1 предложение)",
    "tactics": [
      "Конкретный тактический совет 1",
      "Конкретный тактический совет 2",
      "Конкретный тактический совет 3"
    ],
    "warning": "Главное чего НЕ надо делать с этим типом"
  }
}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY не задан в Vercel Environment Variables" });

  // Поддерживаем оба формата: один файл и массив файлов
  let { text, image, images, imageTypes, audio, audios, audioTypes } = req.body || {};

  // Нормализуем — приводим к массивам
  if (image && !images) { images = [image]; imageTypes = ["image/jpeg"]; }
  if (audio && !audios) { audios = [audio]; audioTypes = [audioTypes || "audio/webm"]; }

  const hasImages = images?.length > 0;
  const hasAudios = audios?.length > 0;
  const hasText   = text?.trim?.().length > 0;

  if (!hasImages && !hasAudios && !hasText)
    return res.status(400).json({ error: "Нужен text, image(s) или audio(s)" });

  try {
    let analysisText = text || null;

    // ── 1. Голосовые → Whisper (параллельно) ────────────────────────────────
    if (hasAudios) {
      const transcriptions = await Promise.all(
        audios.map(async (b64, i) => {
          const mimeType = audioTypes?.[i] || "audio/webm";
          const ext = mimeType.includes("mp3")?"mp3":mimeType.includes("ogg")?"ogg":mimeType.includes("m4a")?"m4a":"webm";
          const buf = Buffer.from(b64, "base64");
          const blob = new Blob([buf], { type: mimeType });
          const form = new FormData();
          form.append("file", blob, `audio_${i}.${ext}`);
          form.append("model", "whisper-1");
          form.append("language", "ru");
          form.append("response_format", "text");
          const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: form,
          });
          if (!r.ok) throw new Error("Whisper error on file " + i);
          return await r.text();
        })
      );
      analysisText = transcriptions
        .map((t, i) => audios.length > 1 ? `[Голосовое ${i+1}]\n${t}` : t)
        .join("\n\n");
    }

    // ── 2. Строим user message для GPT-4o ───────────────────────────────────
    let userContent;

    if (hasImages) {
      userContent = [
        ...images.map((b64, i) => ({
          type: "image_url",
          image_url: {
            url: `data:${imageTypes?.[i] || "image/jpeg"};base64,${b64}`,
            detail: "high",
          },
        })),
        {
          type: "text",
          text: images.length > 1
            ? `Это ${images.length} скриншотов одной переписки. Прочитай весь текст скриншотов. Сообщения пользователя обычно справа — НЕ анализируй их и НЕ цитируй. Анализируй ТОЛЬКО собеседника (левая сторона). Объедини хронологически и проведи полный анализ.`
            : "Прочитай переписку на скриншоте. Сообщения пользователя обычно справа или другого цвета — их НЕ анализируй. Анализируй ТОЛЬКО собеседника (левая сторона / другой цвет). Проведи полный психологический анализ собеседника.",
        },
      ];
    } else {
      const prefix = hasAudios && audios.length > 1
        ? `Это расшифровка ${audios.length} голосовых сообщений собеседника. Анализируй ТОЛЬКО собеседника — того кто говорит в этих голосовых. Проведи полный психологический анализ:`
        : "Проведи полный психологический анализ переписки:";
      userContent = `${prefix}\n\n${analysisText}`;
    }

    // ── 3. GPT-4o анализ ─────────────────────────────────────────────────────
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

    const raw = (await gptRes.json()).choices[0].message.content;
    const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (analysisText && hasAudios) result.transcription = analysisText;

    // Считаем реальный запрос
    try {
      const origin = req.headers.origin || "https://psycho-detector-ye1y.vercel.app";
      fetch(`${origin}/api/counter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: req.headers["x-forwarded-for"] || "anon" })
      }).catch(()=>{});
    } catch(e) {}

    return res.status(200).json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Ошибка сервера: " + e.message });
  }
}
