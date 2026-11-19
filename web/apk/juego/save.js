/* ============================================================
   BEN 10 · OMNITRIX BATTLE 3D — saveGame / SAVE
   Persistencia en localStorage del navegador.
   ============================================================ */

const SAVE_KEY = 'verdix_ben10_save_v1';

const SAVE_DEFAULTS = {
  muted: false,
  aliens: {},           // { heatblast: true, ... }
  coins: 150,
  gems: 5,
  up: { hp: 0, omni: 0, dmg: 0, spd: 0, luck: 0, magnet: 0 },
  modules: { mega: false, shield: false, revive: false, double: false },
  skin: 'ben',
  playerName: 'JUGADOR',
  totalKills: 0,
  storyProgress: 0,
  plays: 0,
  best: 0,
  freeBestWave: 1,
  godMode: false,
  infiniteLife: false,
  admin: false,
  allMaxed: false
};

function _deepMerge(target, source) {
  const out = Object.assign({}, target);
  if (!source) return out;
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      out[k] = _deepMerge(target[k] || {}, source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

let SAVE = _deepMerge(SAVE_DEFAULTS, null);

try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    SAVE = _deepMerge(SAVE_DEFAULTS, JSON.parse(raw));
    // sanear aliens al menos el primero desbloqueado
  }
} catch (e) { console.warn('[Save] No se pudo cargar el guardado:', e); }

function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
}

function resetSave() {
  SAVE = _deepMerge(SAVE_DEFAULTS, null);
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

window.SAVE = SAVE;
window.saveGame = saveGame;
window.resetSave = resetSave;
