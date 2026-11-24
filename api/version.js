/* Devuelve la version publica del ecosistema (web/version.json). */
import fs from "fs";
import path from "path";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(request, response) {
  cors(response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET")
    return response.status(405).json({ error: "Method Not Allowed" });

  try {
    const file = path.join(process.cwd(), "web", "version.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return response.status(200).json(data);
  } catch (e) {
    return response.status(503).json({ error: "version.json no disponible" });
  }
}
