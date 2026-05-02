// api/analyze.js — Claude (Anthropic) для анализа + Whisper (OpenAI) для голосовых

const SYSTEM_PROMPT = `Ты — экспертный психоаналитический детектор коммуникаций.

ВАЖНЕЙШЕЕ ПРАВИЛО: Тебе скажут кого именно анализировать — собеседника или автора. Строго следуй этому указанию. Анализируй ТОЛЬКО одного человека, не обоих.

КАЛИБРОВКА ТОКСИЧНОСТИ — будь честным и точным:
- Обычный флирт, шутки, лёгкое общение = токсичность 0-20%
- Небольшая закрытость, уклончивость, эгоцентризм = 20-35%
- Систематические манипуляции, обесценивание = 35-60%
- Явный газлайтинг, абьюз, контроль = 60-85%
- Крайние случаи угроз, насилия = 85-100%

ПРАВИЛА ИНТЕРПРЕТАЦИИ — не натягивай:
- Обычные вопросы "где ты?", "какие планы?" — НЕ контроль
- Флиртовые шутки и игривость — НЕ манипуляция  
- Рассказ о себе в ответ — НЕ всегда нарциссизм
- Предложение помочь — НЕ нарушение границ
- Оцени ПАТТЕРН в целом, а не отдельные фразы вырванные из контекста
- Один эгоцентричный ответ ≠ манипулятор, нужна систематика
- Флирт и романтическое общение имеют свою логику — учитывай это
- Если переписка в целом здоровая — честно скажи об этом

Когда анализируешь СОБЕСЕДНИКА:
- Это человек с которым общается пользователь
- На скриншотах Telegram/WhatsApp — обычно левая сторона или серые пузыри
- НЕ цитируй и НЕ анализируй сообщения пользователя (зелёные/синие пузыри, правая сторона)
- Если видишь имя или аватарку собеседника — используй его имя

Когда анализируешь АВТОРА (самого пользователя):
- Это правая сторона / зелёные или синие пузыри
- Анализируй как он выглядит со стороны

Верни ответ СТРОГО в формате JSON без markdown:

{
  "name": "имя собеседника из переписки или Собеседник",
  "toxicity": 75,
  "psychotype": {
    "name": "Холодный Нарцисс",
    "icon": "🪞",
    "description": "Описание 1-2 предложения"
  },
  "manipulation_techniques": ["Газлайтинг", "Обесценивание"],
  "evidence": [
    { "quote": "точная цитата только от анализируемого человека", "label": "Газлайтинг", "explanation": "объяснение" },
    { "quote": "ещё одна цитата только от анализируемого", "label": "Изоляция", "explanation": "объяснение" }
  ],
  "dark_traits": { "manipulation": 9, "empathy": 2, "dominance": 8 },
  "boundary_violation": "Как нарушает границы",
  "main_weakness": "Главный страх и триггер",
  "ideal_response": "Точная фраза для ответа",
  "summary": "Итоговый вывод 2-3 предложения",
  "advice": {
    "title": "Совет психолога",
    "short": "Ключевая рекомендация как вести себя с этим типом",
    "tactics": ["Совет 1", "Совет 2", "Совет 3"],
    "warning": "Главное чего НЕ надо делать"
  }
}`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_KEY = process.env.OPENAI_API_KEY; // только для Whisper

  if (!CLAUDE_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY не задан в Vercel Environment Variables" });

  let { text, image, images, imageTypes, audio, audios, audioTypes, analyzeTarget, imageContext } = req.body || {};
  const analyzeMe = analyzeTarget === "me";
  const targetDescription = analyzeMe
    ? "автора переписки (правая сторона, зелёные/синие пузыри)"
    : "собеседника (левая сторона, серые пузыри). НЕ цитируй и НЕ анализируй правую сторону.";

  // Нормализуем одиночные файлы в массивы
  if (image && !images) { images = [image]; imageTypes = ["image/jpeg"]; }
  if (audio && !audios) { audios = [audio]; audioTypes = [audioTypes || "audio/webm"]; }

  const hasImages = images?.length > 0;
  const hasAudios = audios?.length > 0;
  const hasText   = text?.trim?.().length > 0;

  if (!hasImages && !hasAudios && !hasText)
    return res.status(400).json({ error: "Нужен text, image(s) или audio(s)" });

  try {
    let analysisText = text || null;

    // ── 1. Голосовые → Whisper (OpenAI) ─────────────────────────────────────
    if (hasAudios) {
      if (!OPENAI_KEY) return res.status(500).json({ error: "OPENAI_API_KEY нужен для голосовых сообщений" });

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
            headers: { Authorization: `Bearer ${OPENAI_KEY}` },
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

    // ── 2. Строим сообщение для Claude ───────────────────────────────────────
    let userContent;

    if (hasImages) {
      // Claude принимает изображения в формате base64
      userContent = [
        ...images.map((b64, i) => ({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg", // всегда jpeg после сжатия через canvas
            data: b64,
          },
        })),
        {
          type: "text",
          text: `Это ${images.length > 1 ? `${images.length} скриншота одной переписки` : "скриншот переписки"}.

${imageContext ? `КОНТЕКСТ ОТ ПОЛЬЗОВАТЕЛЯ: ${imageContext}` : ""}

Анализируй ТОЛЬКО ${targetDescription}

Проведи полный психологический анализ и верни JSON.`,
        },
      ];
    } else {
      const prefix = hasAudios
        ? `Это расшифровка ${audios.length > 1 ? `${audios.length} голосовых сообщений` : "голосового сообщения"} собеседника.`
        : "Переписка для анализа:";
      userContent = `${prefix}\n\n${imageContext ? `КОНТЕКСТ ОТ ПОЛЬЗОВАТЕЛЯ: ${imageContext}\n\n` : ""}Анализируй ТОЛЬКО ${targetDescription}\n\n${analysisText}`;
    }

    // ── 3. Claude API ─────────────────────────────────────────────────────────
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json();
      return res.status(500).json({ error: err.error?.message || "Ошибка Claude API" });
    }

    const claudeData = await claudeRes.json();
    const raw = claudeData.content[0].text;
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    if (analysisText && hasAudios) result.transcription = analysisText;

    // Считаем запрос
    try {
      const origin = req.headers.origin || "https://psycho-detector-ye1y.vercel.app";
      fetch(`${origin}/api/counter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: req.headers["x-forwarded-for"] || "anon" })
      }).catch(() => {});
    } catch(e) {}

    return res.status(200).json(result);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Ошибка сервера: " + e.message });
  }
};
