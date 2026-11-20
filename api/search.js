/* ============================================================
   VERDIX SEARCH — buscador propio, SIN CLAVES y sin servicios de pago.
   Fuentes: índice propio (web/search-index.json), Wikipedia, DuckDuckGo
   Instant Answer y Hacker News (APIs públicas abiertas).
   Honestidad: NO es Google. Es un índice pequeño + fuentes abiertas,
   con ranking propio y etiquetando de dónde viene cada resultado.
   ============================================================ */
const fs = require("fs");
const path = require("path");

let _index = null;
function getIndex() {
  if (_index === null) {
    try {
      _index = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "web", "search-index.json"), "utf8"));
    } catch (e) { _index = { docs: [] }; }
  }
  return _index;
}

function limpiar(s) {
  return String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
}

function buscarIndice(q) {
  const terms = String(q).toLowerCase().split(/\W+/).filter(t => t.length > 2);
  if (!terms.length) return [];
  const out = [];
  for (const d of getIndex().docs) {
    const title = String(d.title || "").toLowerCase();
    const desc = String(d.desc || "").toLowerCase();
    const text = String(d.text || "").toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += 6;
      if (desc.includes(t)) score += 3;
      if (text.includes(t)) score += 1;
    }
    if (score > 0) {
      let snippet = d.desc || d.text || "";
      const pos = snippet.toLowerCase().indexOf(terms[0]);
      if (pos > 80) snippet = "…" + snippet.slice(pos - 60);
      out.push({ title: d.title, url: d.url, snippet: limpiar(snippet).slice(0, 220),
                 source: d.source || "verdix", engine: "índice VERDIX", score: score + 10 });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

async function fetchJson(url, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms || 5000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": "VERDIX Search/1.0", "Accept": "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

async function buscarWikipedia(q) {
  const url = "https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=" +
    encodeURIComponent(q) + "&srlimit=5&format=json&origin=*";
  const data = await fetchJson(url, 5000);
  return (data.query?.search || []).map(x => ({
    title: limpiar(x.title),
    url: "https://es.wikipedia.org/wiki/" + encodeURIComponent(String(x.title).replace(/ /g, "_")),
    snippet: limpiar(x.snippet).slice(0, 220), source: "wikipedia.org", engine: "Wikipedia", score: 6
  }));
}

async function buscarDDG(q) {
  const url = "https://api.duckduckgo.com/?q=" + encodeURIComponent(q) + "&format=json&no_html=1&skip_disambig=1";
  const d = await fetchJson(url, 5000);
  const out = [];
  if (d.AbstractText && d.AbstractURL) {
    out.push({ title: limpiar(d.Heading || d.AbstractText.slice(0, 60)), url: d.AbstractURL,
               snippet: limpiar(d.AbstractText).slice(0, 220), source: "duckduckgo.com", engine: "DuckDuckGo", score: 7 });
  }
  const topics = d.RelatedTopics || [];
  for (const t of topics) {
    const items = t.Topics || [t];
    for (const x of items) {
      if (x.FirstURL && x.Text) out.push({ title: limpiar(x.Text).slice(0, 90), url: x.FirstURL,
        snippet: limpiar(x.Text).slice(0, 220), source: "duckduckgo.com", engine: "DuckDuckGo", score: 4 });
    }
  }
  return out.slice(0, 5);
}

async function buscarHN(q) {
  const url = "https://hn.algolia.com/api/v1/search?query=" + encodeURIComponent(q) + "&tags=story&hitsPerPage=5";
  const d = await fetchJson(url, 5000);
  return (d.hits || []).map(h => ({
    title: limpiar(h.title || h.story_title),
    url: h.url || ("https://news.ycombinator.com/item?id=" + h.objectID),
    snippet: (h.points || 0) + " puntos · " + (h.num_comments || 0) + " comentarios en Hacker News",
    source: "news.ycombinator.com", engine: "Hacker News", score: 3
  })).filter(x => x.title);
}

function enlacesDirectos(q, type) {
  const e = encodeURIComponent(q);
  const map = {
    web: [["Google", "https://www.google.com/search?q=" + e], ["DuckDuckGo", "https://duckduckgo.com/?q=" + e], ["Yahoo", "https://search.yahoo.com/search?p=" + e]],
    images: [["Google Imágenes", "https://www.google.com/search?tbm=isch&q=" + e], ["DuckDuckGo Imágenes", "https://duckduckgo.com/?q=" + e + "&iax=images&ia=images"]],
    videos: [["YouTube", "https://www.youtube.com/results?search_query=" + e], ["DuckDuckGo Videos", "https://duckduckgo.com/?q=" + e + "&iax=videos&ia=videos"]],
    news: [["Google Noticias", "https://news.google.com/search?q=" + e + "&hl=es"], ["Yahoo Noticias", "https://news.yahoo.com/search?p=" + e]]
  };
  return (map[type] || map.web).map(([title, url]) => ({ title, url, snippet: "Abrir búsqueda externa", source: new URL(url).hostname, engine: "enlace directo", score: 0 }));
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  if (request.method !== "GET") return response.status(405).json({ error: "Method Not Allowed" });
  const q = String(request.query?.q || "").trim();
  if (!q) return response.status(400).json({ error: "Falta el parámetro q" });
  const type = String(request.query?.type || "web");

  const propios = buscarIndice(q);
  const consultas = [buscarWikipedia(q), buscarDDG(q), buscarHN(q)];
  const resultados = await Promise.allSettled(consultas);
  let todos = propios.slice();
  for (const r of resultados) if (r.status === "fulfilled" && Array.isArray(r.value)) todos = todos.concat(r.value);

  const vistos = new Set();
  todos = todos.filter(x => {
    if (!x || !x.url || vistos.has(x.url)) return false;
    vistos.add(x.url); return true;
  }).sort((a, b) => b.score - a.score).slice(0, 14);

  const fallback = todos.length === 0;
  if (fallback) todos = enlacesDirectos(q, type);

  return response.status(200).json({
    query: q, type, results: todos, count: todos.length, fallback,
    engines: ["índice VERDIX", "Wikipedia", "DuckDuckGo", "Hacker News"],
    note: "Buscador propio con índice limitado y fuentes abiertas; sin claves ni servicios de pago."
  });
}
