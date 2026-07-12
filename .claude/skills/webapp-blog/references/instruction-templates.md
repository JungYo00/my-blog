# 서브에이전트 지침 파일 템플릿

CLAUDE.md의 "서브에이전트 규칙"에 따라, 각 단계의 서브에이전트에게는 반드시 전용 지침 파일(.md)을 만들어 전달한다. 아래는 2048 게임과 픽셀 아트 에디터를 만들 때 실제로 쓰였던 지침 파일을 일반화한 템플릿이다. `<...>` 부분을 기능에 맞게 채워 `features/<feature-slug>/instructions/`에 저장한다.

## 공통 주의사항

- 지침 파일마다 **"수정 가능 범위"** 절을 명시하고, 그 외 파일은 "절대 수정하지 마라"라고 못 박는다. 서브에이전트는 지침에 없는 파일을 건드릴 이유가 없어야 한다.
- Plan 단계는 `Plan` 에이전트 타입에 Write/Edit 도구가 없다 — spec.md를 파일로 직접 쓰게 하려면 `general-purpose` 서브에이전트 타입을 써야 한다. `Plan` 타입을 쓰면 텍스트로만 결과가 오므로 오케스트레이터(메인 대화)가 대신 Write로 저장해야 한다.
- Work 지침에는 항상 **"기존 프로젝트 관례"** 절을 넣어 외부 라이브러리 금지, CSS 변수 재사용, 기존 웹앱(`games/2048/index.html` 등) 구조를 참고하라고 명시한다 — 이게 없으면 서브에이전트가 색을 하드코딩하거나 CDN을 끌어오는 식으로 관례를 깨는 경우가 있다.
- Review 지침에는 항상 **"코드는 절대 수정하지 마라, 버그는 기록만 하라"**를 명시한다. 실제 프로젝트에서 발견된 버그는 오케스트레이터가 review.md를 보고 직접 고쳤다.

---

## Plan 지침 템플릿

```markdown
# Plan 단계 지침 — <기능명>

## 역할
너는 사용자가 요청한 "<기능 한 줄 요약>" 기능을 설계하고,
`/Users/jy/Desktop/my-blog/features/<feature-slug>/spec.md`를 작성하는 서브에이전트다.

## 수정 가능 범위
- `/Users/jy/Desktop/my-blog/features/<feature-slug>/spec.md` 파일만 작성한다.
- 코드는 전혀 건드리지 않는다.

## spec.md에 반드시 포함할 절
1. 개요
2. 핵심 규칙/동작 (기능 고유의 로직 명세)
3. UI/화면 구성
4. 화면 개수 판단 (3개 이상이면 Work를 어떻게 나눌지 제안)
5. 파일 구조 (어떤 파일을 새로 만들고, build.js/templates/layout.html의 몇 번째 줄 근처를 수정할지)
6. 접근성/키보드/모바일 입력
7. 테스트 관점 (Review 단계에서 검증할 시나리오 목록의 초안)
8. 결정 사항 — 애매한 요구사항 중 사용자 확인이 필요한 항목을 여기 나열하고,
   각 항목에 대해 네 나름의 기본안을 제시하되 "확정 필요"라고 표시해라.
   (예: 헤더에 링크를 추가할지, 저장 파일명을 고정할지, 모바일 입력 방식 등)

## 완료 후 보고
spec.md 작성 후, "결정 사항" 절에 나열한 항목들을 사용자에게 확인받아야 한다고 보고해라.
```

Plan 승인 후 오케스트레이터는 `AskUserQuestion`으로 spec.md의 "결정 사항" 항목들을 사용자에게 확인받고, 확정된 답을 spec.md의 "결정 사항" 절에 반영한 뒤에 Work를 시작한다.

---

## Work 지침 템플릿

```markdown
# Work 단계 지침 — <기능명> 구현

## 역할
너는 `/Users/jy/Desktop/my-blog/features/<feature-slug>/spec.md`에 정의되고
사용자가 승인한 기능을 **구현**하는 서브에이전트다.
먼저 spec.md 전체를 읽어라. 특히 "결정 사항" 절의 확정된 요구사항을 그대로 반영한다.

## 수정 가능 범위 (이 목록에 없는 파일은 절대 건드리지 마라)
- `<app-slug>/index.html` (신규)
- `<app-slug>/style.css` (신규)
- `<app-slug>/<script>.js` (신규)
- `build.js` (기존 파일 수정 — 아래 "build.js 수정 지침" 참고)
- `templates/layout.html` (기존 파일 수정 — nav-link 한 줄 추가)
- (다른 기존 독립 웹앱이 있다면) `games/2048/index.html`, `pixel-art/index.html` 등의
  하드코딩된 `.site-header`에도 새 nav-link를 추가한다 — 이걸 빠뜨리면
  사이트 전체 네비게이션 일관성이 깨지는 회귀가 생긴다(실제로 발생했던 버그).

## 기존 프로젝트 관례 (반드시 따를 것)
- 외부 라이브러리/프레임워크/CDN 없음. 순수 HTML/CSS/JS만 사용.
- `css/style.css`의 CSS 커스텀 프로퍼티를 재사용해서 다크모드 자동 대응. 색상 하드코딩 금지.
- 화면에 사용법 안내 문구를 반드시 넣는다 (웹앱 규칙).
- `games/2048/index.html` 또는 `pixel-art/index.html`을 참고 예시로 읽고,
  독립 정적 페이지의 FOUC 방지 스크립트 + `.site-header` 구조를 그대로 복제한다.

## 구현 요구사항
(spec.md 각 절 요약 — 상세는 spec.md 원문 참고)
<spec.md 2~8절 핵심 요구사항을 여기 요약해서 붙여넣는다>

## build.js 수정 지침
`references/folder-structure.md`의 "4. build.js에 복사 블록 추가" 절 그대로 따른다.

## 완료 후 보고
- 새로 만든 파일 목록과 build.js/templates/layout.html에 실제로 추가한 줄을 diff로 보고해라.
- `node build.js`를 직접 실행해서 `dist/<app-slug>/`가 정상 생성되는지,
  기존 다른 웹앱/포스트 빌드도 여전히 정상인지 확인하고 결과를 보고해라.
- 이 단계에서는 브라우저 테스트를 하지 않는다 (다음 Review 단계에서 진행).
```

**화면이 3개 이상인 경우**: 위 템플릿을 화면별로 복제해 `work-instructions-screen1.md`, `work-instructions-screen2.md` 식으로 나누고, "수정 가능 범위"가 서로 겹치지 않게 파일을 분배한다. 공유 파일(`build.js`, `templates/layout.html`)은 한 서브에이전트에게만 맡기거나, 오케스트레이터가 마지막에 직접 병합한다.

---

## Review 지침 템플릿

```markdown
# Review 단계 지침 — <기능명> 테스트

## 역할
너는 `/Users/jy/Desktop/my-blog/features/<feature-slug>/spec.md`
(특히 "테스트 관점" 절)에 따라 방금 구현된 기능을 **테스트**하고
결과를 `/Users/jy/Desktop/my-blog/features/<feature-slug>/review.md`에 기록하는 서브에이전트다.

## 수정 가능 범위
- `/Users/jy/Desktop/my-blog/features/<feature-slug>/review.md` 파일만 작성한다.
- 코드는 **절대 수정하지 마라.** 버그를 발견해도 고치지 말고 review.md에 기록만 한다.

## 테스트 방법
- 먼저 `node build.js`를 실행해 최신 상태로 빌드한다.
- `preview_start`(name: "my-blog")로 정적 서버를 띄우고 실제 브라우저 도구
  (`preview_snapshot`, `preview_screenshot`, `preview_console_logs`, `preview_network`,
  `preview_inspect`, `preview_click`, `preview_eval`, `preview_resize`)로 확인해라.
  코드만 읽고 "동작할 것"이라고 추측하지 마라.
- 시각/그리기/점수 등 픽셀·데이터 단위 검증이 필요하면 `preview_eval`로
  DOM 상태나 `getImageData` 등을 직접 읽어 비교해라.

## 검증 시나리오 (spec.md "테스트 관점" 절 기반, 모두 확인)
<spec.md 7절의 시나리오 목록을 번호와 함께 그대로 옮겨 적는다>
(공통으로 항상 포함할 것)
- 헤더에 모든 웹앱 링크가 있고 서로 정상 이동하는지, "My Blog"로 복귀 가능한지
  (다른 독립 웹앱 페이지의 하드코딩된 헤더도 빠짐없이 확인)
- 모바일 뷰포트(375x812)에서 레이아웃 오버플로 없는지, 터치 입력이 동작하는지
- 다크모드 전환 시 색상이 CSS 변수 기반으로 자연스럽게 바뀌는지
- 사용법 안내 문구가 화면에 실제로 보이는지 (웹앱 규칙 준수 확인)
- 콘솔 에러 없는지 (`preview_console_logs`, level: error)
- 기존 블로그/다른 웹앱 페이지에 회귀가 없는지

## review.md 작성 형식
(claude-md-rules.md의 review.md 예시 형식과 동일 — 요약/시나리오별 표/발견된 버그/스크린샷·증거 4개 절)

## 완료 후 보고
review.md 작성 후, PASS/FAIL 시나리오 개수와 발견된 버그 목록을 요약해서 보고해라.
```
