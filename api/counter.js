// api/counter.js — счётчик запросов через Vercel KV
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  // Если KV не подключён — просто возвращаем 0
  if (!KV_URL || !KV_TOKEN) {
    return res.status(200).json({ count: 0, users: 0 });
  }

  const headers = { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" };

  try {
    if (req.method === "POST") {
      const { userId } = req.body || {};
      // Увеличиваем общий счётчик
      await fetch(`${KV_URL}/incr/total_requests`, { method: "POST", headers });
      // Добавляем уникального пользователя
      if (userId) {
        await fetch(`${KV_URL}/sadd/unique_users`, {
          method: "POST", headers,
          body: JSON.stringify([userId])
        });
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === "GET") {
      const [r1, r2] = await Promise.all([
        fetch(`${KV_URL}/get/total_requests`, { headers }),
        fetch(`${KV_URL}/scard/unique_users`, { headers }),
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      return res.status(200).json({
        count: parseInt(d1.result) || 0,
        users: parseInt(d2.result) || 0,
      });
    }
  } catch (e) {
    return res.status(200).json({ count: 0, users: 0 });
  }
}
