/* ============================================================
   VERDIX AI — api/health
   Health check del ecosistema: estado de la IA + modelo activo.
   GET → { status, ai_configured, model }
   ============================================================ */

const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4.1-flash-1017";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET") return response.status(405).json({ error: "Method Not Allowed" });

  const ai_configured = Boolean(process.env.OPENROUTER_API_KEY);
  return response.status(200).json({
    status: "ok",
    ai_configured,
    model: MODEL,
  });
}
