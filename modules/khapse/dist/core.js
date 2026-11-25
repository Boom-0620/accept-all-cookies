/* Deterministic game model. No timers, DOM, random numbers or external services. */
(function (root) {
  'use strict';
  var ROWS = 16, LANES = ['left', 'middle', 'right'];
  function createState(round) {
    return { round: round || 1, removed: [], phase: 'playing', outcome: null, elapsed: 0, reason: '', failedRow: null, emitted: false };
  }
  function parseId(id) {
    var m = /^(\d+)-(left|middle|right)$/.exec(id || '');
    if (!m || +m[1] >= ROWS) return null;
    return { row: +m[1], lane: m[2] };
  }
  function evaluate(removed) {
    var holes = Array.from({ length: ROWS }, function () { return []; });
    removed.forEach(function (id) { var p = parseId(id); if (p && holes[p.row].indexOf(p.lane) < 0) holes[p.row].push(p.lane); });
    for (var r = 0; r < ROWS; r++) {
      if (holes[r].length > 1) return { stable: false, row: r, reason: '第 ' + (r + 1) + ' 层只剩一块，承托不足。' };
      if (r < ROWS - 1) {
        for (var i = 0; i < 2; i++) {
          var side = i === 0 ? 'left' : 'right';
          if (holes[r].indexOf(side) >= 0 && holes[r + 1].indexOf(side) >= 0)
            return { stable: false, row: r, reason: '第 ' + (r + 1) + '、' + (r + 2) + ' 层连续缺少' + (side === 'left' ? '左' : '右') + '侧支撑。' };
        }
      }
    }
    return { stable: true, row: null, reason: '支撑还在，饼塔站稳了。' };
  }
  function preview(state, id) {
    if (!parseId(id) || state.removed.indexOf(id) >= 0) return null;
    return evaluate(state.removed.concat(id));
  }
  function extract(state, id) {
    if (state.phase !== 'playing' || !parseId(id) || state.removed.indexOf(id) >= 0) return false;
    state.removed.push(id);
    var result = evaluate(state.removed);
    state.reason = result.reason;
    state.elapsed = 0;
    if (!result.stable) { state.phase = 'collapsing'; state.failedRow = result.row; }
    else if (state.removed.length === 8) state.phase = 'settling';
    return true;
  }
  function advance(state, ms) {
    if (state.phase !== 'collapsing' && state.phase !== 'settling') return null;
    state.elapsed += Math.max(0, ms);
    var duration = state.phase === 'settling' ? 1600 : 1400;
    if (state.elapsed < duration) return null;
    state.outcome = state.phase === 'settling' ? 'stable' : 'collapsed';
    state.phase = 'finished';
    if (state.emitted) return null;
    state.emitted = true;
    return { type: 'cookie', projectId: 'khapse', outcome: state.outcome };
  }
  function pieces() {
    var out = [];
    for (var r = 0; r < ROWS; r++) {
      var width = 244 - r * 8.1;
      LANES.forEach(function (lane, col) {
        out.push({ id: r + '-' + lane, row: r, lane: lane, col: col,
          x: 180 + (col - 1) * width * 0.28 + (r % 3 - 1) * 2,
          y: 657 - r * 38.2 + (col === 1 ? -3 : 2),
          w: width * 0.50, h: 57,
          angle: ((r % 2 ? -1 : 1) * (col === 1 ? -5 : col === 0 ? -9 : 9)) * Math.PI / 180,
          sprite: r % 4 === 1 ? 1 : r % 4 === 3 ? 2 : 0 });
      });
    }
    return out;
  }
  root.KhapseCore = { ROWS: ROWS, LANES: LANES, createState: createState, parseId: parseId,
    evaluate: evaluate, preview: preview, extract: extract, advance: advance, pieces: pieces };
})(typeof globalThis !== 'undefined' ? globalThis : this);
