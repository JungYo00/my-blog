(function () {
  var LOGICAL_SIZE = 16;
  var SAVE_SCALE = 16; // 16x16 -> 256x256

  var canvas = document.getElementById('pixel-canvas');
  var ctx = canvas.getContext('2d');

  // 실제 그림 데이터는 16x16 오프스크린(논리) 캔버스로 관리하고,
  // 화면에는 imageSmoothingEnabled = false로 확대해서 그린다.
  var dataCanvas = document.createElement('canvas');
  dataCanvas.width = LOGICAL_SIZE;
  dataCanvas.height = LOGICAL_SIZE;
  var dataCtx = dataCanvas.getContext('2d');

  var palette = document.getElementById('palette');
  var swatches = Array.prototype.slice.call(palette.querySelectorAll('.swatch[data-color]'));
  var customColorInput = document.getElementById('custom-color-input');
  var eraserBtn = document.getElementById('eraser-btn');
  var clearBtn = document.getElementById('clear-btn');
  var saveBtn = document.getElementById('save-btn');

  var currentColor = '#000000';
  var isErasing = false;
  var isDrawing = false;

  function render() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      dataCanvas,
      0, 0, LOGICAL_SIZE, LOGICAL_SIZE,
      0, 0, canvas.width, canvas.height
    );
  }

  function getLogicalCoords(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var cellW = rect.width / LOGICAL_SIZE;
    var cellH = rect.height / LOGICAL_SIZE;
    var col = Math.floor((clientX - rect.left) / cellW);
    var row = Math.floor((clientY - rect.top) / cellH);
    if (col < 0 || col >= LOGICAL_SIZE || row < 0 || row >= LOGICAL_SIZE) return null;
    return { col: col, row: row };
  }

  function paintCell(col, row) {
    if (isErasing) {
      dataCtx.clearRect(col, row, 1, 1);
    } else {
      dataCtx.fillStyle = currentColor;
      dataCtx.fillRect(col, row, 1, 1);
    }
    render();
  }

  function handlePointer(clientX, clientY) {
    var coords = getLogicalCoords(clientX, clientY);
    if (coords) paintCell(coords.col, coords.row);
  }

  function updateEraserUI() {
    eraserBtn.classList.toggle('active', isErasing);
    eraserBtn.setAttribute('aria-pressed', String(isErasing));
  }

  function clearSelection() {
    swatches.forEach(function (el) {
      el.classList.remove('selected');
    });
    customColorInput.classList.remove('selected');
  }

  function selectColor(color, el) {
    currentColor = color;
    isErasing = false;
    updateEraserUI();
    clearSelection();
    if (el) el.classList.add('selected');
  }

  // 팔레트 스와치 클릭
  swatches.forEach(function (el) {
    el.addEventListener('click', function () {
      selectColor(el.getAttribute('data-color'), el);
    });
  });

  // 커스텀 색상 선택
  customColorInput.addEventListener('input', function () {
    selectColor(customColorInput.value, customColorInput);
  });

  // 지우개 모드 토글
  eraserBtn.addEventListener('click', function () {
    isErasing = !isErasing;
    updateEraserUI();
  });

  // 전체 지우기 (확인 다이얼로그 없이 즉시 실행)
  clearBtn.addEventListener('click', function () {
    dataCtx.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);
    render();
  });

  // PNG 저장 (256x256, 16배 업스케일, 투명 배경 유지)
  saveBtn.addEventListener('click', function () {
    var saveSize = LOGICAL_SIZE * SAVE_SCALE;
    var saveCanvas = document.createElement('canvas');
    saveCanvas.width = saveSize;
    saveCanvas.height = saveSize;
    var saveCtx = saveCanvas.getContext('2d');
    saveCtx.imageSmoothingEnabled = false;
    saveCtx.drawImage(
      dataCanvas,
      0, 0, LOGICAL_SIZE, LOGICAL_SIZE,
      0, 0, saveSize, saveSize
    );

    var link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = saveCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // 마우스 드래그로 연속 칠하기
  canvas.addEventListener('mousedown', function (e) {
    isDrawing = true;
    handlePointer(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    handlePointer(e.clientX, e.clientY);
  });

  canvas.addEventListener('mouseup', function () {
    isDrawing = false;
  });

  canvas.addEventListener('mouseleave', function () {
    isDrawing = false;
  });

  // 터치 드래그로 연속 칠하기 (페이지 스크롤 방지)
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    isDrawing = true;
    var touch = e.touches[0];
    if (touch) handlePointer(touch.clientX, touch.clientY);
  }, { passive: false });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (!isDrawing) return;
    var touch = e.touches[0];
    if (touch) handlePointer(touch.clientX, touch.clientY);
  }, { passive: false });

  canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    isDrawing = false;
  }, { passive: false });

  canvas.addEventListener('touchcancel', function () {
    isDrawing = false;
  });

  render();
})();
