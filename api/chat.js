/* ============================================================
   Verdix Mahoraga — api/chat
   Contrato: POST {messages:[{role,content},..], image?:bool}
   Respuesta: { reply, model, usage, imageUrl }
   Backend: Groq (qwen3.8-27b, directo) con fallback Gemini 3.5 Flash Lite.
   Claves: SOLO en Vercel secrets (producción). Nunca en el cliente.
   Rate limit: 60 req/día/IP — suficiente para el círculo del usuario.
   ============================================================ */

const DAILY_LIMIT = 60;
const hits = new Map();

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function allow(ip) {
  const today = new Date().toISOString().slice(0, 10);
  const rec = hits.get(ip);
  if (!rec || rec.day !== today) {
    hits.set(ip, { count: 1, day: today });
    return true;
  }
  if (rec.count >= DAILY_LIMIT) return false;
  rec.count += 1;
  return true;
}

export default async function handler(request, response) {
  resCors(response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST")
    return response.status(405).json({ error: "Method Not Allowed" });

  // Secreto opcional de app: solo se exige si esta configurado en Vercel.
  const appSecret = process.env.VERDIX_APP_SECRET;
  if (appSecret && request.headers["x-app-secret"] !== appSecret)
    return response.status(401).json({ error: "X-App-Secret invalido" });

  const ip = clientIp(request);
  if (!allow(ip))
    return response.status(429).json({ error: "Límite diario alcanzado. Vuelve mañana." });

  const body = request.body || {};
  let messages = Array.isArray(body.messages) ? body.messages : [];
  if (body.message && typeof body.message === "string") {
    messages = [{ role: "user", content: body.message }];
  }
  if (!messages.length)
    return response.status(400).json({ error: "Falta el mensaje." });

  // System prompt si falta
  if (!messages.some((m) => m.role === "system")) {
    messages.unshift({
      role: "system",
      content:
        "Eres Verdix Mahoraga, un asistente amable, claro, inteligente y útil. Respondes en el idioma del usuario, de forma concisa y precisa. Puedes ayudar con programación, preguntas generales, creatividad, soporte del ecosistema Verdix Mahoraga (Browser, Search, OS, Verdix Mahoraga). Cuando te pidan una imagen, responde ÚNICAMENTE con UNA descripción vívida y detallada de la imagen que el usuario quiere (eso alimentará el generador de imágenes); nunca digas que no puedes crearla. Tono profesional pero cercano.",
    });
  }

  const maxTokens = Math.max(Math.min(Number(body.max_tokens || 800), 1500), 400);
  const temperature = Number(body.temperature ?? 0.7);
  const wantsImage = /(imagen|image|dibuja|genera.*imagen|crea.*imagen)/i.test(
    messages[messages.length - 1].content || ""
  );

  let result = null;

  // 1) Groq qwen3.8-27b (directo, español, gratis)
  if (process.env.GROQ_API_KEY) {
    try {
      result = await callOpenAIStyle(
        "https://api.groq.com/openai/v1/chat/completions",
        process.env.GROQ_API_KEY,
        { model: "qwen/qwen3.8-27b", messages, temperature, max_tokens: maxTokens }
      );
    } catch (e) { result = { ok: false, status: 503, data: { error: String(e) } }; }
  }
  // 2) Fallback Gemini 3.5 Flash Lite
  if ((!result || !result.ok) && process.env.GEMINI_API_KEY) {
    try {
      result = await callOpenAIStyle(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        process.env.GEMINI_API_KEY,
        { model: "gemini-3.5-flash-lite", messages, temperature, max_tokens: maxTokens }
      );
    } catch (e) { result = { ok: false, status: 503, data: { error: String(e) } }; }
  }

  if (!result || !result.ok) {
    const status = result ? result.status : 503;
    return response.status(status).json({
      error: "IA no disponible en este momento. Intenta en unos minutos.",
      fallback: true,
    });
  }

  const content = result.data?.choices?.[0]?.message?.content || "";
  if (!content)
    return response.status(502).json({ error: "El modelo devolvió una respuesta vacía.", fallback: true });

  let imageUrl = null;
  if (wantsImage) {
    const prompt = encodeURIComponent(content.slice(0, 200));
    imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true`;
  }

  return response.status(200).json({
    reply: content.trim(),
    model: result.data?.model || "qwen/qwen3.8-27b",
    usage: result.data?.usage || null,
    imageUrl,
  });
}

function resCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-App-Secret");
}

async function callOpenAIStyle(url, key, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
