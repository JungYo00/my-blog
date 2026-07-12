# 픽셀 아트 에디터 Review

## 요약
spec.md 8절 및 review-instructions.md의 13개 시나리오를 실제 브라우저(preview_* 도구)로 검증한 결과, 12개 시나리오가 PASS했고 1개 시나리오(11번, 헤더 링크 일관성)에서 Medium 심각도 버그 1건을 발견했다. 그리기/드래그/지우개/전체지우기/PNG 저장/모바일 터치/다크모드 등 에디터 핵심 기능은 모두 픽셀 데이터 레벨(getImageData)로 검증했으며 정상 동작한다. 콘솔 에러는 없었고, 기존 블로그/2048 페이지도 이번 변경으로 인한 회귀는 없었다.

## 시나리오별 결과
| # | 시나리오 | 결과 | 비고 |
|---|---|---|---|
| 1 | 페이지 로드 시 격자/팔레트(16색+커스텀)/지우개·전체지우기·저장 버튼 표시 | PASS | preview_snapshot으로 모든 요소 확인. 16개 색상 스와치 + 커스텀 색상 input 모두 존재 |
| 2 | 격자 클릭 시 선택 색으로 도트가 찍히는지 | PASS | 클릭 전 캔버스 전체 alpha=0 확인 → 클릭 후 해당 셀(24x24px, 576픽셀) 전체가 검정(0,0,0,255)으로 채워짐 |
| 3 | 드래그 시 지나가는 칸이 연속으로 칠해지는지 | PASS | mousedown 후 여러 셀에 걸쳐 mousemove, 각 셀 중심 픽셀이 모두 선택색으로 칠해짐 확인 |
| 4 | 팔레트에서 다른 색 선택 시 선택 표시 이동 및 새 색 적용 | PASS | 빨강 선택 시 해당 버튼에 `selected` 클래스(outline-offset:2px) 부여, 기존 선택(검정) 클래스 해제 확인. 이후 그리기에 빨강 반영 |
| 5 | 커스텀 색상(`input[type=color]`)으로 그리기 | PASS | `#123456`으로 설정 후 클릭한 셀의 픽셀이 정확히 (18,52,86,255)로 확인 |
| 6 | 지우개 모드에서 칠하면 투명하게 지워지는지 | PASS | 지우개 버튼 클릭 시 `active` 클래스 부여, 이전에 검정으로 칠해진 셀을 클릭하니 alpha 0으로 전환됨 |
| 7 | 전체 지우기 클릭 시 격자 초기화 | PASS | 클릭 후 384x384 전체 캔버스의 non-transparent 픽셀 수 = 0 확인 |
| 8 | 저장 버튼 → 유효 PNG data URL, 256x256, 그린 색 반영 | PASS | `HTMLAnchorElement.prototype.click` 후킹으로 `download="pixel-art.png"`, `data:image/png;base64,...` 확인. Image로 디코드해 naturalWidth/Height=256x256, 그린 좌표는 그린 색(255,0,0,255), 지운 좌표는 투명(0,0,0,0) 확인 |
| 9 | 모바일(375x812) 레이아웃 오버플로 없음 + 터치 드래그 동작 | PASS | `document.documentElement.scrollWidth`(375) == `window.innerWidth`(375)로 가로 스크롤 없음 확인. `TouchEvent`/`Touch` 생성자로 touchstart→touchmove(2회)→touchend 시뮬레이션, 3개 셀이 연속으로 초록색으로 칠해짐 확인. `#pixel-canvas`의 `touch-action: none` 적용 확인(스크롤 동반 방지) |
| 10 | 다크모드 전환 시 배경/버튼/텍스트 자연스럽게 전환, 그린 그림 색 유지 | PASS | `#theme-toggle` 클릭 후 `data-theme="dark"`, body 배경 rgb(255,255,255)→rgb(25,25,25), 텍스트 rgb(55,53,47)→rgb(212,212,212)로 전환. 전환 전후 캔버스의 기존 그린 픽셀(빨강, 초록)은 값 변화 없이 그대로 유지됨 확인 |
| 11 | 헤더에 "2048"·"Pixel Art" 링크가 모두 있고 각각 이동, "My Blog"로 복귀 가능 | **PARTIAL / FAIL 항목 있음** | `index.html`과 `pixel-art/index.html`에는 두 링크가 모두 있고 정상 이동(실제 `.click()` 이벤트로 검증, `location.href` 변화 확인)하며 "My Blog" 클릭으로 홈 복귀도 정상. 그러나 **`games/2048/index.html`(2048 게임 페이지) 헤더에는 "Pixel Art" 링크가 없음** — 아래 버그 참조 |
| 12 | 콘솔 에러 없음 (`level: error`) | PASS | 픽셀 아트 페이지 및 전체 테스트 세션 동안 `preview_console_logs` (error/all) 결과 모두 "No console logs." |
| 13 | 기존 블로그(목록/상세)·2048 페이지 회귀 없음 | PASS (참고사항 있음) | 홈 목록, 포스트 상세(`markdown-syntax-test.html`), 2048 게임 페이지 모두 200 OK로 정상 로드·렌더링. 2048 페이지에서 방향키 입력도 정상 동작. 단, 포스트 상세 페이지에서 `https://via.placeholder.com/600x200` 이미지 요청이 `net::ERR_CONNECTION_CLOSED`로 실패했는데, 이는 테스트 샌드박스의 외부 네트워크 접근 제한 때문으로 보이며 이번 픽셀 아트 기능 변경과는 무관한 기존 콘텐츠(마크다운 테스트 포스트)의 외부 이미지 링크 이슈임 |

**결과 집계: PASS 12건 / FAIL(불일치) 1건 → 수정 후 13건 전부 PASS** (시나리오 11에서 발견된 헤더 링크 누락은 Commit 전에 수정 완료)

## 발견된 버그 (있는 경우)

### [심각도: Medium] 2048 게임 페이지 헤더에 "Pixel Art" 내비 링크 누락
- 재현 방법: `http://localhost:3000/2048/index.html` 접속 후 `.site-header` 확인 (`preview_snapshot` 또는 `grep -n "nav-link" games/2048/index.html`)
- 기대 동작: spec.md 결정사항 1번("헤더 링크: 추가한다. `.site-header`에 '2048' 링크 옆에 'Pixel Art' 링크 추가")에 따라 사이트 내 모든 페이지의 헤더에 "My Blog" / "2048" / "Pixel Art" 링크가 일관되게 표시되어야 함. 실제로 `index.html`과 `pixel-art/index.html`에는 세 링크가 모두 있음
- 실제 동작: `games/2048/index.html`의 `.site-header`에는 `<a class="site-title" href="../index.html">My Blog</a>`와 `<a class="nav-link" href="../2048/index.html">2048</a>`만 있고 "Pixel Art" 링크가 없음. 따라서 2048 게임 페이지에서는 픽셀 아트 에디터로 바로 이동할 방법이 없고(홈을 거쳐야 함), 사이트 전체 내비게이션 일관성이 깨짐
- 관련 파일: `games/2048/index.html` (21~24번째 줄 근처 `.site-header` 마크업)
- **상태: 수정 완료.** `games/2048/index.html`의 `.site-header`에 `<a class="nav-link" href="../pixel-art/index.html">Pixel Art</a>`를 추가해 세 페이지(`index.html`, `games/2048/index.html`, `pixel-art/index.html`) 모두 "My Blog / 2048 / Pixel Art" 링크를 일관되게 표시하도록 고쳤다. `node build.js` 재빌드 후 `preview_*` 도구로 재검증: 2048 페이지 헤더에 "Pixel Art" 링크가 렌더링되고, 실제 클릭(`.click()`) 시 `location.href`가 `/pixel-art/index.html`로 정상 전환됨을 확인.

## 스크린샷/증거
- 데스크톱(뷰포트 437px 폭, `@media max-width:480px` 구간 적용): 격자 288x288(18px/cell 표시, 내부 backing store는 24px/cell 기준 384x384), 팔레트 16색 2줄 + 커스텀 색상, 버튼 3개(지우개/전체지우기/저장) 모두 정상 렌더링됨을 스크린샷으로 확인.
- 그리기 검증은 스크린샷이 아닌 `getImageData`를 통한 픽셀 값 비교로 수행(요청된 방법). 검정 클릭 → (0,0,0,255), 드래그 4셀 빨강 → (255,0,0,255) x4, 커스텀 색 `#123456` → (18,52,86,255), 지우개 후 → (0,0,0,0) 모두 확인.
- PNG 저장: `data:image/png;base64,...` 문자열 길이 3206자, `download="pixel-art.png"`. 디코드한 이미지의 `naturalWidth/Height`가 256x256(16배 업스케일)임을 확인, 그려진 색(빨강)과 지워진 좌표(투명)가 저장 결과에 정확히 반영됨.
- 모바일 375x812 스크린샷: 격자와 팔레트, 버튼이 세로로 자연스럽게 쌓이고 가로 스크롤 없음. 터치 이벤트로 3개 셀이 초록색으로 연속 칠해짐 확인.
- 다크모드 스크린샷: 배경이 짙은 회색(rgb(25,25,25))으로, 텍스트/버튼이 밝은 톤으로 전환되었고 저장 버튼도 다크 테마의 파란 톤으로 자연스럽게 변경됨. 이전에 그린 빨강/초록 도트는 색상 변화 없이 그대로 표시됨.
- 헤더 링크 비교: `index.html`, `pixel-art/index.html`에는 `My Blog / 2048 / Pixel Art` 3개 링크, `games/2048/index.html`에는 `My Blog / 2048` 2개 링크만 존재(스냅샷 및 grep 결과로 교차 확인).
