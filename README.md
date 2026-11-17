# New Ara Web v2

Next.js App Router 기반 웹 및 모바일 WebView 프런트엔드입니다.

## 개발 환경

Node.js **24.22.3**, npm **12.2.2**를 사용합니다. 로컬, CI, Docker에서 동일한 버전을 사용하며 의존성은 루트 `package-lock.json` 하나로 관리합니다.

```bash
nvm install
nvm use
npm install --global npm@12.2.2 --no-audit --no-fund
npm ci --no-audit --no-fund
npm run dev
```

`NEXT_PUBLIC_APP_ENV`는 개발 API에 연결할 때 `development`, 운영 API에 연결할 때 `production`으로 설정합니다. `NEXT_PUBLIC_API_HOST`를 설정하면 API 호스트를 별도로 지정할 수 있습니다. 이 환경 변수는 빌드 시 클라이언트 코드에도 반영됩니다.

개발 및 운영 빌드는 모두 Turbopack을 사용하며 SVG 컴포넌트는 `next.config.base.js`의 SVGR 규칙으로 처리합니다.

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run typecheck:package
npm run test:package
npm run build:package
npm run build
```

`npm test`는 기존 게시글의 에디터 데이터 보존 및 번역 회귀 테스트를 실행합니다. `packages/keyboard-inset`은 npm workspace이며 키보드·스크롤 테스트와 ESM/CJS 및 타입 선언 빌드를 별도로 검증합니다.

## 의존성 업데이트

- npm으로 패키지를 추가하거나 변경하고, `package.json`과 `package-lock.json`을 함께 반영합니다. 하위 패키지만 따로 설치하거나 다른 패키지 관리자의 잠금 파일을 생성하지 않습니다.
- `@tiptap/*`는 동일한 버전을 사용합니다. 업데이트 후 기존 게시글·댓글·첨부 이미지·북마크·코드 블록의 저장 및 재조회 동작을 확인합니다.
- TypeScript는 lint 도구가 지원하는 6.0.x를 사용합니다. ESLint 10은 `eslint-config-next@16.4.6`의 호환 코드를 통해 사용합니다. 실제 검증한 React/import/a11y 플러그인 세 버전의 peer 범위는 루트 `packageExtensions`로 보정했습니다. 해당 플러그인을 Next.js 설정 밖에서 직접 등록할 때는 별도 검증이 필요하며, upstream이 ESLint 10 지원을 선언하면 이 보정을 제거합니다.
- `packageExtensions`를 반영하는 잠금 파일 v4를 사용하므로, 의존성 설치에는 프로젝트가 지정한 npm 12.2.2를 사용합니다.
- Tailwind CSS는 기존 모바일 WebView 지원 범위를 유지하기 위해 3.4.x를 사용합니다. 4.x 이전은 최소 브라우저 버전과 화면 비교 검증을 포함하는 별도 작업입니다.
- npm 12의 설치 스크립트 정책은 `package.json`의 `allowScripts`에 기록합니다. 현재 esbuild의 고정 버전만 허용하며, 의존성 변경으로 새로운 스크립트가 생기면 내용을 확인한 뒤 정책을 갱신합니다.
- 새로운 React Compiler lint 진단은 경고로 표시합니다. 기존 hooks 규칙은 유지하며, React Compiler 자체는 활성화하지 않았습니다.

배포 전에는 인증·업로드·채팅과 iOS/Android 실제 기기의 키보드 및 뒤로 가기 동작도 확인해야 합니다.
