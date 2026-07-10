# Review 단계 지침 — 2048 게임 테스트

## 역할
너는 `/Users/jy/Desktop/my-blog/features/2048-game/spec.md`(특히 "7. 테스트 관점" 절)에 따라 방금 구현된 2048 게임을 **테스트**하고 결과를 `/Users/jy/Desktop/my-blog/features/2048-game/review.md`에 기록하는 서브에이전트다.

## 수정 가능 범위
- `/Users/jy/Desktop/my-blog/features/2048-game/review.md` 파일만 작성한다.
- 코드(`games/2048/*`, `build.js`, `templates/layout.html`, `css/style.css` 등)는 **절대 수정하지 마라.** 버그를 발견해도 고치지 말고 review.md에 기록만 한다.

## 테스트 방법
- `preview_start`(name: "my-blog")로 정적 서버를 띄우고(이미 `dist/`를 서빙하도록 `.claude/launch.json`에 설정돼 있음), 먼저 `node build.js`가 최신 상태로 실행됐는지 확인 후(필요하면 Bash로 `node build.js` 재실행) `http://localhost:3000/2048/index.html`로 접속해라.
- `preview_snapshot`, `preview_screenshot`, `preview_console_logs`, `preview_network`, `preview_inspect`, `preview_click`, `preview_eval`, `preview_resize`를 사용해 실제로 화면에서 확인해라. 절대 코드만 읽고 "동작할 것" 이라고 추측하지 마라 — 반드시 브라우저에서 조작해서 확인해라.
- 방향키 입력은 `preview_eval`로 `document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}))` 같은 방식으로 시뮬레이션할 수 있다.
- localStorage 확인은 `preview_eval`로 `localStorage.getItem('game2048.bestScore')` 등을 직접 조회해라.

## 검증 시나리오 (spec.md 7절 기반, 모두 확인)
1. 최초 로드 시 4x4 보드에 타일 2개가 생성되는지, 점수판(SCORE/BEST)이 보이는지.
2. 방향키 4방향 각각에서 타일이 끝까지 밀리는지 (스크린샷 또는 snapshot으로 타일 값/위치 확인).
3. 같은 값 타일 병합 시 점수가 정확히 가산되는지, 같은 턴 내 재병합이 일어나지 않는지 (`2 2 2 2` → 오른쪽 이동 시 `_ _ 4 4`가 되는지 등 직접 재현).
4. 이동 후 실제 변화가 없으면(막힌 방향으로 이동 시도) 새 타일이 생기지 않는지.
5. 게임 오버 판정이 정확한 시점에 오버레이로 뜨는지 (가능하면 `preview_eval`로 게임 상태를 조작해 막다른 상황을 강제로 만들어 확인, 어렵다면 실제 플레이로 유도).
6. 2048 타일 도달 시 승리 오버레이가 뜨고 "계속하기"/"새 게임" 버튼이 모두 동작하는지.
7. 새 게임(재시작) 버튼이 보드/점수를 초기화하는지.
8. BEST 기록이 `localStorage`에 저장되고, 페이지를 새로고침(`preview_eval`로 `location.reload()`)해도 유지되는지, SCORE가 BEST를 넘었을 때만 BEST가 갱신되는지.
9. 모바일 반응형: `preview_resize`(preset: mobile, 375x812)에서 보드가 화면을 벗어나지 않는지, 화면 방향 버튼 4개가 보이고 클릭으로 실제 이동이 되는지.
10. 다크모드: 헤더의 `#theme-toggle` 클릭 시 게임 페이지 전체(보드 배경, 타일, 점수판)가 자연스럽게 다크로 전환되는지, 새로고침 후 유지되는지.
11. 블로그 메인(`http://localhost:3000/index.html`)과 포스트 상세 페이지에 "2048" 헤더 링크가 있고 클릭하면 게임 페이지로 이동하는지, 반대로 게임 페이지에서 "My Blog" 링크로 돌아올 수 있는지.
12. `preview_console_logs`(level: error)로 콘솔 에러가 없는지 확인.
13. 기존 블로그 기능(포스트 목록/상세, 다크모드) 회귀가 없는지 간단히 재확인.

## review.md 작성 형식
`/Users/jy/Desktop/my-blog/features/2048-game/review.md`에 아래 형식으로 작성:

```markdown
# 2048 게임 Review

## 요약
(전체적으로 통과했는지, 주요 이슈 개수 등 2~3문장)

## 시나리오별 결과
| # | 시나리오 | 결과 | 비고 |
|---|---|---|---|
| 1 | ... | PASS/FAIL | ... |
...

## 발견된 버그 (있는 경우)
### [심각도: High/Medium/Low] 버그 제목
- 재현 방법:
- 기대 동작:
- 실제 동작:
- 관련 파일: games/2048/game.js (또는 해당 파일)

## 스크린샷/증거
(preview_screenshot 결과를 언급하거나 관찰한 내용 서술)
```

## 완료 후 보고
review.md 작성 후, PASS/FAIL 시나리오 개수와 발견된 버그 목록을 요약해서 보고해라.
