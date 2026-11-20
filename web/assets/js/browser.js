/* ============================================================
   VERDIX BROWSER — pestañas, historial e instalación PWA
   ============================================================ */
(function () {
  const $ = id => document.getElementById(id);
  const iframe = $('browser-iframe');
  const home = $('browser-home');
  const fallback = $('browser-fallback');
  const urlInput = $('url-input');
  const tabstrip = $('tabstrip');

  const BLOCKED = ["google.com", "youtube.com", "web.whatsapp.com", "mail.google.com",
                   "facebook.com", "instagram.com", "twitter.com", "x.com", "github.com", "tiktok.com"];
  const HIST_KEY = "verdix_browser_history_v1";
  let tabs = [nuevaPestaña()];
  let activa = 0;
  let deferredPrompt = null;

  function nuevaPestaña(titulo) {
    return { id: Date.now() + Math.random(), titulo: titulo || "Nueva pestaña", url: "", hist: [], idx: -1 };
  }
  function actual() { return tabs[activa]; }

  function toast(msg) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.className = "test-result show";
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function renderTabs() {
    tabstrip.innerHTML = "";
    tabs.forEach((tab, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vtab" + (i === activa ? " active" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === activa ? "true" : "false");
      const title = document.createElement("span");
      title.className = "vtab-title";
      title.textContent = tab.titulo.length > 26 ? tab.titulo.slice(0, 24) + "…" : tab.titulo;
      b.appendChild(title);
      if (tabs.length > 1) {
        const x = document.createElement("button");
        x.type = "button"; x.className = "vtab-close"; x.textContent = "✕";
        x.setAttribute("aria-label", "Cerrar pestaña");
        x.addEventListener("click", e => { e.stopPropagation(); cerrar(i); });
        b.appendChild(x);
      }
      b.addEventListener("click", () => seleccionar(i));
      tabstrip.appendChild(b);
    });
    const add = document.createElement("button");
    add.type = "button"; add.className = "tab-add"; add.textContent = "+";
    add.title = "Nueva pestaña"; add.setAttribute("aria-label", "Nueva pestaña");
    add.addEventListener("click", () => {
      tabs.push(nuevaPestaña()); activa = tabs.length - 1; renderTabs(); mostrarInicio();
    });
    tabstrip.appendChild(add);
  }

  function cerrar(i) {
    tabs.splice(i, 1);
    if (activa >= tabs.length) activa = tabs.length - 1;
    renderTabs(); pintar();
  }
  function seleccionar(i) { activa = i; renderTabs(); pintar(); }

  function normalizar(raw) {
    const v = String(raw || "").trim();
    if (!v) return "";
    if (/^(https?:\/\/|chrome:|about:)/i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v)) return "https://" + v;
    return "https://www.google.com/search?q=" + encodeURIComponent(v);
  }
  function esBloqueada(url) {
    try {
      const h = new URL(url).hostname.replace(/^www\./, "");
      return BLOCKED.some(b => h === b || h.endsWith("." + b));
    } catch (e) { return false; }
  }
  function hostDe(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; }
  }
  function guardarHistorial(url) {
    try {
      const arr = JSON.parse(localStorage.getItem(HIST_KEY) || "[]").filter(x => x !== url);
      arr.unshift(url);
      localStorage.setItem(HIST_KEY, JSON.stringify(arr.slice(0, 18)));
      renderHistorial();
    } catch (e) {}
  }
  function renderHistorial() {
    const box = $('historyList'); if (!box) return;
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch (e) {}
    box.innerHTML = "";
    if (!arr.length) { box.innerHTML = '<span class="history-empty">Todavía no visitaste ningún sitio.</span>'; return; }
    arr.forEach(u => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = hostDe(u); b.title = u;
      b.addEventListener("click", () => navegar(u));
      box.appendChild(b);
    });
  }

  function pintar() {
    const tab = actual();
    urlInput.value = tab.url;
    if (!tab.url) { mostrarInicio(); return; }
    home.style.display = "none";
    fallback.classList.remove("show");
    iframe.style.display = "block";
    if (iframe.src !== tab.url) iframe.src = tab.url;
  }
  function mostrarInicio() {
    iframe.style.display = "none";
    fallback.classList.remove("show");
    home.style.display = "flex";
    urlInput.value = "";
    $('back-btn').disabled = true;
  }
  function navegar(raw, push) {
    const url = normalizar(raw);
    if (!url) { urlInput.focus(); return; }
    if (/^(search\.html|ai\.html|apk\/|benchmark\/|devlab\/|index\.html)/i.test(String(raw))) {
      location.href = String(raw); return;
    }
    const tab = actual();
    if (push !== false && tab.url) { tab.hist.push(tab.url); tab.idx = tab.hist.length - 1; }
    tab.url = url; tab.titulo = hostDe(url);
    renderTabs(); guardarHistorial(url);

    if (esBloqueada(url)) {
      home.style.display = "none"; iframe.style.display = "none";
      fallback.classList.add("show");
      fallback.dataset.url = url;
      urlInput.value = url;
      window.open(url, "_blank", "noopener");
      return;
    }
    home.style.display = "none";
    fallback.classList.remove("show");
    iframe.style.display = "block";
    iframe.src = url;
    urlInput.value = url;
    $('back-btn').disabled = false;
  }

  /* --- eventos --- */
  $('url-form').addEventListener("submit", e => { e.preventDefault(); navegar(urlInput.value); });
  $('go-btn').addEventListener("click", () => navegar(urlInput.value));
  $('mini-form')?.addEventListener("submit", e => { e.preventDefault(); navegar($('mini-input').value); });
  $('back-btn').addEventListener("click", () => {
    const tab = actual();
    if (tab.idx >= 0 && tab.hist[tab.idx]) {
      const prev = tab.hist[tab.idx]; tab.idx--; navegar(prev, false);
    } else { tab.url = ""; mostrarInicio(); renderTabs(); }
  });
  $('reload-btn').addEventListener("click", () => { const u = actual().url; if (u) navegar(u, false); });
  $('home-btn').addEventListener("click", () => { actual().url = ""; mostrarInicio(); renderTabs(); });
  $('external-btn').addEventListener("click", () => { const u = actual().url || fallback.dataset.url; if (u) window.open(u, "_blank", "noopener"); });
  $('fallback-open').addEventListener("click", () => { const u = fallback.dataset.url || urlInput.value; if (u) window.open(u, "_blank", "noopener"); });
  urlInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); navegar(urlInput.value); } });

  document.querySelectorAll("#browser-home a[data-url]").forEach(a => {
    a.addEventListener("click", e => { e.preventDefault(); navegar(a.dataset.url); });
  });

  /* --- instalación PWA --- */
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; const b = $('installBrowser'); if (b) b.textContent = "⬇ INSTALAR APP"; });
  $('installBrowser')?.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      toast(choice && choice.outcome === "accepted" ? "Instalando VERDIX Browser…" : "Instalación cancelada");
    } else {
      toast("En Chrome: menú ⋮ → Instalar app / Agregar a pantalla de inicio");
    }
  });
  window.addEventListener("appinstalled", () => toast("VERDIX Browser instalado ✅"));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/browser/sw.js").catch(() => {});
  }

  renderTabs(); renderHistorial(); pintar();
})();
