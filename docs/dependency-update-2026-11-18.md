# 의존성 업데이트 보고 — 2026-11-18

현재 작업 브랜치는 `chore/update-dependencies`이며 로컬 `dev`의 `f0949d6`에서 생성했습니다. `fix/post-html-entities`의 추가 두 커밋은 포함하지 않습니다. 검증 과정에서 실제 서버 데이터 변경이나 배포는 수행하지 않았습니다.

## 주요 변경

- Node.js 24.22.3 / npm 12.2.2로 로컬 설정·CI·Docker 기준 통일
- 루트 npm workspace와 단일 package-lock.json으로 설치 통합, 중복 pnpm-lock.yaml 제거
- 사용처가 없는 패키지 제거 및 Tiptap 직접 의존성 누락 해소
- Next.js 16 / React 19.3 / Tiptap 3 / TypeScript 6 및 일반 패키지 업데이트
- Next lint를 ESLint CLI로 전환, Turbopack의 SVGR 설정 통합, images.remotePatterns 이전
- 함수 없이 matcher만 있던 middleware를 Next.js 16의 명시적인 pass-through proxy로 이전
- 게시글·댓글·모바일 에디터 확장 구성을 공유하고 StarterKit 중복 확장 및 추가 문단 삽입 방지
- Tiptap 3 setContent 옵션, SSR 초기화, 툴바 상태 갱신, NodeViewContent 타입 변경 대응
- HTML 입력 시 첨부 식별자가 숫자로 자동 변환되지 않도록 문자열 파싱 명시
- GitHub Actions 업데이트, push 이벤트에서 선행 검사 skip 때문에 빌드까지 skip되던 조건 수정
- 하위 키보드 패키지 테스트·타입 검사·배포 형식 빌드와 앱 회귀 테스트를 CI에 추가
- Docker에서 npm ci 사용, 빌드 산출물의 컨텍스트 유입 방지, workspace 빌드 및 런타임 복사

## 적용 버전

이전 버전은 작업 시작 당시 실제 잠금 파일 기준입니다. 새로 직접 선언한 Tiptap 패키지의 이전 값은 당시 전이 의존성 버전입니다.

| 패키지 | 이전 | 적용 | 비고 |
|---|---|---|---|
| `@sparcs-kaist/keyboard-inset` | — | workspace 0.2.0 | 직접 의존성 선언 추가 |
| `@svgr/webpack` | 8.1.0 | 8.1.0 | 개발 의존성으로 이동 |
| `@tailwindcss/typography` | 0.5.16 | 0.5.20 | 업데이트 |
| `@tanstack/react-query` | 5.90.21 | 5.108.0 | 업데이트 |
| `@tiptap/core` | 2.24.2 | 3.34.0 | 직접 의존성 선언 추가 |
| `@tiptap/extension-bold` | 2.24.2 | 3.34.0 | 직접 의존성 선언 추가 |
| `@tiptap/extension-code-block-lowlight` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/extension-color` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/extension-italic` | 2.24.2 | 3.34.0 | 직접 의존성 선언 추가 |
| `@tiptap/extension-link` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/extension-placeholder` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/extension-text-style` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/extension-underline` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/pm` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/react` | 2.24.2 | 3.34.0 | 업데이트 |
| `@tiptap/starter-kit` | 2.24.2 | 3.34.0 | 업데이트 |
| `@types/lodash` | 4.17.20 | 4.17.27 | 업데이트 |
| `@types/node` | 20.19.4 | 24.19.2 | 업데이트 |
| `@types/react` | 19.1.8 | 19.3.0 | 업데이트 |
| `@types/react-dom` | 19.1.6 | 19.3.0 | 업데이트 |
| `axios` | 1.13.5 | 1.21.1 | 업데이트 |
| `clsx` | 2.1.1 | 2.1.1 | 유지 |
| `date-fns` | 4.1.0 | 4.4.0 | 업데이트 |
| `eslint` | 9.30.1 | 10.15.0 | 업데이트 |
| `eslint-config-next` | 15.1.7 | 16.4.6 | 업데이트 |
| `highlight.js` | 11.11.1 | 11.12.0 | 업데이트 |
| `i18next` | 24.2.3 | 27.1.5 | 업데이트 |
| `jsdom` | — | 31.0.1 | 직접 의존성 선언 추가 |
| `lodash` | 4.17.23 | 4.18.1 | 업데이트 |
| `lowlight` | 3.3.0 | 3.3.0 | 유지 |
| `lucide-react` | 0.522.0 | 1.74.0 | 업데이트 |
| `next` | 15.5.12 | 16.4.6 | 업데이트 |
| `postcss` | 8.5.6 | 8.5.33 | 업데이트 |
| `react` | 19.1.0 | 19.3.1 | 업데이트 |
| `react-dom` | 19.1.0 | 19.3.1 | 업데이트 |
| `react-easy-crop` | 5.5.0 | 6.2.5 | 업데이트 |
| `react-i18next` | 15.6.0 | 18.0.2 | 업데이트 |
| `react-textarea-autosize` | 8.5.9 | 8.5.9 | 유지 |
| `tailwindcss` | 3.4.17 | 3.4.19 | 업데이트 |
| `typescript` | 5.8.3 | 6.0.3 | 업데이트 |
| `vitest` | — | 5.1.0 | 직접 의존성 선언 추가 |

keyboard-inset의 개발 의존성은 Vitest 5.1.0, jsdom 31.0.1, tsup 9.0.0, TypeScript 6.0.3, React 타입 19.3.0으로 갱신했습니다. 공개 라이브러리의 React peer 범위와 패키지 버전은 유지했습니다.

제거: `@material-tailwind/react`, `@tiptap/html`, `antd`, `install`, `next-i18next`, `next-translate`, `tiptap-extension-resize-image`, `@eslint/eslintrc`. 코드·설정 검색에서 사용처가 없었으며 제거 후 빌드와 회귀 검증을 통과했습니다.

## 보류한 메이저 버전

- **TypeScript 7:** typescript-eslint가 현재 지원하는 범위는 >=4.8.4 <6.1.0입니다. 6.0.x를 유지합니다. [지원 범위](https://typescript-eslint.io/users/dependency-versions/)
- **Tailwind 4:** Safari 16.4+, Chrome 111+, Firefox 128+ 요구사항으로 기존 모바일 WebView 지원을 바꿀 수 있어 3.4.19를 유지합니다. [이전 가이드](https://tailwindcss.com/docs/upgrade-guide)

React Compiler 관련 새 진단 63건은 기존 앱 구조의 별도 개선 대상으로 경고를 유지합니다. Compiler를 활성화하지 않았으며 기존 hooks 규칙을 끄지 않았습니다. 전체 lint 결과는 오류 0건, 경고 85건입니다.

ESLint는 추가 검증 후 10.15.0으로 전환했습니다. `eslint-config-next@16.4.6`에는 구형 플러그인 API를 연결하는 호환 코드가 있습니다. 실행을 확인한 `eslint-plugin-react@7.37.5`, `eslint-plugin-import@2.32.0`, `eslint-plugin-jsx-a11y@6.10.2`에만 npm 12의 `packageExtensions`로 ESLint 10 peer 범위를 추가했습니다. 이는 설치 메타데이터 보정이며, 실행 호환성은 Next.js 설정이 제공합니다. Next.js 호환 코드 없이 플러그인을 직접 사용하는 설정은 별도 검증해야 합니다. upstream에서 지원 범위를 갱신하면 보정을 제거합니다. 프로젝트 전체에 `--force` 또는 `--legacy-peer-deps`를 설정하지 않았습니다.

`packageExtensions` 반영을 위해 npm이 잠금 파일을 v4로 이전했습니다. 로컬·CI·Docker 모두 지정한 npm 12.2.2로 설치해야 합니다.

## 검증 결과

- 변경 전 Next.js 15 프로덕션 빌드 통과
- Node 24 / npm 12의 깨끗한 npm ci 설치 및 의존성 트리 검사 통과
- ESLint 10 전환 후 npm ci --strict-peer-deps 및 npm ls --all 통과; peer 경고와 invalid 의존성 없음
- ESLint 10의 355개 파일 진단 결과가 ESLint 9와 메시지 단위까지 동일함을 확인(오류 0개, 경고 85개)
- 앱 lint, 타입 검사, 프로덕션 빌드 통과
- 개발 서버 실행 및 /login, /write 페이지 컴파일·응답 확인
- 게시글 JSON 저장·재조회, 사용자 정의 노드의 HTML 변환, 변경 이벤트 억제, 서식·undo/redo, 번역 회귀 테스트 5개 통과
- 키보드 패키지 기존 테스트 70개 및 타입 검사 통과
- 키보드 패키지 ESM/CJS 및 .d.ts/.d.cts 빌드 통과
- Chrome에서 로그인, 데스크톱 글쓰기, 모바일 크기 WebView 글쓰기, 내 정보 화면 확인
- 브라우저에서 에디터 입력·서식·실행 취소 및 이미지 자르기·multipart 업로드 요청 확인
- 401 응답 시 데스크톱 /login 및 WebView /web_view/Login 이동 확인
- 위 브라우저 검증은 API 가짜 응답을 사용했으며 실제 서버 데이터는 변경하지 않음
- 개발·운영 Docker 이미지 빌드 통과
- 운영 이미지는 외부 네트워크가 없는 컨테이너에서 일반 사용자(uid 1000)로 주요 페이지 응답 확인

실제 SSO·운영 API·WebSocket 서버와의 연동, iOS/Android 실제 기기의 IME 조합·키보드·뒤로 가기 동작, GitHub 호스팅 CI 실행은 아직 검증하지 않았습니다. 보안 취약점 진단인 npm audit는 의존성 정보를 외부로 전송하는 작업에 대한 이전 자동 승인 검토 제한으로 실행하지 않았습니다.
