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

  function esc(t) { const d = document.createElement('div'); d.textContent = String(t == null ? '' : t); return d.innerHTML; }

  function applyControls() {
    const touch = $('touch'); if (!touch) return;
    const c = (typeof SAVE !== 'undefined' && SAVE.controls) ? SAVE.controls : {};
    touch.style.setProperty('--stick-size', (c.stickSize || 118) + 'px');
    touch.style.setProperty('--btn-size', (c.btnSize || 68) + 'px');
    touch.style.setProperty('--ctrl-scale', String((c.scale || 100) / 100));
    touch.classList.toggle('layout-left', c.layout === 'left');
    const vals = { ctrlStickSize: c.stickSize || 118, ctrlBtnSize: c.btnSize || 68, ctrlScale: c.scale || 100 };
    Object.keys(vals).forEach(id => { const e = $(id); if (e) e.value = vals[id]; });
  }

  function renderFriends() {
    const list = $('friendsList'); if (!list) return;
    const fr = (typeof SAVE !== 'undefined' && Array.isArray(SAVE.friends)) ? SAVE.friends : [];
    list.innerHTML = '';
    if (!fr.length) { list.innerHTML = '<div class="rankingRow placeholder">Todavía no agregaste amigos.</div>'; return; }
    fr.forEach((name, i) => {
      const row = document.createElement('div');
      row.className = 'rankingRow';
      row.innerHTML = '<span class="rankPos">' + (i + 1) + '</span><span class="rankName">' + esc(name) + '</span>';
      const del = document.createElement('button');
      del.className = 'iconBtn'; del.textContent = '✕'; del.title = 'Quitar amigo';
      del.addEventListener('click', () => { SAVE.friends.splice(i, 1); saveGame(); renderFriends(); toast('Amigo quitado'); });
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  function renderLocalRanking() {
    const list = $('rankingList'); if (!list) return;
    list.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'rankingRow';
    row.innerHTML = '<span class="rankPos">1</span><span class="rankName">' + esc((typeof SAVE !== 'undefined' && SAVE.playerName) || 'JUGADOR') + ' (tú)</span><span class="rankScore">' + ((typeof SAVE !== 'undefined' && SAVE.best) | 0) + '</span>';
    list.appendChild(row);
    const st = $('rankingStatus');
    if (st) {
      st.classList.remove('hidden');
      st.textContent = 'Modo local: Firebase no configurado. Tu mejor puntaje se guarda en este dispositivo.';
    }
  }

  function init() {
    // Cargar stats en menú
    menuStats();
    wallet();
    alienCards();
    applyControls();
    const pn = $('profileName'); if (pn) pn.textContent = (typeof SAVE !== 'undefined' && SAVE.playerName) || 'JUGADOR';
    const pb = $('profileBar'); if (pb) pb.classList.remove('hidden');
    renderLocalRanking();

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
    wire('btnFriends', () => { hideById('menu'); showById('friendsScreen'); renderFriends(); });
    wire('btnBackFriends', () => { hideById('friendsScreen'); showById('menu'); });
    wire('btnAddFriend', () => {
      const inp = $('friendNameInput'); if (!inp) return;
      const name = (inp.value || '').trim().replace(/[^\p{L}\p{N} ]/gu, '').slice(0, 16);
      if (name.length < 2) { toast('Escribí un nombre de al menos 2 caracteres', 'error'); return; }
      if (!Array.isArray(SAVE.friends)) SAVE.friends = [];
      if (SAVE.friends.some(f => f.toLowerCase() === name.toLowerCase())) { toast('Ese amigo ya está en la lista'); return; }
      SAVE.friends.push(name); saveGame(); inp.value = ''; renderFriends(); toast('Amigo agregado: ' + name);
    });
    wire('btnChangeName', () => {
      hideById('menu'); showById('profileScreen');
      const inp = $('playerNameInput'); if (inp) inp.value = SAVE.playerName || '';
      const msg = $('profileMsg'); if (msg) msg.classList.add('hidden');
    });
    wire('btnSaveName', () => {
      const inp = $('playerNameInput'); if (!inp) return;
      const name = (inp.value || '').trim().replace(/[^\p{L}\p{N} ]/gu, '').slice(0, 16);
      const msg = $('profileMsg');
      if (name.length < 2) { if (msg) { msg.textContent = 'Mínimo 2 caracteres (letras o números).'; msg.classList.remove('hidden'); } return; }
      SAVE.playerName = name; saveGame();
      const pn = $('profileName'); if (pn) pn.textContent = name;
      hideById('profileScreen'); showById('menu'); toast('Nombre guardado: ' + name);
      renderLocalRanking();
    });
    wire('btnCancelName', () => { hideById('profileScreen'); showById('menu'); });
    wire('btnRefreshRanking', () => { renderLocalRanking(); toast('Ranking local actualizado'); });
    wire('btnAddMod', () => {
      const inp = $('adminNameInput'); if (!inp) return;
      const name = (inp.value || '').trim().slice(0, 16);
      if (name.length < 2) { toast('Nombre inválido', 'error'); return; }
      if (!Array.isArray(SAVE.moderators)) SAVE.moderators = [];
      if (SAVE.moderators.includes(name)) { toast('Ya es moderador'); return; }
      SAVE.moderators.push(name); saveGame(); inp.value = '';
      const list = $('adminList');
      if (list) { list.innerHTML = ''; SAVE.moderators.forEach(m => { const e = document.createElement('div'); e.className = 'adminRow'; e.textContent = m; list.appendChild(e); }); }
      toast('Moderador agregado: ' + name);
    });
    const persistCtrl = () => { if (typeof saveGame === 'function') saveGame(); };
    [['ctrlBtnSize', 'btnSize'], ['ctrlStickSize', 'stickSize'], ['ctrlScale', 'scale']].forEach(([id, key]) => {
      const e = $(id);
      if (e) e.addEventListener('input', ev => { SAVE.controls[key] = +ev.target.value; applyControls(); });
    });
    wire('ctrlLayoutLeft', () => { SAVE.controls.layout = 'left'; applyControls(); toast('Controles a la izquierda'); });
    wire('ctrlLayoutRight', () => { SAVE.controls.layout = 'right'; applyControls(); toast('Controles a la derecha'); });
    wire('btnResetControls', () => { SAVE.controls = { stickSize: 118, btnSize: 68, scale: 100, layout: 'right' }; applyControls(); persistCtrl(); toast('Controles restaurados'); });
    wire('btnSaveControls', () => { applyControls(); persistCtrl(); toast('Controles guardados'); });

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
