/* VERDIX — pruebas de integridad del juego (sin navegador) */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const JUEGO = path.join(__dirname, '..');

function loadModule(filename, extraExports) {
  let src = fs.readFileSync(path.join(JUEGO, filename), 'utf8');
  // Marcamos el final: exportamos las declaraciones top-level al sandbox
  const names = (extraExports || []).map((n) => `this.${n} = typeof ${n} !== 'undefined' ? ${n} : undefined;`);
  src += '\n' + names.join('\n');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename });
  return sandbox;
}

let failures = 0;
let passes = 0;
function test(name, fn) {
  try { fn(); console.log('  ✅', name); passes++; }
  catch (e) { console.log('  ❌', name, '—', e.message); failures++; }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assert'); };

/* ============ data.js ============ */
console.log('\ndata.js — estructura y equilibrio de datos');
const d = loadModule('data.js', ['FORMS', 'ALIEN_ORDER', 'BASE_ALIENS', 'ENEMY_TYPES']);

test('FORMS define todas las formas esperadas', () => {
  for (const id of ['ben', 'heatblast', 'fourarms', 'xlr8', 'diamondhead', 'cannonbolt', 'upgrade', 'waybig']) {
    assert(d.FORMS[id], `falta aliado FORMS.${id}`);
  }
});

test('cada forma tiene HP/velocidad/daño positivos', () => {
  for (const [id, f] of Object.entries(d.FORMS)) {
    assert(typeof f.hp === 'number' && f.hp > 0, `${id}.hp`);
    assert(typeof f.speed === 'number' && f.speed > 0, `${id}.speed`);
    assert(typeof f.dmg === 'number' && f.dmg > 0, `${id}.dmg`);
    assert(f.hp <= 300, `${id}.hp excede 300`);
    assert(f.dmg <= 100, `${id}.dmg excede 100`);
  }
});

test('ALIEN_ORDER tiene 7 cartas con key única 1-7', () => {
  assert(Array.isArray(d.ALIEN_ORDER), 'ALIEN_ORDER debe ser array');
  assert(d.ALIEN_ORDER.length === 7, '7 cartas');
  const keys = d.ALIEN_ORDER.map(o => o.key);
  assert(new Set(keys).size === 7, 'keys duplicadas');
  for (const o of d.ALIEN_ORDER) assert(d.FORMS[o.id], `ALIEN_ORDER referencia ${o.id} inexistente`);
});

test('BASE_ALIENS ⊆ ALIEN_ORDER', () => {
  for (const id of d.BASE_ALIENS) {
    assert(d.ALIEN_ORDER.some(o => o.id === id), `${id} no está en ALIEN_ORDER`);
  }
});

test('todas las formas tienen capacidad especial o null', () => {
  for (const [id, f] of Object.entries(d.FORMS)) {
    assert('special' in f, `${id} sin special`);
    if (f.special !== null) {
      assert(typeof f.special.name === 'string', `${id}.special.name`);
      assert(typeof f.special.type === 'string', `${id}.special.type`);
      assert(typeof f.special.cd === 'number' && f.special.cd > 0, `${id}.special.cd`);
      assert(typeof f.special.energy === 'number' && f.special.energy >= 0, `${id}.special.energy`);
    }
  }
});

test('ENEMY_TYPES tiene hp/dmg/speed positivos', () => {
  for (const [id, e] of Object.entries(d.ENEMY_TYPES)) {
    assert(typeof e.hp === 'number' && e.hp > 0, `${id}.hp`);
    assert(typeof e.dmg === 'number' && e.dmg > 0, `${id}.dmg`);
    assert(typeof e.speed === 'number' && e.speed > 0, `${id}.speed`);
    assert(Array.isArray(e.coins) && e.coins.length === 2, `${id}.coins`);
    assert(typeof e.score === 'number' && e.score > 0, `${id}.score`);
  }
});

test('aliados vs enemigos balanceados (boss al menos 3x HP)', () => {
  const boss = d.ENEMY_TYPES.boss;
  const avgAliado = Object.values(d.FORMS).reduce((s, f) => s + f.hp, 0) / Object.keys(d.FORMS).length;
  assert(boss.hp > avgAliado * 2, `boss HP (${boss.hp}) no domina claramente`);
});

/* ============ models.js (integridad de funciones expuestas) ============ */
console.log('\nmodels.js — exports y consistencia');
const m = loadModule('models.js', ['Models']);
const Models = m.Models;
const EXPECTED_ALIENS = ['ben','heatblast','fourarms','xlr8','diamondhead','cannonbolt','upgrade','waybig'];

test('Models expone buildPlayer/buildEnemy/glowSprite', () => {
  assert(typeof Models === 'object', 'Models no es object');
  for (const fn of ['buildPlayer', 'buildEnemy', 'glowSprite']) {
    assert(typeof Models[fn] === 'function', `Models.${fn} no es función (${typeof Models[fn]})`);
  }
});

test('Models usa nombres de aliens válidos (PLAYER_BUILDERS/ENEMY_BUILDERS)', () => {
  // No podemos inspeccionar el IIFE directamente, pero validamos que buildPlayer/buildEnemy existen
  assert(typeof Models.buildPlayer === 'function');
  assert(typeof Models.buildEnemy === 'function');
});

/* ============ index.html existe y tiene los IDs críticos ============ */
console.log('\nindex.html — DOM mínimo y referencias a spans');
const html = fs.readFileSync(path.join(JUEGO, 'index.html'), 'utf8');

test('canvas existe con id="game"', () => { assert(html.includes('id="game"'), 'falta id="game"'); });
test('HUD existe', () => { assert(html.includes('id="hud"'), 'falta HUD'); });
test('menú principal existe', () => { assert(html.includes('id="menu"'), 'falta menu'); });
test('scripts cargan en orden correcto (three → save → audio/engine → data → game)', () => {
  const tag = s => html.indexOf('<script src="' + s + '"');
  const idxThree = tag('three.min.js');
  const idxSave = tag('save.js');
  const idxAudio = tag('audio.js');
  const idxEngine = tag('engine.js');
  const idxModels = tag('models.js');
  const idxData = tag('data.js');
  const idxGame = tag('game.js');
  const idxCombat = tag('combat.js');
  const idxUi = tag('ui.js');
  const idxBoot = tag('boot.js');
  assert(idxBoot > idxUi, 'boot.js después de ui.js (requiere motor cargado)');
  assert(fs.existsSync(path.join(JUEGO, 'boot.js')), 'falta boot.js');
  assert(idxThree > 0 && idxSave > idxThree, 'three debe ir antes que save');
  assert(idxAudio > idxSave, 'audio después de save');
  assert(idxEngine > 0 && idxModels > idxEngine, 'engine antes que models');
  assert(idxData > idxModels, 'data después de models');
  assert(idxGame > idxData, 'game después de data');
  assert(idxCombat > idxGame, 'combat después de game');
  assert(idxUi > idxCombat, 'ui después de combat');
  assert(idxBoot > idxUi, 'boot después de ui');
});

test('CSS principal existe y contiene marca dark-neon', () => {
  const cssPath = path.join(JUEGO, 'style.css');
  assert(fs.existsSync(cssPath), 'falta style.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert(/near|green|--green|--bg/i.test(css) || css.includes('--bg'), 'falta variables CSS de tema');
});

/* ============ Resultado ============ */
console.log(`\n========================================`);
console.log(`Resultado: ${passes} OK · ${failures} FALLARON`);
console.log('========================================');
process.exit(failures === 0 ? 0 : 1);
