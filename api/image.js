/* VERDIX IMAGES — generación de imágenes 100% SIN CLAVE.
 * Motor: Pollinations Turbo (modelo gratuito; los modelos flux/etc. requieren pago).
 * Nano Banana (Gemini 2.5 Flash Image) solo funciona con cuota de Google;
 * esta clave gratuita devuelve 429, por eso el ecosistema usa Turbo por defecto.
 *
 * Contrato: POST { prompt } -> { imageBase64, mimeType, model, engine, prompt }
 * Ante fallo: { error, engine:'pollinations-turbo', prompt } para que el cliente
 * reintente directamente. NUNCA se simula una imagen.
 */

const MODEL = "turbo";

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
      note: "Generación sin clave. Nano Banana requiere cuota de Google (429 en la clave gratuita).",
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
    return response(200, { ...(await generar(prompt)), prompt });
  } catch (e) {
    return response(200, {
      error: String(e.message || e).slice(0, 300),
      engine: "pollinations-turbo",
      model: MODEL,
      prompt,
    });
  }
};
