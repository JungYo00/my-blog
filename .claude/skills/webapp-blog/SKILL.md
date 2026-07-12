---
name: webapp-blog
description: my-blog 저장소(정적 마크다운 블로그 + 2048/픽셀아트 같은 독립 웹앱들)에 새 기능이나 새 웹앱을 추가할 때 반드시 사용하는 스킬. 사용자가 "~~ 게임/앱/에디터/도구 만들어줘", "블로그에 ~~ 추가해줘" 처럼 이 프로젝트에 새 기능을 요청하면, 코드를 바로 짜기 시작하지 말고 이 스킬을 먼저 로드해서 Plan(spec.md 작성 및 승인)→Work(서브에이전트 구현)→Review(서브에이전트 테스트)→Commit(기능별 커밋+푸시) 4단계 사이클과 색상 팔레트/사용법 안내 규칙을 그대로 따를 것. CLAUDE.md 규칙을 확인하거나 갱신할 때, 또는 이 저장소의 폴더 구조·서브에이전트 지침 파일 관례를 알아야 할 때도 이 스킬을 참고한다.
---

# webapp-blog: Plan-Work-Review-Commit 하네스

이 스킬은 `my-blog` 저장소에서 실제로 두 번(2048 게임, 픽셀 아트 에디터) 검증된 작업 방식을 그대로 담고 있다. 새 기능을 즉흥적으로 구현하면 사용자가 승인할 시점을 놓치거나, 다크모드/헤더 링크 같은 사이트 전역 일관성이 깨지기 쉽다 — 이 사이클은 그런 실수를 구조적으로 막기 위한 것이다.

## 0. 시작 전 확인

- 프로젝트 루트의 `/CLAUDE.md`를 직접 읽어서 아래 절차와 실제로 일치하는지 확인한다. 사용자가 이후에 규칙을 바꿨을 수 있으므로 이 스킬 문서보다 `CLAUDE.md` 원본이 항상 우선한다.
- `CLAUDE.md`가 없는 새 프로젝트에 이 하네스를 이식하는 상황이라면, `references/claude-md-rules.md`의 내용을 그대로 제안하고 사용자 승인을 받은 뒤 `CLAUDE.md`로 저장한다.
- **승인 없이 구현을 시작하지 않는다.** 사용자가 기능을 요청해도 바로 코드를 쓰지 말고 반드시 Plan 단계부터 시작한다.

## 1. Plan

1. `features/<feature-slug>/instructions/plan-instructions.md`를 `references/instruction-templates.md`의 "Plan 지침 템플릿"을 채워 작성한다. `<feature-slug>`는 kebab-case로 정한다(예: `2048-game`, `pixel-art-editor`).
2. `general-purpose` 서브에이전트 타입으로 Plan 서브에이전트를 실행한다.
   - **`Plan` 에이전트 타입은 쓰지 않는다** — Write/Edit 도구가 없어서 spec.md를 직접 저장하지 못하고 텍스트로만 돌려준다. 실제로 이 문제 때문에 `general-purpose`로 전환했다.
3. spec.md가 나오면 "결정 사항" 절(애매해서 사용자 확인이 필요한 항목들)을 `AskUserQuestion`으로 사용자에게 확인받는다. 각 질문에는 서브에이전트가 제안한 기본안을 추천 옵션으로 넣는다.
4. 확정된 답을 spec.md에 반영하고, 사용자에게 "이 계획대로 진행할지" 최종 승인을 받는다. 승인 전에는 Work로 넘어가지 않는다.

## 2. Work

1. spec.md의 "화면 개수 판단" 절을 보고 화면이 3개 이상이면 여러 서브에이전트로 나눈다. 각 서브에이전트의 "수정 가능 범위"가 절대 겹치지 않도록 파일을 미리 분배한다.
2. `features/<feature-slug>/instructions/work-instructions.md`(화면이 여러 개면 `-screen1`, `-screen2`...)를 `references/instruction-templates.md`의 "Work 지침 템플릿"으로 작성한다. 다음을 반드시 포함:
   - 새로 만들 파일과 수정할 기존 파일(`build.js`, `templates/layout.html`)의 정확한 목록
   - **기존에 이미 만들어진 다른 독립 웹앱들의 하드코딩된 헤더**(`games/2048/index.html` 등)에도 새 nav-link를 추가하라는 지시 — 빠뜨리면 실제로 회귀 버그가 난다 (상세: `references/folder-structure.md`)
   - "기존 프로젝트 관례" 절: 외부 라이브러리 금지, `css/style.css`의 CSS 변수로만 색을 입힐 것, 사용법 안내 문구 필수
3. 새 독립 웹앱을 추가하는 구체적 파일/코드 패턴(FOUC 스크립트, `.site-header` 복제, `build.js` 복사 블록)은 `references/folder-structure.md`를 그대로 따르게 한다.
4. Work 서브에이전트는 브라우저 테스트를 하지 않는다 — `node build.js`가 에러 없이 도는지까지만 확인하고 보고하게 한다.

## 3. Review

1. `features/<feature-slug>/instructions/review-instructions.md`를 `references/instruction-templates.md`의 "Review 지침 템플릿"으로 작성한다. spec.md의 "테스트 관점" 절 시나리오를 번호 그대로 옮기고, 공통 체크리스트(헤더 링크 일관성, 모바일, 다크모드, 사용법 문구, 콘솔 에러, 기존 페이지 회귀)를 반드시 추가한다.
2. 서브에이전트가 `preview_*` 도구로 실제 브라우저에서 검증하게 한다 — 코드만 읽고 "동작할 것"이라고 추측하는 건 금지.
3. **Review 서브에이전트는 버그를 발견해도 절대 고치지 않는다.** review.md에 재현 방법/기대 동작/실제 동작/관련 파일로 기록만 한다.
4. review.md를 받으면 오케스트레이터(메인 대화)가 직접 버그를 검토한다. 사소하고 명확한 버그(예: 헤더 링크 한 줄 누락)는 새 서브에이전트를 또 띄우지 않고 직접 고친 뒤 `node build.js` 재빌드 + 재검증하고, review.md에 "상태: 수정 완료" 메모를 추가한다. 버그가 크거나 애매하면 사용자에게 알린다.

## 4. Commit

1. 기능 하나가 끝날 때마다(다른 기능과 묶지 않고) git 커밋한다. 커밋 메시지는 `feat: <기능 한글 설명>` 형식.
2. `features/<feature-slug>/`(spec.md, review.md, instructions/) 전체를 포함해 커밋한다 — 과정 기록이 코드와 함께 저장소에 남아야 다음에 참고할 수 있다.
3. `git push`까지 한다.
4. GitHub Actions 배포가 있는 저장소라면(`.github/workflows/deploy.yml`), 푸시 후 `gh run watch`로 배포가 성공했는지 확인하고 실제 배포 URL을 curl 등으로 한 번 확인한 뒤 사용자에게 보고한다.

## 웹앱 공통 규칙 (모든 단계에서 항상 적용)

- 색상은 `css/style.css`의 CSS 커스텀 프로퍼티만 사용한다. 하드코딩 금지 — 다크모드 전환 시 그 부분만 안 바뀌는 회귀로 이어진다.
- 모든 웹앱 화면에는 사용법을 설명하는 문구를 반드시 넣는다(버튼 라벨만으로는 부족, 조작 방법을 문장으로).

## 레퍼런스

- `references/claude-md-rules.md` — CLAUDE.md 규칙 원문과 각 규칙이 왜 그렇게 정해졌는지의 배경
- `references/folder-structure.md` — 전체 디렉토리 구조와 새 독립 웹앱을 추가하는 구체적 파일/코드 패턴
- `references/instruction-templates.md` — Plan/Work/Review 서브에이전트 지침 파일 템플릿 (실제 2048/픽셀아트 사례 기반)
