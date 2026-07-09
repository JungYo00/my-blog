# my-blog

마크다운 파일을 읽어서 정적 블로그 웹사이트로 변환하는 프로젝트.

## 목표

- 마크다운으로 글을 작성하면 블로그 포스트로 렌더링
- 노션(Notion) 스타일의 깔끔하고 읽기 좋은 디자인
- 다크모드 지원
- 모바일 반응형
- **프레임워크 없이 순수 HTML, CSS, JavaScript로만 구현** (React/Vue/빌드 툴체인 금지)

## 기술 스택 / 제약

- 순수 HTML/CSS/JS, 프레임워크 및 번들러 없음. `package.json`에 `dependencies`가 없어 `npm install` 자체가 불필요
- **빌드 타임 정적 생성(SSG)** 방식: `node build.js`가 Node 내장 모듈(`fs`, `path`)만으로 `/posts/*.md`를 읽어 `dist/`에 정적 `.html`을 미리 생성. 브라우저는 CSR로 md를 fetch하지 않음 — JS 없이도 글 본문이 그대로 보임(progressive enhancement)
- 마크다운 파서(`lib/markdown.js`)와 front matter 파서(`lib/frontmatter.js`)는 외부 라이브러리 없이 직접 구현
- 외부 CDN 의존 없음 — 폰트는 시스템 폰트 스택 사용

## 구조

```
build.js            빌드 오케스트레이터 (entry point, `node build.js`)
serve.js             dist/ 를 서빙하는 최소 정적 서버 (`node serve.js`, 내장 http 모듈만)
lib/
  frontmatter.js     parseFrontMatter(raw) -> {data, content}
  markdown.js        renderMarkdown(md) -> html (블록 파서 + 인라인 파서)
  template.js        render(str, vars) — {{KEY}} 치환기
  utils.js           escapeHtml, slugify, formatDate
templates/
  layout.html        공통 셸 (head, 헤더+다크모드 토글, footer), FOUC 방지 인라인 스크립트 포함
  post.html          포스트 본문 내부 템플릿
  index.html         목록 페이지 내부 템플릿
posts/               마크다운 원본 전용 (.md, front matter 포함)
css/style.css        편집 대상, 빌드 시 dist/css로 복사
js/theme.js          다크모드 토글 로직, 빌드 시 dist/js로 복사
dist/                빌드 산출물 — 정적 호스팅 루트. `node build.js` 실행마다 재생성됨
```

`posts/`(원본)와 `dist/posts/`(산출물)를 분리해 소스와 빌드 결과가 섞이지 않게 한다. 새 글을 쓰려면 `posts/`에 front matter가 포함된 `.md` 파일을 추가하고 `node build.js`를 실행하면 된다.

### Front matter 형식

```
---
title: 글 제목
date: 2026-07-01
tags: [태그1, 태그2]
description: 목록/메타 설명 (선택)
---
```
`key: value`와 `[a, b]` 배열만 지원하는 미니 파서. 중첩 객체·멀티라인 값은 지원하지 않음.

## 디자인 가이드

- 노션 스타일: 넉넉한 여백, 세리프가 아닌 시스템 폰트 스택, 절제된 색상, 명확한 타이포그래피 위계
- 본문 최대 너비를 제한해 가독성 확보 (예: 680~760px)
- 다크모드는 `prefers-color-scheme`을 기본으로 따르되 수동 토글도 제공
- CSS 커스텀 프로퍼티(변수)로 라이트/다크 색상 토큰 관리
- 모바일에서 여백/폰트 크기 축소, 터치 타깃 확보

## 명령어

- `node build.js` (또는 `npm run build`) — `posts/*.md`를 읽어 `dist/`에 정적 사이트 생성
- `node serve.js` (또는 `npm run serve`) — `dist/`를 `http://localhost:3000`으로 서빙 (내장 http 모듈, 의존성 없음)

글을 추가/수정한 뒤에는 반드시 `node build.js`를 다시 실행해야 `dist/`에 반영된다.

## 참고

- `dist/`는 `.gitignore` 처리(빌드 산출물이라 `node build.js`로 언제든 재생성 가능). 배포 시에는 CI에서 빌드 후 `dist/`만 정적 호스트에 업로드하는 방식을 권장
- 다크모드: `prefers-color-scheme` 기본값 + 우측 상단 토글 버튼, 선택은 `localStorage`에 저장. `layout.html`의 head 인라인 스크립트가 body 페인트 전에 테마를 적용해 FOUC 방지
