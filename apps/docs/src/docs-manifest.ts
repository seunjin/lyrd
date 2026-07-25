export type DocsTableOfContentsItem = { id: string; label: string }

export type DocsRoute = {
  description: string
  path: string
  title: string
  toc: DocsTableOfContentsItem[]
}

export type DocsSection = { items: DocsRoute[]; title: string }

export const docsSections: DocsSection[] = [
  {
    title: '시작',
    items: [
      {
        path: '/introduction',
        title: 'Introduction',
        description: 'Lyrd가 관리하는 modal interaction과 앱이 소유하는 UI를 구분합니다.',
        toc: [
          { id: 'why-lyrd', label: '왜 Lyrd인가' },
          { id: 'ownership', label: '역할과 소유권' },
          { id: 'mental-model', label: '기본 모델' },
        ],
      },
      {
        path: '/getting-started',
        title: 'Getting Started',
        description: 'Scope와 Provider를 만들고 Alert, Confirm, custom overlay를 엽니다.',
        toc: [
          { id: 'install', label: '설치' },
          { id: 'generate-renderer', label: 'Renderer 생성' },
          { id: 'connect-provider', label: 'Provider 연결' },
          { id: 'first-overlay', label: 'Alert와 Confirm' },
          { id: 'custom-overlay', label: 'Custom overlay' },
          { id: 'next-choice', label: '다음 선택' },
        ],
      },
    ],
  },
  {
    title: '개념',
    items: [
      {
        path: '/concepts/outcome-and-handle',
        title: 'Outcome과 Handle',
        description: '결과를 기다리고 정확한 세션을 닫는 awaitable Handle을 이해합니다.',
        toc: [
          { id: 'outcome', label: 'OverlayOutcome' },
          { id: 'handle', label: 'OverlayHandle' },
          { id: 'close-methods', label: '세 가지 close' },
          { id: 'snapshot', label: 'Props snapshot' },
        ],
      },
      {
        path: '/concepts/lifecycle',
        title: 'Stack과 Lifecycle',
        description: 'LIFO 순서와 닫힘 결정, exit 완료가 이어지는 흐름입니다.',
        toc: [
          { id: 'states', label: '상태 흐름' },
          { id: 'lifo', label: 'LIFO stack' },
          { id: 'three-actions', label: '세 가지 종료 동작' },
          { id: 'close-policy', label: '닫힘 정책' },
        ],
      },
    ],
  },
  {
    title: 'API',
    items: [
      {
        path: '/api/application',
        title: 'Application API',
        description: '제품 코드가 Alert, Confirm, custom overlay를 열고 닫는 API입니다.',
        toc: [
          { id: 'scope', label: 'createOverlayScope' },
          { id: 'alert', label: 'alert' },
          { id: 'confirm', label: 'confirm' },
          { id: 'open', label: 'open' },
          { id: 'close', label: 'close' },
          { id: 'close-all', label: 'closeAll' },
        ],
      },
      {
        path: '/api/renderer',
        title: 'Renderer API',
        description: '앱 소유 UI와 primitive를 Core session에 연결하는 API입니다.',
        toc: [
          { id: 'managed-renderers', label: 'Alert와 Confirm' },
          { id: 'session-values', label: 'useOverlaySession' },
          { id: 'resolve', label: 'resolve' },
          { id: 'close', label: 'close' },
          { id: 'request-close', label: 'requestClose' },
          { id: 'complete-close', label: 'completeClose' },
        ],
      },
    ],
  },
  {
    title: '활용',
    items: [
      {
        path: '/recipes/custom-overlay',
        title: 'Custom overlay',
        description: 'Dialog, Sheet, BottomSheet를 JSX로 직접 여는 패턴입니다.',
        toc: [
          { id: 'component', label: '컴포넌트' },
          { id: 'open', label: '열기와 결과' },
          { id: 'state', label: '상태 소유권' },
        ],
      },
      {
        path: '/recipes/nested-confirm',
        title: 'Nested Confirm',
        description: '열린 custom overlay 위에 Confirm을 중첩하고 LIFO로 닫습니다.',
        toc: [
          { id: 'flow', label: '중첩 흐름' },
          { id: 'pending', label: '비동기 작업' },
          { id: 'cancel-action', label: '취소 side effect' },
        ],
      },
    ],
  },
  {
    title: '마이그레이션',
    items: [
      {
        path: '/migrations/overlay-api',
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
