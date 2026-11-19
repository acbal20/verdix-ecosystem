/* ============================================================
   BEN 10 · OMNITRIX BATTLE 3D — UI
   Conexión entre el motor y el DOM (HUD, menús, overlays, notificaciones).
   ============================================================ */

const UI = (function () {
  const $ = id => document.getElementById(id);
  const showById = id => { const e = $(id); if (e) e.classList.remove('hidden'); };
  const hideById = id => { const e = $(id); if (e) e.classList.add('hidden'); };

  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- HUD ---------- */
  function refresh() {
    if (typeof SAVE === 'undefined') return;
    const $a = id => $(id);
    const hpText = $a('hpText');
    if (hpText) {
      const hpMax = (typeof SAVE !== 'undefined' && SAVE.up) ? (100 + (SAVE.up.hp | 0) * 20) : 100;
      const hpNow = (typeof P !== 'undefined' && P && P.hp != null) ? Math.max(0, Math.min(hpMax, P.hp | 0)) : hpMax;
      hpText.textContent = hpNow;
      const fill = $a('hpFill'); if (fill) fill.style.width = (hpNow / hpMax * 100) + '%';
      const omniText = $a('omniText');
      const omniMax = (typeof SAVE !== 'undefined' && SAVE.up) ? (100 + (SAVE.up.omni | 0) * 15) : 100;
      const omniNow = (typeof P !== 'undefined' && P && P.omni != null) ? Math.max(0, Math.min(omniMax, P.omni | 0)) : omniMax;
      if (omniText) omniText.textContent = omniNow;
      const ofill = $a('omniFill'); if (ofill) ofill.style.width = (omniNow / omniMax * 100) + '%';
    }
    const lvl = $a('lvlVal'); if (lvl && typeof G !== 'undefined' && G) lvl.textContent = G.wave | 0;
    const score = $a('scoreVal'); if (score && typeof G !== 'undefined' && G) score.textContent = G.score | 0;
    const wave = $a('waveVal'); if (wave && typeof G !== 'undefined' && G) wave.textContent = G.wave | 0;
    const enemies = $a('enemyVal'); if (enemies && typeof G !== 'undefined' && G) enemies.textContent = (G.enemies | 0).length + ' enemigos';
  }

  function wallet() {
    if (typeof SAVE === 'undefined') return;
    const c = $('coinVal'); if (c) c.textContent = SAVE.coins | 0;
    const g = $('gemVal'); if (g) g.textContent = SAVE.gems | 0;
    const mc = $('menuCoins'); if (mc) mc.textContent = SAVE.coins | 0;
    const mg = $('menuGems'); if (mg) mg.textContent = SAVE.gems | 0;
  }

  function menuStats() {
    if (typeof SAVE === 'undefined') return;
    const b = $('bestVal'); if (b) b.textContent = SAVE.best | 0;
    const bw = $('bestWaveVal'); if (bw) bw.textContent = SAVE.freeBestWave | 0;
  }

  function alienCards() {
    const bar = $('alienBar'); if (!bar) return;
    bar.innerHTML = '';
    if (typeof ALIEN_ORDER === 'undefined') return;
    for (const slot of ALIEN_ORDER) {
      const f = FORMS[slot.id];
      const owned = !!SAVE.aliens[slot.id];
      const btn = document.createElement('button');
      btn.className = 'alien-card' + (owned ? ' owned' : ' locked');
      btn.dataset.alien = slot.id;
      btn.title = owned ? `${f.name}` : `Desbloqueá en la tienda — ${f.name}`;
      btn.innerHTML = `<span class="card-icon">${f.icon || '❓'}</span><span class="card-name">${f.name}</span><span class="card-key">${slot.key}</span>`;
      btn.addEventListener('click', () => {
        if (owned && typeof onAlienCard === 'function') onAlienCard(slot.id);
        else if (typeof UI !== 'undefined') UI.toast('Desbloqueá este alien en la tienda 🛒');
      });
      bar.appendChild(btn);
    }
  }

  function setPlaying(playing) {
    if (playing) { showById('hud'); hideById('menu'); hideById('over'); hideById('pause'); }
    else { hideById('hud'); }
  }


  /* ---------- combat HUD ---------- */
  function banner(title, sub, duration) {
    $('bannerTitle').textContent = title || '';
    $('bannerSub').textContent = sub || '';
    const b = $('banner'); if (!b) return;
    b.classList.add('show');
    clearTimeout(banner._t);
    banner._t = setTimeout(() => b.classList.remove('show'), (duration || 3) * 1000);
  }

  function toast(msg) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function boss(hp, max) {
    const bar = $('bossBar'); if (!bar) return;
    if (hp == null) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    const fill = $('bossFill'); if (fill) fill.style.width = (hp / Math.max(1, max) * 100) + '%';
  }

  function combo(text) {
    const c = $('combo'); if (!c) return;
    c.innerHTML = text + ' <small>COMBO</small>';
    c.classList.remove('hidden');
    clearTimeout(combo._t);
    combo._t = setTimeout(() => c.classList.add('hidden'), 1200);
  }

  function screenFlash() {
    const d = $('damageFlash'); if (!d) return;
    d.style.opacity = '0.55';
    setTimeout(() => { d.style.opacity = '0'; }, 90);
  }

  function hurtFlash() {
    const h = $('hurtFlash'); if (!h) return;
    h.style.opacity = '0.55';
    setTimeout(() => { h.style.opacity = '0'; }, 110);
  }

  function showGodIndicator(flag) {
    const g = $('godIndicator'); if (g) g.classList.toggle('hidden', !flag);
  }

  function updateStoryHUD() {
    if (typeof SAVE === 'undefined') return;
    const el = $('storyGoalBar'); if (!el) return;
    // mostrar objetivo actual (primer nivel no completado)
    if (typeof LEVELS !== 'undefined') {
      const next = LEVELS.find(l => (SAVE.storyProgress | 0) <= (l.id || 0));
      if (next) {
        el.textContent = '🎯 ' + (next.name || 'Nivel');
        el.classList.remove('hidden');
        return;
      }
    }
    el.classList.add('hidden');
  }

  /* ---------- fin de partida ---------- */
  function gameOver(win, wave, score, best) {
    $('overTag').textContent = win ? '¡Victoria!' : 'Misión terminada';
    $('overTitle').textContent = win ? '¡GANASTE!' : 'DERROTA';
    $('overMsg').textContent = win ? 'El Omnitrix está en tus manos.' : 'Los monstruos te superaron.';
    $('overWave').textContent = wave | 0;
    $('overScore').textContent = score | 0;
    $('overBest').textContent = best | 0;
    showById('over'); hideById('hud');
  }

  /* ---------- Boot / menú de boot ---------- */
  function hideBoot() { hideById('boot'); }


  /* ---------- Inicialización / boot ---------- */

  function init() {
    // Cargar stats en menú
    menuStats();
    wallet();
    alienCards();

    // Ocultar boot, mostrar menú
    hideById('boot');
    showById('menu');

    // Botones del menú principal
    const wire = (id, fn) => { const e = document.getElementById(id); if (e) e.addEventListener('click', fn); };
    wire('startBtn', () => { if (typeof window.startQuickRun === 'function') window.startQuickRun(); });
    wire('btnStory', () => { hideById('menu'); showById('storyScreen'); renderStoryLevels(); });
    wire('btnFree', () => { if (typeof window.startFreeRun === 'function') window.startFreeRun(); });
    wire('btnRanking', () => { hideById('menu'); showById('rankingScreen'); });
    wire('btnOptions', () => { hideById('menu'); showById('optionsScreen'); });
    wire('shopBtn', () => { hideById('menu'); showById('shop'); });
    wire('btnCharStore', () => { hideById('menu'); showById('charStoreScreen'); });
    wire('ctrlBtnSize', () => {});
    wire('ctrlStickSize', () => {});
    wire('ctrlScale', () => {});
    wire('ctrlLayoutLeft', () => {});
    wire('ctrlLayoutRight', () => {});
    wire('btnResetControls', () => {});
    wire('btnSaveControls', () => {});

    // Volver al menú
    wire('btnBackStory', () => { hideById('storyScreen'); showById('menu'); });
    wire('btnBackOptions', () => { hideById('optionsScreen'); showById('menu'); });
    wire('btnBackControls', () => { hideById('controlsScreen'); showById('menu'); });
    wire('btnBackStory', () => { hideById('storyScreen'); showById('menu'); });
    wire('btnBackRanking', () => { hideById('rankingScreen'); showById('menu'); });
    wire('btnBackCharStore', () => { hideById('charStoreScreen'); showById('menu'); });
    wire('btnBackAdmin', () => { showById('optionsScreen'); hide('adminPanel'); });

    // Pause / game over buttons
    wire('resumeBtn', () => { hideById('pause'); if (typeof G !== 'undefined') G.state = 'playing'; });
    wire('quitBtn', () => { if (typeof window.quitToMenu === 'function') window.quitToMenu(); });
    wire('pauseShopBtn', () => { showById('shop'); hideById('pause'); });
    wire('retryBtn', () => { if (typeof window.startQuickRun === 'function') window.startQuickRun(); });
    wire('menuBtn', () => { if (typeof window.quitToMenu === 'function') window.quitToMenu(); });
    wire('overShopBtn', () => { showById('shop'); hideById('over'); });

    // Shop close
    wire('shopClose', () => { hideById('shop'); if (typeof G !== 'undefined' && G.state === 'playing') showById('pause'); else showById('menu'); });

    // Help
    wire('helpClose', () => { hideById('help'); showById('menu'); });

    // Render de story levels
    function renderStoryLevels() {
      // Dejarle el render al game.js si expone la función
      if (typeof window.renderStoryLevels === 'function') window.renderStoryLevels();
    }

    console.log('[Boot] Menú listo');
  }

  // Esperar DOM listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    $: $,
    show: showById,
    hide: hideById,
    el,
    refresh, wallet, menuStats, alienCards, setPlaying,
    banner, toast, boss, combo,
    screenFlash, hurtFlash, showGodIndicator, updateStoryHUD,
    gameOver, hideBoot, init,
  };
})();

window.UI = UI;
