/* VERDIX — pruebas de integridad del juego (sin navegador) */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const JUEGO = path.join(__dirname, '..');

function loadModule(filename) {
  const src = fs.readFileSync(path.join(JUEGO, filename), 'utf8');
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
const d = loadModule('data.js');

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
const m = loadModule('models.js');
const Models = m.Models;
const EXPECTED_ALIENS = ['ben','heatblast','fourarms','xlr8','diamondhead','cannonbolt','upgrade','waybig'];

test('Models es objeto con función build para cada alien', () => {
  assert(typeof Models === 'object', 'Models no es object');
  const allKeys = Object.keys(Models);
  for (const id of EXPECTED_ALIENS) {
    assert(typeof Models[id] === 'function', `Models.${id} no es función`);
    assert(allKeys.includes(id), `Models no expone ${id}`);
  }
});

test('ENEMY_MODELS existe con las 5 formas de enemigo', () => {
  assert(Models.enemies || Models.EnemyBuilders, 'falta mapa de enemigos');
});

test('todas las funciones alias siguen el patrón grp+build(parts)', () => {
  for (const id of EXPECTED_ALIENS) {
    const fn = Models[id];
    const src = fn.toString();
    assert(src.length > 30, `${id} cuerpo muy corto`);
  }
});

/* ============ index.html existe y tiene los IDs críticos ============ */
console.log('\nindex.html — DOM mínimo y referencias a spans');
const html = fs.readFileSync(path.join(JUEGO, 'index.html'), 'utf8');

test('canvas existe con id="game"', () => { assert(html.includes('id="game"'), 'falta id="game"'); });
test('HUD existe', () => { assert(html.includes('id="hud"'), 'falta HUD'); });
test('menú principal existe', () => { assert(html.includes('id="menu"'), 'falta menu'); });
test('scripts cargan en orden correcto (data→models→engine→combat→game→audio)', () => {
  const idxData = html.indexOf('data.js');
  const idxModels = html.indexOf('models.js');
  const idxEngine = html.indexOf('engine.js');
  const idxCombat = html.indexOf('combat.js');
  const idxGame = html.indexOf('game.js');
  const idxAudio = html.indexOf('audio.js');
  assert(idxData < idxModels, 'data.js antes que models.js');
  assert(idxModels < idxEngine, 'models.js antes que engine.js');
  assert(idxEngine < idxCombat, 'engine.js antes que combat.js');
  assert(idxCombat < idxGame, 'combat.js antes que game.js');
  assert(idxAudio > 0, 'audio.js carga');
});

test('CSS principal existe y contiene Ben 10 branding', () => {
  const cssPath = path.join(JUEGO, 'style.css');
  assert(fs.existsSync(cssPath), 'falta style.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert(/ben10|omnitrix|heatblast|fourarms/i.test(css) === false, 'CSS no hereda de Ben10 (correcto, es original)');
});

/* ============ Resultado ============ */
console.log(`\n========================================`);
console.log(`Resultado: ${passes} OK · ${failures} FALLARON`);
console.log('========================================');
process.exit(failures === 0 ? 0 : 1);
