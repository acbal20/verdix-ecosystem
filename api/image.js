/* VERDIX IMAGES — generación de imágenes 100% SIN CLAVE.
 * Motor: Pollinations Turbo (gratis). Nano Banana (Gemini 2.5 Flash Image)
 * requiere cuota de Google; la clave gratuita responde 429, por eso no se usa.
 * Contrato: POST { prompt } -> { imageBase64, mimeType, model, engine, prompt }
 * Ante fallo devuelve { error, ... } para que el cliente reintente directamente.
 * NUNCA se simula una imagen.
 */

const MODEL = "turbo";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

async function generar(prompt) {
  const seed = Math.floor(Math.random() * 1_000_000);
  const url =
    "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt.slice(0, 700)) +
    `?width=512&height=512&nologo=true&model=${MODEL}&seed=${seed}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": "VERDIX/0.5" } });
    if (!r.ok) throw new Error(`Pollinations HTTP ${r.status}`);
    const ctype = (r.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!ctype.startsWith("image/")) throw new Error("Pollinations no devolvió imagen");
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 500) throw new Error("Imagen vacía");
    return {
      imageBase64: buf.toString("base64"),
      mimeType: ctype,
      model: MODEL,
      engine: "pollinations-turbo",
      note: "Sin clave. Nano Banana requiere cuota de Google (429 en la clave gratuita).",
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(request, response) {
  cors(response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "POST required" });

  const body = request.body || {};
  const prompt = String(body.prompt || "").trim().slice(0, 800);
  if (prompt.length < 3) return response.status(400).json({ error: "prompt demasiado corto" });

  try {
    const out = await generar(prompt);
    return response.status(200).json({ ...out, prompt });
  } catch (e) {
    return response.status(502).json({
      error: String(e.message || e).slice(0, 300),
      engine: "pollinations-turbo",
      model: MODEL,
      prompt,
    });
  }
}
