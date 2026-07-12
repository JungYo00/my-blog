# Work 단계 지침 — 픽셀 아트 에디터 구현

## 역할
너는 `/Users/jy/Desktop/my-blog/features/pixel-art-editor/spec.md`에 정의되고 사용자가 승인한 픽셀 아트 에디터 기능을 **구현**하는 서브에이전트다.
먼저 spec.md 전체를 읽어라. 특히 "9. 결정 사항" 절에 사용자가 확정한 요구사항이 있으니 반드시 그대로 반영한다.

## 수정 가능 범위 (이 파일에 명시된 것만 건드릴 것)
- `pixel-art/index.html` (신규 작성)
- `pixel-art/style.css` (신규 작성)
- `pixel-art/editor.js` (신규 작성)
- `build.js` (기존 파일 수정 — 아래 "build.js 수정 지침" 참고)
- `templates/layout.html` (기존 파일 수정 — 아래 "헤더 링크" 참고)

**이 외의 파일(`lib/`, `posts/`, `templates/post.html`, `templates/index.html`, `css/style.css`, `js/theme.js`, `serve.js`, `package.json`, `CLAUDE.md`, `games/2048/*` 등)은 절대 수정하지 마라.**

## 기존 프로젝트 관례 (반드시 따를 것)
- 외부 라이브러리/프레임워크/CDN 없음. 순수 HTML/CSS/JS + 브라우저 내장 API(canvas 등)만 사용.
- `css/style.css`의 CSS 커스텀 프로퍼티(`--color-bg`, `--color-bg-secondary`, `--color-text`, `--color-text-secondary`, `--color-border`, `--color-link`, `--font-sans`, `--font-mono`)를 공통 UI(배경/텍스트/버튼/테두리)에 그대로 재사용해서 다크모드 자동 대응. 색상을 하드코딩하지 마라.
- `games/2048/index.html`을 참고 예시로 읽어라 — 독립 정적 페이지에서 `templates/layout.html`과 동일한 다크모드 토글(`#theme-toggle`) + FOUC 방지 인라인 스크립트 패턴, `.site-header` 구조를 어떻게 복제했는지 그대로 따라 한다. `pixel-art/index.html`에서도 `../css/style.css`, `../js/theme.js`를 상대경로로 로드한다.

## 구현 요구사항 (spec.md 2~9절 요약, 상세는 spec.md 원문 참고)
- **격자**: 16x16 논리 픽셀. canvas 기반 구현(오프스크린 16x16 데이터 + 화면 표시용 확대 렌더링, `imageSmoothingEnabled = false`). 도트 크기 24px(384x384 캔버스), `@media (max-width: 480px)`에서 18px(288x288)로 축소.
- **그리기**: 클릭으로 도트 찍기, `mousedown`→`mousemove`(누른 상태)→`mouseup`/`mouseleave`로 드래그 연속 칠하기. 터치도 동일하게(`touchstart`/`touchmove`/`touchend`) 지원하고, 캔버스에 `touch-action: none`을 줘서 드래그 중 페이지 스크롤이 함께 일어나지 않게 한다.
- **지우개**: 별도 "지우개" 버튼으로 모드 전환(우클릭 방식 금지). 지우개로 칠한 칸은 투명 처리(`clearRect`).
- **전체 지우기**: 버튼 클릭 시 확인 다이얼로그 없이 즉시 전체 초기화.
- **색상 팔레트**: 아래 16색 고정 사용 + 팔레트 마지막에 `<input type="color">` 커스텀 색상 선택 추가.
  ```
  #000000, #ffffff, #808080, #ff0000, #ff8c00, #ffd700, #00ff00, #00bfff,
  #0000ff, #8a2be2, #ff69b4, #a0522d, #ffb6c1, #98fb98, #87ceeb, #f5deb3
  ```
  선택된 스와치는 `outline: 2px solid var(--color-link); outline-offset: 2px;`로 강조.
- **PNG 저장**: "저장" 버튼 클릭 → 16x16 논리 데이터를 256x256(16배) 캔버스에 `imageSmoothingEnabled = false`로 확대 렌더링 → `canvas.toDataURL('image/png')` → `<a download="pixel-art.png">` 프로그래매틱 클릭으로 다운로드. 투명 배경(그리지 않은 칸)은 PNG에서도 투명으로 유지.
- **헤더 링크**: `templates/layout.html`의 `.site-header`에서 기존 "2048" nav-link 다음에 `<a class="nav-link" href="{{BASE}}pixel-art/index.html">Pixel Art</a>` 추가.
- **페이지 메타**: `<title>픽셀 아트 에디터 | My Blog</title>`, 적절한 `<meta name="description">`.
- 버튼에는 명확한 텍스트 라벨 또는 `aria-label` 부여.

## build.js 수정 지침
- `const GAMES_SRC = path.join(ROOT, 'games', '2048');` 바로 아래에 추가:
  ```js
  const PIXEL_ART_SRC = path.join(ROOT, 'pixel-art');
  ```
- 기존 `if (fs.existsSync(GAMES_SRC)) { fs.cpSync(GAMES_SRC, path.join(DIST_DIR, '2048'), { recursive: true }); }` 블록 바로 아래에 동일 패턴으로 추가:
  ```js
  if (fs.existsSync(PIXEL_ART_SRC)) {
    fs.cpSync(PIXEL_ART_SRC, path.join(DIST_DIR, 'pixel-art'), { recursive: true });
  }
  ```
- 기존 빌드 로직(포스트 렌더링, 목록 페이지 생성, 2048 복사)은 절대 건드리지 마라 — 순수 추가만 한다.

## 완료 후 보고
- 새로 만든 파일 목록과 build.js/templates/layout.html에 실제로 어떤 줄을 추가했는지 diff 요약을 보고해라.
- `node build.js`를 직접 실행해서 `dist/pixel-art/index.html`, `dist/pixel-art/style.css`, `dist/pixel-art/editor.js`가 정상 생성되는지, 기존 `dist/2048/`과 `dist/posts/`도 여전히 정상 생성되는지 확인하고 결과를 보고해라.
- 이 단계에서는 브라우저 테스트/리뷰는 하지 않는다 (다음 Review 단계에서 별도로 진행됨). 코드 작성과 빌드 성공 확인까지만 하면 된다.
