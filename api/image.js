/* VERDIX IMAGES — Nano Banana (Google Gemini 2.5 Flash Image) con fallback gratis.
 * Contrato: POST { prompt } -> { imageBase64, mimeType, model, engine }
 * La clave Gemini vive SOLO en Vercel (GEMINI_API_KEY). Nunca se envía al cliente.
 */

const NANO_MODEL = process.env.NANO_BANANA_MODEL || "gemini-2.5-flash-image";

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

async function nanoBanana(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("sin GEMINI_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(NANO_MODEL)}:generateContent?key=${encodeURIComponent(key)}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctl.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${txt.slice(0, 180)}`);
    const data = JSON.parse(txt);
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const img = parts.find(p => p.inlineData && p.inlineData.data);
    if (!img) throw new Error("Gemini no devolvió imagen");
    return {
      imageBase64: img.inlineData.data,
      mimeType: img.inlineData.mimeType || "image/png",
      model: NANO_MODEL,
      engine: "nano-banana",
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(request) {
  if (request.method === "OPTIONS") return response(204, {});
  if (request.method !== "POST") return response(405, { error: "POST required" });

  let body = {};
  try { body = await request.json(); } catch (e) { return response(400, { error: "JSON inválido" }); }

  const prompt = String(body.prompt || "").trim().slice(0, 800);
  if (prompt.length < 3) return response(400, { error: "prompt demasiado corto" });

  try {
    const out = await nanoBanana(prompt);
    return response(200, { ...out, prompt });
  } catch (e) {
    // Fallback honesto: se informa del motor usado, nunca se simula Nano Banana.
    // La clave gratuita de Gemini puede no tener cuota para imágenes (429).
    return response(200, {
      error: String(e.message || e).slice(0, 300),
      model: "pollinations-turbo",
      engine: "pollinations-fallback",
      prompt,
    });
  }
};
