/* VERDIX DEV LAB — catálogo estático. Sin red. Datos: catalog/tools.json (fetch relativo) o window.TOOLS */
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const CATEGORIES = {
  'agentes-ia': '🤖 Agentes IA',
  'constructores': '🏗️ Constructores',
  'diseno': '🎨 Diseño',
  'editores': '⌨️ Editores',
  'web': '🌐 Web',
  'movil': '📱 Móvil',
  'backend': '🔧 Backend',
  'datos-cloud': '☁️ Datos/Cloud',
  'seguridad': '🛡️ Seguridad',
};
const CAT_SCORE = {
  web:  { 'diseno': 2, 'constructores': 3, 'web': 3, 'editores': 1 },
  movil:{ 'movil': 4, 'editores': 1, 'constructores': 2 },
  backend:{ 'backend': 4, 'datos-cloud': 2, 'editores': 1 },
  agente:{ 'agentes-ia': 5, 'constructores': 1, 'editores': 2 },
  diseño:{ 'diseno': 4, 'constructores': 2 },
  editor:{ 'editores': 5, 'agentes-ia': 2 },
};
const HEAVY_PENALTY = { flutter: 4, firebase: 0, vscode: 2, 'react-native': 2, postgresql: 2, zed: 1 };
const HEAVY_OK = new Set(); // ninguno: con 4 GB todo pesa, solo penalizamos levemente

const state = { tools: [], q: '', cat: null, onlyFree: true, onlyOSS: false, onlyAI: false, compare: [] };

/* ---------- Carga ---------- */
async function loadTools() {
  if (Array.isArray(window.TOOLS)) return window.TOOLS;
  const res = await fetch('tools.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar tools.json');
  return res.json();
}

/* ---------- Staleness (adaptativo, basado en fecha real) ---------- */
const TODAY = new Date();
function staleness(t) {
  if (!t.verified || !t.last_verified) return { label: '⚠ Sin verificar', cls: 'warn' };
  const ageDays = (TODAY - new Date(t.last_verified)) / 86400000;
  if (ageDays > 180) return { label: `⚠ Verificada hace ${Math.floor(ageDays)} días`, cls: 'warn' };
  return { label: `✓ Verificada ${t.last_verified}`, cls: 'ok' };
}

/* ---------- Filtrado ---------- */
function filtered() {
  const q = state.q.trim().toLowerCase();
  return state.tools.filter(t => {
    if (state.onlyFree && !t.is_free) return false;
    if (state.onlyOSS && !t.open_source) return false;
    if (state.onlyAI && !t.ai) return false;
    if (state.cat && t.category !== state.cat) return false;
    if (!q) return true;
    const blob = [t.name, t.desc, t.license, t.category, (t.pros||[]).join(' '), (t.cons||[]).join(' ')].join(' ').toLowerCase();
    return q.split(/\s+/).every(w => blob.includes(w));
  });
}

/* ---------- Chips de categoría ---------- */
function renderChips() {
  const cats = [...new Set(state.tools.map(t => t.category))];
  $('#catChips').innerHTML = [`<button class="chip${!state.cat ? ' active' : ''}" data-cat="">Todas (${state.tools.length})</button>`]
    .concat(cats.map(c => {
      const n = state.tools.filter(t => t.category === c).length;
      return `<button class="chip${state.cat === c ? ' active' : ''}" data-cat="${c}">${CATEGORIES[c] || c} (${n})</button>`;
    })).join('');
}

/* ---------- Grid de fichas ---------- */
function renderGrid() {
  const list = filtered();
  $('#resultCount').textContent = `${list.length} herramienta${list.length === 1 ? '' : 's'}`;
  $('#emptyState').classList.toggle('hidden', list.length !== 0);
  $('#cardGrid').innerHTML = list.map(t => {
    const st = staleness(t);
    const osIcons = (t.os || []).includes('linux') ? '🐧' : '';
    const badges = [
      t.is_free ? '<span class="badge free">GRATIS</span>' : '<span class="badge paid">NO GRATIS</span>',
      t.open_source ? '<span class="badge oss">OSS</span>' : '',
      t.ai ? '<span class="badge ai">IA</span>' : '',
      osIcons ? `<span class="badge os">${osIcons}</span>` : '',
    ].join(' ');
    const inCompare = state.compare.includes(t.id);
    return `<article class="card" data-id="${t.id}">
      <div class="card-top">
        <h3>${t.name}</h3>
        <div class="badges">${badges}</div>
      </div>
      <p class="card-desc">${t.desc}</p>
      <div class="card-foot">
        <span class="stale ${st.cls}">${st.label}</span>
        <button class="compare-toggle${inCompare ? ' on' : ''}" data-compare="${t.id}" aria-pressed="${inCompare}">${inCompare ? '✓ en comparación' : '+ comparar'}</button>
      </div>
    </article>`;
  }).join('');
}

/* ---------- Modal de ficha ---------- */
function showFicha(id) {
  const t = state.tools.find(x => x.id === id);
  if (!t) return;
  const st = staleness(t);
  $('#modalContent').innerHTML = `
    <h2 class="modal-title">${t.name} <span class="stale ${st.cls}">${st.label}</span></h2>
    <div class="badges">${[
      t.is_free ? '<span class="badge free">GRATIS</span>' : '<span class="badge paid">NO GRATIS</span>',
      t.open_source ? '<span class="badge oss">CÓDIGO ABIERTO</span>' : '<span class="badge paid">PROPIETARIA</span>',
      t.ai ? '<span class="badge ai">CON IA</span>' : '',
    ].join(' ')}</div>
    <p class="ficha-desc">${t.desc}</p>
    <dl class="ficha-grid">
      <dt>Categoría</dt><dd>${CATEGORIES[t.category] || t.category}</dd>
      <dt>Licencia</dt><dd>${t.license}</dd>
      <dt>Sistemas</dt><dd>${(t.os || []).join(', ')}</dd>
      <dt>Plan gratuito</dt><dd>${t.free_plan}</dd>
      <dt>De pago desde</dt><dd>${t.paid_from}</dd>
      <dt>¿Cuenta? / ¿Tarjeta?</dt><dd>${t.requires_account ? 'Cuenta sí' : 'Sin cuenta'} · ${t.card_required ? 'Tarjeta sí' : 'Sin tarjeta'}</dd>
      <dt>Fuente</dt><dd><a href="${t.source}" target="_blank" rel="noopener noreferrer">${t.source}</a></dd>
      <dt>Última verificación</dt><dd>${t.last_verified || 'Pendiente de verificación — no se inventó ningún dato'}</dd>
    </dl>
    <div class="ficha-cols">
      <div><h4>✅ Ventajas</h4><ul>${(t.pros||[]).map(p => `<li>${p}</li>`).join('')}</ul></div>
      <div><h4>⚠️ Desventajas</h4><ul>${(t.cons||[]).map(p => `<li>${p}</li>`).join('')}</ul></div>
    </div>
    <p class="alt-line">Alternativas: ${(t.alternatives||[]).map(a => {
      const alt = state.tools.find(x => x.id === a);
      return alt ? `<button class="alt-link" data-alt="${a}">${alt.name}</button>` : a;
    }).join(' · ')}</p>`;
  $('#modal').classList.remove('hidden');
}

/* ---------- Comparación ---------- */
const COMPARE_ROWS = [
  ['Categoría', t => CATEGORIES[t.category] || t.category],
  ['Gratis', t => t.is_free ? '✅ Sí' : '❌ No'],
  ['Código abierto', t => t.open_source ? '✅ Sí (' + t.license + ')' : '❌ No'],
  ['IA integrada', t => t.ai ? '✅ Sí' : '—'],
  ['Plan gratis', t => t.free_plan],
  ['Pago desde', t => t.paid_from],
  ['Cuenta / Tarjeta', t => `${t.requires_account ? 'Cuenta' : 'Sin cuenta'} · ${t.card_required ? 'Tarjeta' : 'Sin tarjeta'}`],
  ['Sistemas', t => (t.os || []).join(', ')],
  ['Ventajas', t => (t.pros || []).join(' · ')],
  ['Desventajas', t => (t.cons || []).join(' · ')],
  ['Verificado', t => staleness(t).label],
];
function renderCompare() {
  const sel = state.compare.map(id => state.tools.find(t => t.id === id)).filter(Boolean);
  const table = $('#compareTable');
  table.innerHTML = '<thead><tr><th></th>' + sel.map(t => `<th>${t.name}</th>`).join('') + '</tr></thead>' +
    '<tbody>' + COMPARE_ROWS.map(([label, fn]) =>
      `<tr><th>${label}</th>${sel.map(t => `<td>${fn(t)}</td>`).join('')}</tr>`).join('') + '</tbody>';
}
function updateCompareBar() {
  $('#compareBar').classList.toggle('hidden', state.compare.length === 0);
  $('#compareCount').textContent = `${state.compare.length} seleccionada${state.compare.length === 1 ? '' : 's'}`;
}

/* ---------- Recomendador ---------- */
function recommend({ goal, budget, hw }) {
  const scored = state.tools.map(t => {
    let s = 0;
    s += (CAT_SCORE[goal] && CAT_SCORE[goal][t.category]) || 0;
    if (t.is_free) s += budget === 'zero' ? 6 : budget === 'free' ? 3 : 0;
    else if (budget === 'zero') s -= 100; // descartado en $0 estricto
    if (t.open_source) s += 2;
    if (hw === 'low') s -= (HEAVY_PENALTY[t.id] || 0);
    if (t.verified) s += 2;
    return { t, s };
  }).filter(x => x.s > -50)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5);
  return scored;
}

/* ---------- Eventos ---------- */
function bind() {
  $('#q').addEventListener('input', e => { state.q = e.target.value; renderGrid(); });
  $('#onlyFree').addEventListener('change', e => { state.onlyFree = e.target.checked; renderGrid(); });
  $('#onlyOSS').addEventListener('change', e => { state.onlyOSS = e.target.checked; renderGrid(); });
  $('#onlyAI').addEventListener('change', e => { state.onlyAI = e.target.checked; renderGrid(); });
  $('#catChips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    state.cat = b.dataset.cat || null; renderChips(); renderGrid();
  });
  $('#cardGrid').addEventListener('click', e => {
    const cmp = e.target.closest('[data-compare]');
    if (cmp) {
      e.stopPropagation();
      const id = cmp.dataset.compare;
      state.compare = state.compare.includes(id) ? state.compare.filter(x => x !== id) : [...state.compare, id].slice(0, 4);
      updateCompareBar(); renderGrid(); return;
    }
    const card = e.target.closest('.card'); if (card) showFicha(card.dataset.id);
  });
  const closeModal = id => $(id).classList.add('hidden');
  $('#modalClose').addEventListener('click', () => closeModal('#modal'));
  $('#compareClose').addEventListener('click', () => closeModal('#compareModal'));
  $('#wizardClose').addEventListener('click', () => closeModal('#wizardModal'));
  for (const m of ['#modal', '#compareModal', '#wizardModal']) {
    $(m).addEventListener('click', e => { if (e.target === $(m)) $(m).classList.add('hidden'); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') for (const m of ['#modal', '#compareModal', '#wizardModal']) $(m).classList.add('hidden'); });
  $('#modal').addEventListener('click', e => {
    const alt = e.target.closest('[data-alt]');
    if (alt) { $('#modal').classList.add('hidden'); showFicha(alt.dataset.alt); }
  });
  $('#clearCompare').addEventListener('click', () => { state.compare = []; updateCompareBar(); renderGrid(); });
  $('#doCompare').addEventListener('click', () => { renderCompare(); $('#compareModal').classList.remove('hidden'); });
  $('#openWizard').addEventListener('click', () => $('#wizardModal').classList.remove('hidden'));
  $('#wizardForm').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = recommend({ goal: fd.get('goal'), budget: fd.get('budget'), hw: fd.get('hw') });
    const box = $('#wizardResult');
    box.innerHTML = '<h3>Recomendadas para ti</h3><ol class="reco-list">' + res.map(({ t, s }) =>
      `<li><button class="reco-item" data-alt="${t.id}"><b>${t.name}</b><span class="reco-score">${Math.max(0, s).toFixed(0)} pts</span><small>${CATEGORIES[t.category] || t.category}${t.is_free ? ' · Gratis' : ''}${t.open_source ? ' · OSS' : ''}</small></button></li>`
    ).join('') + '</ol><p class="note">Puntuación calculada: gratis y código abierto puntúan arriba cuando tu presupuesto es $0. Sin afiliación, sin patrocinio.</p>';
    box.classList.remove('hidden');
    box.addEventListener('click', ev => {
      const b = ev.target.closest('[data-alt]');
      if (b) { $('#wizardModal').classList.add('hidden'); showFicha(b.dataset.alt); }
    }, { once: true });
  });
}

/* ---------- Init ---------- */
loadTools().then(tools => {
  state.tools = tools;
  $('#statsLine').textContent = `${tools.length} fichas · ${tools.filter(t => t.is_free).length} gratis · ${tools.filter(t => t.open_source).length} open source · ${tools.filter(t => t.verified).length} verificadas`;
  renderChips(); renderGrid(); updateCompareBar(); bind();
  console.log('[DevLab] Catálogo cargado:', tools.length, 'herramientas');
}).catch(err => {
  $('#cardGrid').innerHTML = `<div class="empty">No se pudo cargar el catálogo: ${err.message}<br>Copia catalog/tools.json en web/tools.json</div>`;
});
