# 폴더 구조 & 새 웹앱 추가 패턴

## 프로젝트 전체 구조

```
my-blog/
├── CLAUDE.md                  # 작업 사이클 규칙 (이 스킬의 근거 문서)
├── package.json                # scripts만, dependencies 없음
├── build.js                    # 빌드 오케스트레이터 — 포스트 렌더링 + 정적 웹앱 복사
├── serve.js                    # 검증용 정적 서버 (내장 http 모듈만)
├── lib/
│   ├── frontmatter.js
│   ├── markdown.js
│   ├── template.js
│   └── utils.js
├── templates/
│   ├── layout.html             # 공통 셸. .site-header에 모든 웹앱 nav-link가 나열됨
│   ├── post.html
│   └── index.html
├── posts/                      # 마크다운 원본 (블로그 글)
├── css/style.css               # 공통 디자인 토큰(CSS 커스텀 프로퍼티) + 다크모드
├── js/theme.js                 # 다크모드 토글 로직
├── games/2048/                 # 독립 정적 웹앱 예시 1
│   ├── index.html
│   ├── style.css
│   └── game.js
├── pixel-art/                  # 독립 정적 웹앱 예시 2
│   ├── index.html
│   ├── style.css
│   └── editor.js
├── features/                   # 기능별 Plan/Review 산출물 + 서브에이전트 지침
│   └── <feature-slug>/
│       ├── spec.md             # Plan 단계 산출물, 사용자 승인 대상
│       ├── review.md           # Review 단계 산출물
│       └── instructions/
│           ├── plan-instructions.md
│           ├── work-instructions.md
│           └── review-instructions.md
├── .claude/
│   ├── settings.json           # 팀 공유 권한(deny 규칙), 커밋됨
│   ├── settings.local.json     # 개인 allow 목록, gitignore됨
│   ├── launch.json             # preview_start용 서버 설정
│   └── skills/webapp-blog/     # 이 스킬
└── dist/                       # 빌드 산출물, gitignore됨. GitHub Actions가 push 시 빌드
```

`posts/`(원본)와 `dist/posts/`(산출물)가 분리되어 있듯, `features/<slug>/`(과정 산출물)도 `dist/`에는 포함되지 않는다 — 순수 문서/기록용이다.

## 새 독립 웹앱을 추가하는 표준 패턴

이 프로젝트의 웹앱(2048, 픽셀 아트)은 블로그의 마크다운 파이프라인(`templates/`, `lib/`)을 타지 않는 **독립 정적 페이지**다. 새 웹앱을 추가할 때는 아래 패턴을 그대로 반복한다.

### 1. 디렉토리와 파일

프로젝트 루트에 `<app-slug>/` 디렉토리를 만들고 그 안에 `index.html`, `style.css`, `<app-name>.js`(또는 여러 JS 파일)를 둔다. `games/2048/`처럼 games 하위에 둘지, `pixel-art/`처럼 루트 바로 아래 둘지는 앱 성격에 따라 정하면 되지만, URL 경로가 곧 디렉토리명이 되므로 짧고 명확한 slug를 쓴다.

### 2. `index.html`에 반드시 포함할 것 (기존 웹앱 두 개를 그대로 참고)

- FOUC 방지용 동기 인라인 스크립트(`<head>` 안, `templates/layout.html`과 동일 로직):
  ```html
  <script>
    (function () {
      try {
        var stored = localStorage.getItem('theme');
        var theme = stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  </script>
  ```
- `.site-header` 마크업을 `templates/layout.html`과 동일하게 손으로 복제 (독립 페이지라 템플릿 치환이 안 되므로 하드코딩). 상대 경로 주의: 웹앱이 루트 1단계 아래에 있으므로 `../index.html`, `../css/style.css`, `../js/theme.js` 형태.
- `<script src="../js/theme.js" defer></script>`로 다크모드 토글 로직 재사용.
- **웹앱 규칙 반영**: 색상은 `css/style.css`의 CSS 커스텀 프로퍼티(`--color-bg`, `--color-bg-secondary`, `--color-text`, `--color-text-secondary`, `--color-border`, `--color-link`, `--font-sans`, `--font-mono`)만 사용하고 하드코딩하지 않는다. 화면 상단에 사용법을 설명하는 문구(예: "방향키 또는 스와이프로 타일을 밀어 합쳐보세요")를 반드시 넣는다.

### 3. `templates/layout.html`에 nav-link 추가

기존 마지막 `.nav-link` 다음, `#theme-toggle` 버튼 앞에 한 줄 추가:
```html
<a class="nav-link" href="{{BASE}}<app-slug>/index.html"><App 표시명></a>
```
이렇게 하면 블로그 홈/포스트 페이지의 헤더에는 자동 반영되지만, **기존에 만들어 둔 다른 독립 웹앱들의 하드코딩된 헤더에는 반영되지 않는다** — 이건 실제로 pixel-art-editor 기능 Review에서 발견된 버그였다(games/2048/index.html이 새 링크를 놓침). 새 웹앱을 추가할 때마다 기존 독립 웹앱들의 `index.html` 헤더에도 새 nav-link를 수동으로 추가해야 한다는 뜻이므로, Work 또는 Review 단계에서 반드시 체크리스트에 넣는다.

### 4. `build.js`에 복사 블록 추가

파일 상단 상수 선언부(`GAMES_SRC`, `PIXEL_ART_SRC` 근처)에:
```js
const <APP>_SRC = path.join(ROOT, '<app-slug>');
```
`main()` 안, 기존 복사 블록들 바로 아래에 동일 패턴으로:
```js
if (fs.existsSync(<APP>_SRC)) {
  fs.cpSync(<APP>_SRC, path.join(DIST_DIR, '<app-slug>'), { recursive: true });
}
```
기존 포스트 렌더링/목록 생성 로직은 절대 건드리지 않고 순수 추가만 한다.

### 5. `css/style.css`에 웹앱 전용 클래스가 필요하면

`.nav-link`처럼 여러 웹앱이 공유할 만한 클래스는 `css/style.css`에 추가해 재사용한다(2048에서 추가한 `.nav-link`를 pixel-art가 그대로 재사용한 사례). 앱 전용 스타일(격자, 캔버스, 툴바 등)은 해당 앱의 `style.css`에 둔다.
