# Work 단계 지침 — 2048 게임 구현

## 역할
너는 `/Users/jy/Desktop/my-blog/features/2048-game/spec.md`에 정의되고 사용자가 승인한 2048 게임 기능을 **구현**하는 서브에이전트다.
먼저 spec.md 전체를 읽어라. 특히 "8. 결정 사항"에 사용자가 확정한 요구사항이 있으니 반드시 그대로 반영한다.

## 수정 가능 범위 (이 파일에 명시된 것만 건드릴 것)
- `games/2048/index.html` (신규 작성)
- `games/2048/style.css` (신규 작성)
- `games/2048/game.js` (신규 작성)
- `build.js` (기존 파일 수정 — 아래 "build.js 수정 지침" 참고)
- `templates/layout.html` (기존 파일 수정 — 아래 "헤더 링크" 참고)

**이 외의 파일(`lib/`, `posts/`, `templates/post.html`, `templates/index.html`, `css/style.css`, `js/theme.js`, `serve.js`, `package.json`, `CLAUDE.md` 등)은 절대 수정하지 마라.** `css/style.css`와 `js/theme.js`는 읽기만 하고 그대로 재사용(링크)한다.

## 기존 프로젝트 관례 (반드시 따를 것)
- 외부 라이브러리/프레임워크/CDN 없음. 순수 HTML/CSS/JS + Node 내장 모듈만.
- `css/style.css`에 이미 정의된 CSS 커스텀 프로퍼티를 그대로 사용한다: `--color-bg`, `--color-bg-secondary`, `--color-text`, `--color-text-secondary`, `--color-border`, `--color-link`, `--font-sans`, `--font-mono`. 색상을 하드코딩하지 말고 반드시 이 변수들을 참조해서 다크모드 자동 전환이 되게 한다. 타일 색상(2,4,8,...2048)처럼 게임 고유의 색은 `games/2048/style.css`에 별도 커스텀 프로퍼티로 추가해도 되지만, 배경/텍스트/테두리 같은 공통 UI는 기존 변수를 재사용해라.
- 다크모드 토글 버튼(`#theme-toggle`)과 FOUC 방지 인라인 스크립트는 `templates/layout.html`에 있는 것과 **동일한 패턴**으로 `games/2048/index.html`에도 복제한다 (`<head>`의 동기 인라인 스크립트로 localStorage 확인 후 `data-theme` 설정, `js/theme.js`를 `defer`로 로드). `games/2048/index.html`은 `templates/` 파이프라인을 타지 않는 완전히 독립된 정적 HTML 파일이므로 직접 작성해야 한다.
- `games/2048/index.html`에서 상대 경로는 `../css/style.css`, `../js/theme.js`로 참조한다 (빌드 후 `dist/2048/index.html`에서 봤을 때 `dist/css/style.css`, `dist/js/theme.js`로 가는 경로).

## 게임 구현 요구사항 (spec.md 2~8절 요약, 상세는 spec.md 원문 참고)
- 4x4 격자. 새 게임 시작 시 빈 칸 중 2곳에 무작위 타일(90% 확률 2, 10% 확률 4) 생성.
- 방향키(↑↓←→)로 이동+병합. 같은 턴 내 재병합 금지. 이동으로 실제 변화가 있을 때만 새 타일 1개 생성.
- 병합 시 점수 가산. 점수판에 SCORE(현재)/BEST(최고, `localStorage` 키 `game2048.bestScore`에 저장) 표시.
- 2048 타일 생성 시 승리 오버레이 표시, "계속하기"/"새 게임" 버튼 제공. 계속하기 선택 시 게임 계속(4096 이상도 계속 플레이 가능).
- 더 이상 이동 불가 시 게임 오버 오버레이 + "다시하기" 버튼.
- 새 게임(재시작) 버튼 상시 노출.
- 키보드 방향키 `keydown`에서 `event.preventDefault()`로 스크롤 방지.
- 모바일: `touchstart`/`touchend` 좌표 차이로 스와이프 판별 **+** 화면 하단(또는 보드 아래)에 ↑↓←→ 방향 버튼 4개, 둘 다 지원.
- 타일 이동/병합에 CSS `transition`으로 부드러운 애니메이션.
- `<title>2048 게임 | My Blog</title>`, `<meta name="description" content="방향키로 숫자 타일을 밀어 합치는 2048 퍼즐 게임">`.
- 모바일 반응형: 375px 폭에서도 보드가 화면을 벗어나지 않게 (예: 보드 너비를 `min(90vw, 420px)` 같은 방식으로 제한).

## build.js 수정 지침
- 상단 경로 상수들 근처에 `const GAMES_SRC = path.join(ROOT, 'games', '2048');` 추가.
- `main()` 함수에서 기존 `fs.cpSync(CSS_SRC, ...)` / `fs.cpSync(JS_SRC, ...)` 복사 라인 바로 아래에, `games/2048` 디렉토리가 존재할 때만 복사하도록 조건부로 추가:
  ```js
  if (fs.existsSync(GAMES_SRC)) {
    fs.cpSync(GAMES_SRC, path.join(DIST_DIR, '2048'), { recursive: true });
  }
  ```
- 기존 빌드 로직(포스트 렌더링, 목록 페이지 생성)은 절대 건드리지 마라 — 순수 추가만 한다.

## 헤더 링크 지침 (templates/layout.html)
- `.site-header` 안, 기존 `site-title` 링크와 `#theme-toggle` 버튼 사이(또는 근처)에 "2048" 텍스트 링크를 추가한다. 예:
  ```html
  <a class="site-title" href="{{BASE}}index.html">My Blog</a>
  <a class="nav-link" href="{{BASE}}2048/index.html">2048</a>
  <button id="theme-toggle" ...>
  ```
- 필요하면 `.nav-link` 스타일을 **games/2048/style.css가 아니라** 기존 `css/style.css`에 최소한으로 추가해도 된다 (이건 예외적으로 허용 — 헤더 링크 스타일이 없으면 레이아웃이 깨지므로). 단, 색상은 기존 커스텀 프로퍼티만 사용하고 다른 규칙은 건드리지 마라.

## 완료 후 보고
- 새로 만든 파일 목록과 build.js/templates/layout.html에 실제로 어떤 줄을 추가했는지 diff 요약을 보고해라.
- `node build.js`를 직접 실행해서 `dist/2048/index.html`, `dist/2048/style.css`, `dist/2048/game.js`가 정상 생성되는지 확인하고 결과를 보고해라 (실행 후 에러 유무 포함).
- 이 단계에서는 브라우저 테스트/리뷰는 하지 않는다 (다음 Review 단계에서 별도로 진행됨). 코드 작성과 빌드 성공 확인까지만 하면 된다.
