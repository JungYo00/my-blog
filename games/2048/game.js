(function () {
  'use strict';

  var SIZE = 4;
  var GAP = 10; // px, css/grid-bg의 gap/padding 값과 반드시 일치해야 함
  var MOVE_ANIMATION_MS = 130;
  var STORAGE_BEST_KEY = 'game2048.bestScore';

  var boardEl = document.getElementById('board');
  var gridBgEl = document.getElementById('grid-bg');
  var tileLayerEl = document.getElementById('tile-layer');
  var scoreEl = document.getElementById('score-value');
  var bestEl = document.getElementById('best-value');
  var newGameBtn = document.getElementById('new-game-btn');
  var winOverlay = document.getElementById('win-overlay');
  var gameOverOverlay = document.getElementById('gameover-overlay');
  var continueBtn = document.getElementById('continue-btn');
  var winNewGameBtn = document.getElementById('win-new-game-btn');
  var retryBtn = document.getElementById('retry-btn');
  var touchButtons = document.querySelectorAll('.touch-btn');

  var tiles = [];
  var tileEls = {};
  var tileIdCounter = 0;
  var score = 0;
  var best = 0;
  var hasWon = false;
  var locked = false;
  var isAnimating = false;
  var cellSize = 0;

  function loadBest() {
    try {
      var v = parseInt(localStorage.getItem(STORAGE_BEST_KEY), 10);
      return isNaN(v) ? 0 : v;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(v) {
    try {
      localStorage.setItem(STORAGE_BEST_KEY, String(v));
    } catch (e) {
      /* localStorage 사용 불가 시 무시 */
    }
  }

  function createGridBgCells() {
    gridBgEl.innerHTML = '';
    for (var i = 0; i < SIZE * SIZE; i++) {
      var cell = document.createElement('div');
      cell.className = 'grid-cell';
      gridBgEl.appendChild(cell);
    }
  }

  function measureBoard() {
    var size = boardEl.clientWidth;
    cellSize = (size - GAP * 5) / 4;
  }

  function buildValueGrid() {
    var g = [];
    for (var r = 0; r < SIZE; r++) g.push(new Array(SIZE).fill(null));
    tiles.forEach(function (t) {
      g[t.row][t.col] = t.value;
    });
    return g;
  }

  function getLinePositions(dir, index) {
    var positions = [];
    var i;
    if (dir === 'left') {
      for (i = 0; i < SIZE; i++) positions.push([index, i]);
    } else if (dir === 'right') {
      for (i = SIZE - 1; i >= 0; i--) positions.push([index, i]);
    } else if (dir === 'up') {
      for (i = 0; i < SIZE; i++) positions.push([i, index]);
    } else if (dir === 'down') {
      for (i = SIZE - 1; i >= 0; i--) positions.push([i, index]);
    }
    return positions;
  }

  function addRandomTile() {
    var g = buildValueGrid();
    var empties = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (!g[r][c]) empties.push([r, c]);
      }
    }
    if (!empties.length) return null;
    var pos = empties[Math.floor(Math.random() * empties.length)];
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = {
      id: ++tileIdCounter,
      value: value,
      row: pos[0],
      col: pos[1],
      merged: false,
      toRemove: false,
      isNew: true,
    };
    tiles.push(tile);
    return tile;
  }

  function canMove() {
    var g = buildValueGrid();
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (!g[r][c]) return true;
        if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
        if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  }

  function positionTile(el, row, col) {
    var left = GAP + col * (cellSize + GAP);
    var top = GAP + row * (cellSize + GAP);
    el.style.width = cellSize + 'px';
    el.style.height = cellSize + 'px';
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  function render() {
    measureBoard();

    var ids = {};
    tiles.forEach(function (t) {
      ids[t.id] = true;
    });
    Object.keys(tileEls).forEach(function (id) {
      if (!ids[id]) {
        tileEls[id].remove();
        delete tileEls[id];
      }
    });

    tiles.forEach(function (t) {
      var el = tileEls[t.id];
      var isNewEl = false;
      if (!el) {
        el = document.createElement('div');
        el.className = 'tile';
        el.style.transition = 'none';
        tileLayerEl.appendChild(el);
        tileEls[t.id] = el;
        isNewEl = true;
      }
      el.textContent = String(t.value);
      el.setAttribute('data-value', t.value > 2048 ? 'super' : String(t.value));
      positionTile(el, t.row, t.col);

      if (isNewEl) {
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth; // 강제 리플로우: 초기 위치가 transition 되지 않도록
        el.classList.add('tile-new');
        window.requestAnimationFrame(function () {
          el.style.transition = '';
        });
      }

      if (t.merged) {
        el.classList.add('tile-merge-pop');
        window.setTimeout(function () {
          el.classList.remove('tile-merge-pop');
        }, 200);
        t.merged = false;
      }
    });
  }

  function updateScoreDisplay() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
  }

  function hideOverlays() {
    winOverlay.hidden = true;
    gameOverOverlay.hidden = true;
  }

  function showWinOverlay() {
    winOverlay.hidden = false;
  }

  function showGameOverOverlay() {
    gameOverOverlay.hidden = false;
  }

  function startNewGame() {
    Object.keys(tileEls).forEach(function (id) {
      tileEls[id].remove();
    });
    tileEls = {};
    tiles = [];
    tileIdCounter = 0;
    score = 0;
    hasWon = false;
    locked = false;
    isAnimating = false;
    hideOverlays();

    addRandomTile();
    addRandomTile();
    updateScoreDisplay();
    render();
  }

  function moveDirection(dir) {
    if (locked || isAnimating) return;

    var tileMap = {};
    tiles.forEach(function (t) {
      tileMap[t.row + ',' + t.col] = t;
    });

    var moved = false;
    var scoreGain = 0;

    for (var index = 0; index < SIZE; index++) {
      var positions = getLinePositions(dir, index);
      var lineTiles = [];
      positions.forEach(function (p) {
        var t = tileMap[p[0] + ',' + p[1]];
        if (t) lineTiles.push(t);
      });

      var resultList = [];
      var i = 0;
      while (i < lineTiles.length) {
        var cur = lineTiles[i];
        var next = lineTiles[i + 1];
        if (next && next.value === cur.value) {
          resultList.push({ survivor: cur, value: cur.value * 2, merged: true, removed: next });
          scoreGain += cur.value * 2;
          i += 2;
        } else {
          resultList.push({ survivor: cur, value: cur.value, merged: false, removed: null });
          i += 1;
        }
      }

      for (var k = 0; k < resultList.length; k++) {
        var entry = resultList[k];
        var pos = positions[k];
        if (entry.survivor.row !== pos[0] || entry.survivor.col !== pos[1]) moved = true;
        entry.survivor.row = pos[0];
        entry.survivor.col = pos[1];
        if (entry.merged) {
          entry.survivor.value = entry.value;
          entry.survivor.merged = true;
          moved = true;
          entry.removed.row = pos[0];
          entry.removed.col = pos[1];
          entry.removed.toRemove = true;
        }
      }
    }

    if (!moved) return;

    isAnimating = true;
    score += scoreGain;
    if (score > best) {
      best = score;
      saveBest(best);
    }
    updateScoreDisplay();
    render();

    window.setTimeout(function () {
      tiles = tiles.filter(function (t) {
        return !t.toRemove;
      });
      tiles.forEach(function (t) {
        t.isNew = false;
      });
      addRandomTile();
      render();
      isAnimating = false;

      if (!hasWon && tiles.some(function (t) { return t.value >= 2048; })) {
        hasWon = true;
        locked = true;
        showWinOverlay();
        return;
      }

      if (!canMove()) {
        locked = true;
        showGameOverOverlay();
      }
    }, MOVE_ANIMATION_MS);
  }

  var KEY_DIR = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };

  document.addEventListener('keydown', function (e) {
    var dir = KEY_DIR[e.key];
    if (!dir) return;
    e.preventDefault();
    moveDirection(dir);
  });

  touchButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      moveDirection(btn.getAttribute('data-dir'));
    });
  });

  var touchStartX = 0;
  var touchStartY = 0;
  var SWIPE_THRESHOLD = 24;

  boardEl.addEventListener(
    'touchstart',
    function (e) {
      var t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
  );

  boardEl.addEventListener(
    'touchend',
    function (e) {
      var t = e.changedTouches[0];
      var dx = t.clientX - touchStartX;
      var dy = t.clientY - touchStartY;
      var absX = Math.abs(dx);
      var absY = Math.abs(dy);
      if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;
      if (absX > absY) {
        moveDirection(dx > 0 ? 'right' : 'left');
      } else {
        moveDirection(dy > 0 ? 'down' : 'up');
      }
    },
    { passive: true }
  );

  newGameBtn.addEventListener('click', startNewGame);
  winNewGameBtn.addEventListener('click', startNewGame);
  retryBtn.addEventListener('click', startNewGame);
  continueBtn.addEventListener('click', function () {
    locked = false;
    winOverlay.hidden = true;
  });

  window.addEventListener('resize', function () {
    render();
  });

  function init() {
    createGridBgCells();
    best = loadBest();
    measureBoard();
    startNewGame();
  }

  init();
})();
