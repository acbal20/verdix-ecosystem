/* Registro de eventos de seguridad del cliente (web/assets/js/security.js). */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(request, response) {
  cors(response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST")
    return response.status(405).json({ error: "Method Not Allowed" });

  const body = request.body || {};
  console.log("[security-event]", JSON.stringify(body).slice(0, 500));
  return response.status(204).end();
}
