export type DocsTableOfContentsItem = { id: string; label: string }

export type DocsRoute = {
  description: string
  keywords?: string[]
  path: string
  sourcePath: string
  title: string
  toc: DocsTableOfContentsItem[]
}

export type DocsSection = { items: DocsRoute[]; title: string }

export const docsSections: DocsSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        path: '/introduction',
        sourcePath: 'apps/docs/src/pages/introduction-page.tsx',
        title: 'Overview',
        description:
          'Lyrd가 적합한 상황, 책임 경계와 modal 요청이 결과로 이어지는 흐름을 이해합니다.',
        toc: [
          { id: 'why-lyrd', label: '왜 Lyrd인가' },
          { id: 'when-to-use', label: '언제 사용하는가' },
          { id: 'ownership', label: '역할과 소유권' },
          { id: 'request-flow', label: '요청과 결과 흐름' },
          { id: 'choose-api', label: '메서드 선택' },
        ],
      },
      {
        path: '/getting-started',
        sourcePath: 'apps/docs/src/pages/getting-started-page.tsx',
        keywords: ['설치', 'CLI', 'init', 'add overlay', 'Provider'],
        title: 'Quickstart',
        description: 'CLI가 감지하고 생성하는 범위를 확인한 뒤 프레임워크 설정으로 이동합니다.',
        toc: [
          { id: 'requirements', label: '시작하기 전에' },
          { id: 'generate', label: 'Renderer 생성' },
          { id: 'generated-files', label: '생성 파일' },
          { id: 'connect-framework', label: '프레임워크 연결' },
          { id: 'success-check', label: '성공 기준' },
        ],
      },
      {
        path: '/getting-started/vite',
        sourcePath: 'apps/docs/src/pages/vite-setup-page.tsx',
        keywords: ['Vite', 'main.tsx', 'OverlayProvider', 'useOverlay'],
        title: 'Vite React',
        description: 'Vite entry에 Provider를 연결하고 첫 Alert를 실행합니다.',
        toc: [
          { id: 'generate', label: 'Renderer 생성' },
          { id: 'mount-provider', label: 'Provider 연결' },
          { id: 'first-alert', label: '첫 Alert' },
          { id: 'troubleshooting', label: '문제 해결' },
        ],
      },
      {
        path: '/getting-started/next-app-router',
        sourcePath: 'apps/docs/src/pages/next-app-router-setup-page.tsx',
        keywords: ['Next.js', 'App Router', 'Server Component', 'use client', 'layout'],
        title: 'Next.js App Router',
        description:
          'Server layout과 생성된 client Provider 경계를 연결하고 첫 Alert를 실행합니다.',
        toc: [
          { id: 'generate', label: 'Renderer 생성' },
          { id: 'mount-provider', label: 'Provider 연결' },
          { id: 'first-alert', label: '첫 Alert' },
          { id: 'troubleshooting', label: '문제 해결' },
        ],
      },
    ],
  },
  {
    title: 'Concepts',
    items: [
      {
        path: '/concepts/outcome-and-handle',
        sourcePath: 'apps/docs/src/pages/concept-pages.tsx',
        keywords: ['OverlayOutcome', 'OverlayHandle', 'close', 'closeAll', 'props snapshot'],
        title: 'Outcome & Handle',
        description: '결과를 기다리고 정확한 세션을 닫는 awaitable Handle을 이해합니다.',
        toc: [
          { id: 'outcome', label: 'OverlayOutcome' },
          { id: 'handle', label: 'OverlayHandle' },
          { id: 'close-methods', label: '세 가지 close' },
          { id: 'result-timing', label: '결과와 제거 시점' },
          { id: 'snapshot', label: 'Props snapshot' },
        ],
      },
      {
        path: '/concepts/lifecycle',
        sourcePath: 'apps/docs/src/pages/concept-pages.tsx',
        keywords: [
          'opening',
          'open',
          'closing',
          'LIFO',
          'topmost',
          'requestClose',
          'completeClose',
          'ESC',
          'outside',
        ],
        title: 'Stack & Lifecycle',
        description: 'LIFO 순서와 닫힘 결정, exit 완료가 이어지는 흐름입니다.',
        toc: [
          { id: 'states', label: '상태 흐름' },
          { id: 'lifo', label: 'LIFO stack' },
          { id: 'three-actions', label: '세 가지 종료 동작' },
          { id: 'close-policy', label: '닫힘 정책' },
          { id: 'complete-close', label: 'completeClose 시점' },
        ],
      },
      {
        path: '/concepts/glossary',
        sourcePath: 'apps/docs/src/pages/glossary-page.tsx',
        keywords: ['Scope', 'Client', 'Provider', 'Renderer', 'Session', 'Handle', 'snapshot'],
        title: 'Glossary',
        description: 'Scope, Session, Handle, topmost와 snapshot의 뜻을 빠르게 찾습니다.',
        toc: [
          { id: 'structure', label: '구조와 소유권' },
          { id: 'lifecycle', label: 'Session lifecycle' },
          { id: 'ownership-rule', label: '한 문장으로 구분하기' },
        ],
      },
    ],
  },
  {
    title: 'Recipes',
    items: [
      {
        path: '/recipes/custom-overlay',
        sourcePath: 'apps/docs/src/pages/custom-overlay-recipe-page.tsx',
        keywords: ['open', 'Dialog', 'Sheet', 'BottomSheet', 'Drawer', 'fullscreen'],
        title: 'Custom Overlay',
        description: 'Dialog, Sheet, BottomSheet와 fullscreen을 같은 open() 계약으로 엽니다.',
        toc: [
          { id: 'choose-surface', label: '형태 선택' },
          { id: 'surface-component', label: 'Surface 컴포넌트' },
          { id: 'surface-css', label: '배치 CSS' },
          { id: 'open-and-result', label: '열기와 결과' },
          { id: 'surface-pitfalls', label: '결과와 함정' },
        ],
      },
      {
        path: '/recipes/form-state',
        sourcePath: 'apps/docs/src/pages/form-state-recipe-page.tsx',
        keywords: ['form', 'input', 'validation', 'query', 'store', 'props update', 'closeAll'],
        title: 'Form State & Snapshot',
        description: '서버 최신값, 입력 draft와 route cleanup의 소유권을 구분합니다.',
        toc: [
          { id: 'snapshot-rule', label: 'Snapshot 규칙' },
          { id: 'query-by-id', label: 'ID로 query' },
          { id: 'local-draft', label: 'Local draft' },
          { id: 'open-by-id', label: 'ID로 열기' },
          { id: 'route-cleanup', label: 'Route cleanup' },
          { id: 'state-pitfalls', label: '결과와 함정' },
        ],
      },
      {
        path: '/recipes/async-confirm',
        sourcePath: 'apps/docs/src/pages/async-confirm-recipe-page.tsx',
        keywords: ['onConfirm', 'pending', 'error', 'retry', '재시도', '비동기'],
        title: 'Async Confirm',
        description: 'Pending, 오류 표시와 같은 Confirm 안의 재시도 흐름입니다.',
        toc: [
          { id: 'when-to-use', label: '사용 시점' },
          { id: 'complete-example', label: '전체 호출 코드' },
          { id: 'state-flow', label: '상태 흐름' },
          { id: 'explicit-abort', label: '명시적 취소' },
          { id: 'async-result', label: '결과와 함정' },
        ],
      },
      {
        path: '/recipes/nested-confirm',
        sourcePath: 'apps/docs/src/pages/nested-confirm-recipe-page.tsx',
        keywords: ['nested', '중첩', 'LIFO', 'topmost', 'focus', 'stack'],
        title: 'Nested Confirm',
        description: '열린 custom overlay 위에 Confirm을 중첩하고 LIFO로 닫습니다.',
        toc: [
          { id: 'when-to-use', label: '사용 시점' },
          { id: 'complete-component', label: '전체 컴포넌트' },
          { id: 'open-parent', label: '부모 열기' },
          { id: 'lifo-result', label: 'LIFO와 focus' },
          { id: 'nested-pitfalls', label: '결과와 함정' },
        ],
      },
    ],
  },
  {
    title: 'API Reference',
    items: [
      {
        path: '/api/application',
        sourcePath: 'apps/docs/src/pages/api-pages.tsx',
        keywords: [
          'createOverlayScope',
          'useOverlay',
          'alert',
          'confirm',
          'open',
          'close',
          'closeAll',
          'onAction',
          'onConfirm',
          'onCancel',
        ],
        title: 'Application API',
        description: '제품 코드가 Alert, Confirm, custom overlay를 열고 닫는 API입니다.',
        toc: [
          { id: 'scope', label: 'createOverlayScope' },
          { id: 'request-fields', label: 'Request 필드' },
          { id: 'alert', label: 'alert' },
          { id: 'confirm', label: 'confirm' },
          { id: 'open', label: 'open' },
          { id: 'close', label: 'close' },
          { id: 'close-all', label: 'closeAll' },
          { id: 'related', label: '예제와 동작 확인' },
        ],
      },
      {
        path: '/api/public-types',
        sourcePath: 'apps/docs/src/pages/public-types-page.tsx',
        keywords: [
          'OverlayClient',
          'OverlayHandle',
          'OverlayOutcome',
          'OverlaySession',
          'OverlayPhase',
          'OverlayCloseReason',
          'OpenOptions',
        ],
        title: 'Public Types & Defaults',
        description: '@lyrd/core의 모든 공개 export와 request·result·lifecycle 타입, 기본값입니다.',
        toc: [
          { id: 'export-index', label: '공개 export 목록' },
          { id: 'request-types', label: 'Request 타입' },
          { id: 'result-types', label: '결과 타입' },
          { id: 'lifecycle-types', label: 'Lifecycle 타입' },
          { id: 'defaults', label: '기본값' },
        ],
      },
      {
        path: '/api/renderer',
        sourcePath: 'apps/docs/src/pages/renderer-guide-page.tsx',
        keywords: [
          'AlertRendererProps',
          'ConfirmRendererProps',
          'useOverlaySession',
          'requestClose',
          'completeClose',
          'Base UI',
          'Radix',
          '접근성',
        ],
        title: 'Renderer API',
        description: '앱 소유 UI와 primitive를 Core session에 연결하는 API입니다.',
        toc: [
          { id: 'renderer-props', label: 'Renderer 계약' },
          { id: 'responsibility', label: '책임 경계' },
          { id: 'base-ui', label: 'Base UI' },
          { id: 'radix', label: 'Radix' },
          { id: 'custom-ui', label: '자체 UI' },
          { id: 'confirm-state', label: 'Confirm 상태' },
          { id: 'verification', label: '검증 체크리스트' },
        ],
      },
    ],
  },
  {
    title: 'Resources',
    items: [
      {
        path: '/troubleshooting',
        sourcePath: 'apps/docs/src/pages/troubleshooting-page.tsx',
        title: 'Troubleshooting',
        description: '설정, scope, lifecycle과 Next.js 경계에서 발생하는 대표 오류를 해결합니다.',
        keywords: [
          '오류',
          '에러',
          '안 열림',
          '안 닫힘',
          'Provider 누락',
          'Provider 밖 hook',
          '다른 scope',
          'useOverlaySession 위치',
          'completeClose 누락',
          'props 업데이트',
          'Server Component',
          'use client',
        ],
        toc: [
          { id: 'diagnose', label: '먼저 확인할 것' },
          { id: 'provider-missing', label: 'Provider 누락' },
          { id: 'hook-outside-provider', label: 'Provider 밖 Hook' },
          { id: 'scope-mismatch', label: 'Scope 불일치' },
          { id: 'session-position', label: 'Session Hook 위치' },
          { id: 'complete-close', label: 'Overlay가 제거되지 않음' },
          { id: 'props-snapshot', label: 'Props가 갱신되지 않음' },
          { id: 'next-client-boundary', label: 'Next.js client 경계' },
        ],
      },
      {
        path: '/migrations/overlay-api',
        sourcePath: 'apps/docs/src/pages/migration-pages.tsx',
        keywords: ['migration', 'definition', 'update', 'group', 'dismiss', 'toast'],
        title: 'Overlay API 0.2',
        description: 'Prerelease의 definition·update·group API를 최소 modal stack으로 옮깁니다.',
        toc: [
          { id: 'removed', label: '제거된 API' },
          { id: 'custom-overlay', label: 'Custom overlay' },
          { id: 'lifecycle', label: 'Lifecycle' },
          { id: 'toast', label: 'Toast' },
        ],
      },
    ],
  },
]

export const docsRoutes = docsSections.flatMap((section) => section.items)
export const staticRoutePaths = ['/', ...docsRoutes.map((route) => route.path), '/playground']

export function findDocsRoute(pathname: string) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  return docsRoutes.find((route) => route.path === normalizedPath)
}
