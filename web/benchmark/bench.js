/* VERDIX BENCHMARK — dashboard estático. Sin red. Datos: window.BENCH_RESULTS */
'use strict';
const R = window.BENCH_RESULTS || { results: [], hardware: {}, when: '' };
const HW = R.hardware || {};
const results = R.results || [];
const $ = s => document.querySelector(s);

const BENCH_ORDER = ['quicksort','mergesort','insertionsort','bubblesort','binary_search','linear_search','fib_rec','fib_iter','matrix','sieve'];
const LANG_LABEL = { c: 'C (gcc -O2)', python: 'Python 3', javascript: 'JavaScript (Node)' };
const LANG_COLOR = { c: '#38bdf8', python: '#a78bfa', javascript: '#fbbf24' };

const benchmarks = BENCH_ORDER.filter(b => results.some(r => r.benchmark === b))
  .concat([...new Set(results.map(r => r.benchmark))].filter(b => !BENCH_ORDER.includes(b)));
const languages = [...new Set(results.map(r => r.language))];

/* ---------- KPIs ---------- */
const fmt = (n, d=1) => (typeof n === 'number' ? n.toFixed(d) : '—');
const kpiHtml = [
  ['🧪', benchmarks.length, 'benchmarks'],
  ['⚙️', languages.length, 'lenguajes'],
  ['🖥️', HW.cores || '?', 'núcleos · ' + (HW.ram_mb ? Math.round(HW.ram_mb/1024*10)/10 + ' GB' : '?')],
  ['📅', (R.when || '—').slice(0, 10), 'fecha de corrida'],
];
$('#kpis').innerHTML = kpiHtml.map(([i, n, l]) =>
  `<div class="kpi"><div class="kpi-icon">${i}</div><div class="kpi-num">${n}</div><div class="kpi-label">${l}</div></div>`).join('');
$('#runId').textContent = `run #${R.run_id ?? '?'} · ${HW.cpu_model || 'hardware desconocido'} · input sha256 ${results[0]?.input_sha256 || 'n/a'}`;

/* ---------- Charts ---------- */
let timeChart, memChart;
const timeDatasets = () => languages.map(lang => ({
  label: LANG_LABEL[lang] || lang,
  data: benchmarks.map(b => { const r = results.find(x => x.benchmark === b && x.language === lang); return r ? r.median : null; }),
  backgroundColor: LANG_COLOR[lang] || '#94a3b8',
  borderRadius: 6,
}));
const memDatasets = () => languages.map(lang => ({
  label: LANG_LABEL[lang] || lang,
  data: benchmarks.map(b => { const r = results.find(x => x.benchmark === b && x.language === lang); return r ? Math.round((r.peak_rss_kb || 0) / 1024 * 10) / 10 : null; }),
  backgroundColor: LANG_COLOR[lang] || '#94a3b8',
  borderRadius: 6,
}));
const timeOptions = log => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#dbe4ff' } } },
  scales: {
    x: { ticks: { color: '#98a4d8' }, grid: { color: 'rgba(255,255,255,.06)' } },
    y: { type: log ? 'logarithmic' : 'linear', title: { display: true, text: 'ms (mediana)', color: '#98a4d8' },
         ticks: { color: '#98a4d8' }, grid: { color: 'rgba(255,255,255,.06)' } },
  },
});
const memOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#dbe4ff' } } },
  scales: {
    x: { ticks: { color: '#98a4d8' }, grid: { color: 'rgba(255,255,255,.06)' } },
    y: { title: { display: true, text: 'MB (RSS)', color: '#98a4d8' }, ticks: { color: '#98a4d8' }, grid: { color: 'rgba(255,255,255,.06)' } },
  },
};
if (window.Chart) {
  timeChart = new Chart($('#timeChart'), { type: 'bar', data: { labels: benchmarks, datasets: timeDatasets() }, options: timeOptions(false) });
  memChart  = new Chart($('#memChart'),  { type: 'bar', data: { labels: benchmarks, datasets: memDatasets() }, options: memOptions });
  $('#logScale').addEventListener('change', e => {
    timeChart.options = timeOptions(e.target.checked);
    timeChart.update();
  });
}

/* ---------- Tabla ---------- */
const tbody = $('#resTable tbody');
const fmtN = (v, d=1) => (typeof v === 'number' ? v.toFixed(d) : '—');
for (const b of benchmarks) {
  const rows = results.filter(r => r.benchmark === b);
  const best = Math.min(...rows.map(r => r.median));
  for (const r of rows) {
    const winner = Math.abs(r.median - best) < 1e-9;
    const tr = document.createElement('tr');
    if (winner) tr.className = 'winner';
    tr.innerHTML = `<td>${b}</td><td><span class="dot" style="background:${LANG_COLOR[r.language]||'#94a3b8'}"></span>${LANG_LABEL[r.language]||r.language}${winner ? ' 🏆' : ''}</td>
      <td><b>${fmtN(r.median)} ms</b></td><td>${fmtN(r.mean)} ms</td><td>${fmtN(r.stdev)}</td><td>${fmtN(r.p95)} ms</td>
      <td>${r.peak_rss_kb != null ? Math.round(r.peak_rss_kb/1024*10)/10 + ' MB' : '—'}</td><td>${r.runs_ok}/${r.runs}</td>`;
    tbody.appendChild(tr);
  }
}

/* ---------- Veredicto adaptativo (calculado, jamás inventado) ---------- */
const verdicts = [];
for (const b of benchmarks) {
  const rows = results.filter(r => r.benchmark === b);
  if (rows.length < 2) continue;
  const sorted = [...rows].sort((a, b2) => a.median - b2.median);
  const fast = sorted[0], slow = sorted[sorted.length - 1];
  const ratio = slow.median / Math.max(fast.median, 1e-6);
  const labelFast = LANG_LABEL[fast.language] || fast.language;
  const labelSlow = LANG_LABEL[slow.language] || slow.language;
  if (ratio >= 1.5) {
    verdicts.push(`En <b>${b}</b>, ${labelFast} es <b>${ratio.toFixed(1)}×</b> más rápido que ${labelSlow} (mediana).`);
  }
}
const memWin = lang => results.filter(r => r.language === lang).reduce((s, r) => s + (r.peak_rss_kb || 0), 0) / Math.max(1, results.filter(r => r.language === lang).length);
const memLangs = [...new Set(results.map(r => r.language))];
if (memLangs.length) {
  const sortedMem = memLangs.map(l => [l, memWin(l)]).sort((a, b) => a[1] - b[1]);
  verdicts.push(`Menor consumo medio de memoria: <b>${LANG_LABEL[sortedMem[0][0]] || sortedMem[0][0]}</b> (~${(sortedMem[0][1]/1024).toFixed(1)} MB por benchmark).`);
}
$('#verdictList').innerHTML = verdicts.map(v => `<li>${v}</li>`).join('') || '<li>Sin diferencias significativas medidas.</li>';

const winCount = {};
for (const b of benchmarks) {
  const rows = results.filter(r => r.benchmark === b);
  if (!rows.length) continue;
  const best = rows.reduce((a, b2) => (a.median <= b2.median ? a : b2));
  winCount[best.language] = (winCount[best.language] || 0) + 1;
}
const winTxt = Object.entries(winCount).sort((a, b) => b[1] - a[1])
  .map(([l, n]) => `${LANG_LABEL[l] || l}: ${n} victoria${n === 1 ? '' : 's'}`).join(' · ');
$('#winnerLine').innerHTML = `<div class="winline">🏆 Marcador de victorias por benchmark — ${winTxt || 'sin datos'}</div>`;
