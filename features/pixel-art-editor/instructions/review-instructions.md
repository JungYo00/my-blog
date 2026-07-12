# Review 단계 지침 — 픽셀 아트 에디터 테스트

## 역할
너는 `/Users/jy/Desktop/my-blog/features/pixel-art-editor/spec.md`(특히 "8. 테스트 관점" 절)에 따라 방금 구현된 픽셀 아트 에디터를 **테스트**하고 결과를 `/Users/jy/Desktop/my-blog/features/pixel-art-editor/review.md`에 기록하는 서브에이전트다.

## 수정 가능 범위
- `/Users/jy/Desktop/my-blog/features/pixel-art-editor/review.md` 파일만 작성한다.
- 코드(`pixel-art/*`, `build.js`, `templates/layout.html`, `css/style.css` 등)는 **절대 수정하지 마라.** 버그를 발견해도 고치지 말고 review.md에 기록만 한다.

## 테스트 방법
- 먼저 `node build.js`를 실행해 최신 상태로 빌드한다.
- `preview_start`(name: "my-blog")로 정적 서버를 띄우고 `http://localhost:3000/pixel-art/index.html`로 접속해라.
- `preview_snapshot`, `preview_screenshot`, `preview_console_logs`, `preview_network`, `preview_inspect`, `preview_click`, `preview_eval`, `preview_resize`를 사용해 실제로 화면에서 확인해라. 코드만 읽고 "동작할 것"이라고 추측하지 마라.
- 클릭/드래그 그리기는 `preview_click`으로 캔버스 좌표를 여러 번 클릭하거나, `preview_eval`로 캔버스 엘리먼트에 `mousedown`/`mousemove`/`mouseup` `MouseEvent`를 좌표(`clientX`/`clientY`)와 함께 dispatch해서 시뮬레이션해라.
- 터치 드래그는 `preview_eval`로 `TouchEvent`(또는 환경상 TouchEvent 생성자가 없으면 동일 좌표의 `PointerEvent`/`MouseEvent`로 대체 가능 — 안 되면 왜 안 됐는지 review.md에 기록)를 dispatch해서 확인해라.
- PNG 저장은 실제 다운로드 파일을 파일시스템에서 열어 확인하기 어려우므로, `preview_network`로 다운로드 트리거 여부를 확인하거나 `preview_eval`로 저장 버튼 클릭 시 생성되는 `canvas.toDataURL('image/png')` 결과 문자열이 유효한 PNG 데이터 URL(`data:image/png;base64,...`)인지, 그리고 그 데이터를 디코드했을 때 실제로 그린 색이 포함되어 있는지(예: 캔버스 픽셀 데이터를 `getImageData`로 읽어 특정 좌표 색상 검증) 확인해라.

## 검증 시나리오 (spec.md 8절 기반, 모두 확인)
1. 페이지 로드 시 16x16 격자, 팔레트(16색 + 커스텀 색상 input), 지우개/전체지우기/저장 버튼이 모두 보이는지.
2. 격자 칸을 클릭하면 선택된 색으로 도트가 찍히는지 (클릭 전후 캔버스 픽셀 데이터 비교).
3. 마우스를 누른 채 드래그하면 지나가는 칸들이 연속으로 칠해지는지.
4. 팔레트에서 다른 색을 선택하면 선택 표시(테두리)가 이동하고, 이후 그리기에 새 색이 적용되는지.
5. 커스텀 색상(`<input type="color">`)으로 고른 색이 정상적으로 그려지는지.
6. 지우개 모드로 전환 후 칠하면 해당 칸이 투명하게 지워지는지 (지운 칸의 픽셀 데이터 alpha 값 확인).
7. "전체 지우기" 버튼 클릭 시 격자 전체가 초기화되는지.
8. "저장" 버튼 클릭 시 유효한 PNG data URL이 생성되고, 256x256 해상도인지, 그린 색이 반영돼 있는지.
9. 모바일 뷰포트(`preview_resize` mobile 375x812)에서 격자/팔레트/버튼이 화면을 벗어나지 않고 자연스럽게 배치되는지, 터치 드래그(또는 대체 이벤트)로 그리기가 동작하는지.
10. 다크모드(`#theme-toggle` 클릭)에서 페이지 배경/버튼/텍스트 색상이 자연스럽게 전환되는지, 그린 그림 자체 색상은 그대로 유지되는지.
11. 블로그 헤더에 "2048"과 "Pixel Art" 링크가 모두 있고 각각 정상 이동하는지, 픽셀 아트 페이지에서 "My Blog"로 돌아올 수 있는지.
12. `preview_console_logs`(level: error)로 콘솔 에러가 없는지.
13. 기존 블로그(포스트 목록/상세)와 2048 게임 페이지에 회귀가 없는지 간단히 재확인.

## review.md 작성 형식
`/Users/jy/Desktop/my-blog/features/pixel-art-editor/review.md`에 아래 형식으로 작성:

```markdown
# 픽셀 아트 에디터 Review

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
- 관련 파일: pixel-art/editor.js (또는 해당 파일)

## 스크린샷/증거
(관찰한 내용 서술)
```

## 완료 후 보고
review.md 작성 후, PASS/FAIL 시나리오 개수와 발견된 버그 목록을 요약해서 보고해라.
