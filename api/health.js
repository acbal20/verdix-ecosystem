/* ============================================================
   Verdix Mahoraga — api/health
   Health check del ecosistema: estado de la IA + modelo activo.
   GET → { status, ai_configured, model }
   ============================================================ */

const MODEL = process.env.GROQ_MODEL || process.env.GEMINI_MODEL || process.env.OPENROUTER_MODEL || "groq/qwen3.8-27b";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET") return response.status(405).json({ error: "Method Not Allowed" });

  const providers = {
    groq: Boolean(process.env.GROQ_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
  };
  const ai_configured = Object.values(providers).some(Boolean);
  return response.status(200).json({
    status: "ok",
    ai_configured,
    model: MODEL,
    providers,
  });
}
