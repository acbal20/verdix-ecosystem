/* ============================================================
   BEN 10 · OMNITRIX BATTLE 3D — boot glue
   Arranca el motor 3D, el bucle principal y el input
   (teclado + táctil). Sin este archivo el juego no entra en partida.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  if (!canvas) { console.error('[Boot] falta el canvas #game'); return; }

  /* ---------- Motor 3D ---------- */
  try {
    Engine.init(canvas);
    console.log('[Boot] Motor 3D inicializado');
  } catch (e) {
    console.error('[Boot] Engine.init falló:', e);
    return;
  }

  var $id = function (id) { return document.getElementById(id); };

  /* ---------- MODO HISTORIA ---------- */
  function renderStoryLevels() {
    var wrap = $id('storyLevels');
    if (!wrap || typeof STORY_LEVELS === 'undefined') return;
    wrap.innerHTML = '';
    var progress = getStoryProgress();
    for (var i = 0; i < STORY_LEVELS.length; i++) {
      (function (lvl) {
        var unlocked = isStoryLevelUnlocked(lvl.id);
        var done = progress >= lvl.id;
        var btn = document.createElement('button');
        btn.className = 'storyCard' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
        btn.disabled = !unlocked;
        btn.innerHTML = '<span class="storyNum">' + (done ? '✅' : lvl.id) +
          '</span><span class="storyName">' + lvl.name +
          '</span><span class="storyGoal">' + lvl.goal.label + '</span>';
        if (unlocked) btn.addEventListener('click', function () { window.startStoryRun(lvl.id); });
        wrap.appendChild(btn);
      })(STORY_LEVELS[i]);
    }
  }
  window.renderStoryLevels = renderStoryLevels;

  window.startStoryRun = function (lvl) {
    G.mode = 'story';
    G.storyLevel = lvl;
    UI.hide('storyScreen');
    UI.hide('menu');
    startRun();
  };

  /* ---------- PAUSA / MUTE ---------- */
  function togglePause() {
    if (G.state === 'playing') {
      G.state = 'paused';
      UI.show('pause');
      if (typeof AudioEngine !== 'undefined' && AudioEngine.stopMusic) AudioEngine.stopMusic();
    } else if (G.state === 'paused') {
      G.state = 'playing';
      UI.hide('pause');
      if (typeof AudioEngine !== 'undefined' && AudioEngine.startMusic) AudioEngine.startMusic();
    }
  }
  window.togglePause = togglePause;

  function syncMuteUI() {
    var muted = AudioEngine.isMuted();
    var a = $id('muteBtn'), b = $id('menuMuteBtn'), c = $id('optMuteBtn');
    if (a) a.textContent = muted ? '🔇' : '🔊';
    if (b) b.textContent = muted ? '🔇' : '🔊';
    if (c) c.textContent = muted ? '🔇 Silenciado' : '🔊 Activado';
  }
  function toggleMute() { AudioEngine.toggleMuted(); syncMuteUI(); }
  window.toggleMute = toggleMute;

  function syncQualityUI() {
    var q = $id('optQualityBtn');
    if (!q) return;
    var quality = (typeof SAVE !== 'undefined' && SAVE.quality) || 'high';
    q.textContent = quality === 'high' ? 'Alta' : 'Baja';
    try {
      Engine.renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    } catch (e) {}
  }
  function renderer_highQuality() {
    try { return Engine.renderer.getPixelRatio() > 1.5; } catch (e) { return true; }
  }

  /* ---------- INPUT: TECLADO ---------- */
  var keyMap = {
    KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
    ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd'
  };
  var ALIEN_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'];

  function onKeyDown(e) {
    var k = keyMap[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
    if (e.repeat) { checkGodKey(e.key); return; }
    checkGodKey(e.key);
    switch (e.code) {
      case 'Space': case 'KeyJ':
        input.attack = true; e.preventDefault(); break;
      case 'KeyK':
        useSpecial(); break;
      case 'KeyQ':
        castShield(); break;
      case 'KeyF':
        castHeal(); break;
      case 'ShiftLeft': case 'ShiftRight':
        dash(); break;
      case 'KeyE':
        revertToBen(false); break;
      case 'KeyP': case 'Escape':
        togglePause(); break;
      case 'KeyM':
        toggleMute(); break;
      default:
        var idx = ALIEN_KEYS.indexOf(e.code);
        if (idx >= 0 && typeof ALIEN_ORDER !== 'undefined' && ALIEN_ORDER[idx]) {
          var id = ALIEN_ORDER[idx].id;
          if (typeof isUnlocked === 'function' && isUnlocked(id)) transformTo(id);
          else if (typeof UI !== 'undefined') UI.toast('Desbloqueá este alien en la tienda 🛒');
        }
    }
  }
  function onKeyUp(e) {
    var k = keyMap[e.code];
    if (k) keys[k] = false;
    if (e.code === 'Space' || e.code === 'KeyJ') input.attack = false;
  }
  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);

  /* ---------- INPUT: TÁCTIL (joystick + botones) ---------- */
  var stick = $id('stick'), knob = $id('knob');
  var joyPointer = null;
  var maxR = 40;

  function stickPos(e) {
    var r = stick.getBoundingClientRect();
    maxR = r.width / 2;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var p = e.touches ? e.touches[0] : e;
    var dx = p.clientX - cx, dy = p.clientY - cy;
    var len = Math.hypot(dx, dy);
    if (len > maxR) { dx = dx / len * maxR; dy = dy / len * maxR; }
    return { dx: dx, dy: dy };
  }
  function joyMove(e) {
    if (joyPointer !== null && e.changedTouches) {
      var found = false;
      for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === joyPointer) found = true;
      if (!found) return;
      e.preventDefault();
    }
    var pos = stickPos(e);
    knob.style.transform = 'translate(' + pos.dx + 'px,' + pos.dy + 'px)';
    input.joy.x = pos.dx / maxR;
    input.joy.y = pos.dy / maxR;
  }
  function joyEnd() {
    joyPointer = null;
    knob.style.transform = 'translate(0,0)';
    input.joy.x = 0; input.joy.y = 0;
  }
  if (stick && knob) {
    stick.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      if (t) joyPointer = t.identifier;
      joyMove(e);
    }, { passive: false });
    stick.addEventListener('touchmove', joyMove, { passive: false });
    stick.addEventListener('touchend', joyEnd);
    stick.addEventListener('touchcancel', joyEnd);
    // Ratón (para probar en desktop)
    var mouseDown = false;
    stick.addEventListener('mousedown', function (e) { mouseDown = true; joyMove(e); });
    window.addEventListener('mousemove', function (e) { if (mouseDown) joyMove(e); });
    window.addEventListener('mouseup', function () { if (mouseDown) { mouseDown = false; joyEnd(); } });
  }

  var btnA = $id('btnA'), btnB = $id('btnB'), btnDash = $id('btnDash');
  if (btnA) {
    var attackPulse = null;
    var aDown = function (e) { if (e) e.preventDefault(); input.attack = true; };
    var aUp = function () { clearTimeout(attackPulse); attackPulse = setTimeout(function () { input.attack = false; }, 90); };
    btnA.addEventListener('touchstart', aDown, { passive: false });
    btnA.addEventListener('touchend', aUp);
    btnA.addEventListener('mousedown', aDown);
    btnA.addEventListener('mouseup', aUp);
    btnA.addEventListener('mouseleave', aUp);
    // Toque rápido: asegurar que el bucle vea el golpe aunque dure <1 frame
    btnA.addEventListener('click', function (e) {
      if (e) e.preventDefault();
      input.attack = true;
      clearTimeout(attackPulse);
      attackPulse = setTimeout(function () { input.attack = false; }, 130);
    });
  }
  if (btnB) {
    var bFire = function (e) { if (e) e.preventDefault(); useSpecial(); };
    btnB.addEventListener('touchstart', bFire, { passive: false });
    btnB.addEventListener('click', bFire);
  }
  if (btnDash) {
    var dFire = function (e) { if (e) e.preventDefault(); dash(); };
    btnDash.addEventListener('touchstart', dFire, { passive: false });
    btnDash.addEventListener('click', dFire);
  }
  var btnShield = $id('btnShield'), btnHeal = $id('btnHeal');
  if (btnShield) {
    var sFire = function (e) { if (e) e.preventDefault(); castShield(); };
    btnShield.addEventListener('touchstart', sFire, { passive: false });
    btnShield.addEventListener('click', sFire);
  }
  if (btnHeal) {
    var hFire = function (e) { if (e) e.preventDefault(); castHeal(); };
    btnHeal.addEventListener('touchstart', hFire, { passive: false });
    btnHeal.addEventListener('click', hFire);
  }

  /* ---------- BOTONES DE HUD / OPCIONES ---------- */
  function wire(id, fn) { var e = $id(id); if (e) e.addEventListener('click', fn); }
  wire('pauseBtn', togglePause);
  wire('muteBtn', toggleMute);
  wire('menuMuteBtn', toggleMute);
  wire('optMuteBtn', toggleMute);
  wire('optGodBtn', function () { toggleGodMode(); this.textContent = godModeActive ? 'Activado ✅' : 'Desactivado'; });
  wire('optQualityBtn', function () {
    var current = (typeof SAVE !== 'undefined' && SAVE.quality) || 'high';
    var next = current === 'high' ? 'low' : 'high';
    if (typeof SAVE !== 'undefined') { SAVE.quality = next; if (typeof saveGame === 'function') saveGame(); }
    try {
      Engine.renderer.setPixelRatio(next === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    } catch (e) {}
    this.textContent = next === 'high' ? 'Alta' : 'Baja';
  });
  wire('btnControls', function () { UI.hide('menu'); UI.show('controlsScreen'); });

  // God: mostrar el botón solo a admins/creador
  if (typeof isAdmin === 'function' && (isAdmin() || (typeof SAVE !== 'undefined' && SAVE.admin))) {
    var og = $id('optGodBtn'); if (og) og.classList.remove('hidden');
  }

  /* ---------- AUDIO: desbloqueo con primer gesto ---------- */
  var unlocked = false;
  function unlockAudio() {
    if (unlocked) return;
    unlocked = true;
    if (typeof AudioEngine !== 'undefined' && AudioEngine.unlock) AudioEngine.unlock();
  }
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  /* ---------- BUCLE PRINCIPAL ---------- */
  var last = performance.now(), frames = 0;
  var lastErrorLog = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frames++;

    try { if (typeof update === 'function') update(dt); } catch (e) {
      if (now - lastErrorLog > 3000) { lastErrorLog = now; console.error('[Loop] update():', e); }
    }
    try { Engine.updateFX(dt); } catch (e) {}
    try { if (Engine.updateFlash) Engine.updateFlash(dt); } catch (e) {}

    var playing = G.state === 'playing';
    var target = (typeof P !== 'undefined' && P && P.pos) ? P.pos : { x: 0, y: 0, z: 0 };
    var mx = (keys.a ? -1 : 0) + (keys.d ? 1 : 0) + input.joy.x;
    var mz = (keys.w ? -1 : 0) + (keys.s ? 1 : 0) + input.joy.y;
    try { Engine.updateCamera(dt, playing ? 'play' : 'menu', target, { x: mx, z: mz }); } catch (e) {}

    if (frames % 5 === 0 && typeof UI !== 'undefined') {
      try { UI.refresh(); } catch (e) {}
    }
    try { Engine.render(); } catch (e) {}
  }
  requestAnimationFrame(frame);
  syncMuteUI();
  console.log('[Boot] Bucle principal iniciado');
})();
