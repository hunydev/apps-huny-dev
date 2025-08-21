# apps.huny.dev

개인 도메인 하위 웹앱들을 카드 형태로 모아 보여주는 사이트입니다. Vite + React + TypeScript + Tailwind로 구성되어 있으며 Netlify 정적 호스팅에 최적화되어 있습니다.

## 사용 방법

- 개발 서버 실행
  - 의존성 설치: `npm install`
  - 개발 실행: `npm run dev`
- 빌드: `npm run build` → 산출물은 `dist/`
- 미리보기: `npm run preview`

## 데이터 관리

- 루트에 `apps.json`을 편집하세요. 빌드시 `vite-plugin-static-copy`로 `dist/apps.json`으로 복사되어 `/apps.json` 경로에서 제공됩니다.
- 브라우저는 `/apps.json`을 `no-store`로 요청하며, Netlify 헤더(`netlify.toml`)도 캐시 방지로 설정되어 즉시 반영됩니다.

### apps.json 포맷

```json
{
  "apps": [
    { "title": "Studio", "url": "https://studio.huny.dev", "description": "…", "category": "포털", "thumbnail": "/thumbs/studio.png" }
  ]
}
```

- `apps` 배열 또는 배열 그 자체를 지원합니다. (즉 `{ apps: [...] }` 또는 `[...]` 모두 OK)

## 배포(Netlify)

1. GitHub 저장소로 푸시합니다.
2. Netlify에서 "New site from Git" → GitHub 저장소 선택
3. Build command: `npm run build` / Publish directory: `dist`
4. 커스텀 도메인(예: `apps.huny.dev`) 연결

이후 `apps.json` 또는 코드 변경을 커밋/푸시하면 Netlify가 자동으로 새 빌드/배포합니다.

## 정렬/그룹/검색 기능

- 정렬: 이름(서브도메인)순, 카테고리→이름
- 그룹: 카테고리별 그룹핑(없으면 "그룹없음") 또는 전체 보기
- 검색: 제목/설명/주소/호스트/서브도메인 전체 텍스트 검색
- 상태는 localStorage에 보존됩니다.
