export type DocsTableOfContentsItem = {
  id: string
  label: string
}

export type DocsRoute = {
  description: string
  path: string
  title: string
  toc: DocsTableOfContentsItem[]
}

export type DocsSection = {
  items: DocsRoute[]
  title: string
}

export const docsSections: DocsSection[] = [
  {
    title: '시작',
    items: [
      {
        path: '/introduction',
        title: 'Introduction',
        description: 'Lyrd가 관리하는 것과 애플리케이션이 소유하는 것을 이해합니다.',
        toc: [
          { id: 'why-lyrd', label: '왜 Lyrd인가' },
          { id: 'ownership', label: '역할과 소유권' },
          { id: 'mental-model', label: '기본 모델' },
        ],
      },
      {
        path: '/getting-started',
        title: 'Getting Started',
        description: 'Core와 CLI를 설치하고 첫 오버레이를 엽니다.',
        toc: [
          { id: 'install', label: '설치' },
          { id: 'generate-renderer', label: 'Renderer 생성' },
          { id: 'connect-provider', label: 'Provider 연결' },
          { id: 'first-overlay', label: '첫 오버레이' },
          { id: 'custom-overlay', label: '커스텀 오버레이' },
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
        description: '결과를 기다리고 활성 세션을 직접 제어하는 두 가지 사용법입니다.',
        toc: [
          { id: 'outcome', label: 'OverlayOutcome' },
          { id: 'handle', label: 'OverlayHandle' },
          { id: 'choose', label: '선택 가이드' },
          { id: 'promise-detail', label: 'Promise 세부사항' },
        ],
      },
      {
        path: '/concepts/lifecycle',
        title: 'Lifecycle',
        description: '열림, 종료 결정, exit 완료가 이어지는 세션 수명주기입니다.',
        toc: [
          { id: 'states', label: '상태 흐름' },
          { id: 'three-actions', label: '세 가지 종료 동작' },
          { id: 'dismiss-policy', label: 'Dismiss policy' },
        ],
      },
      {
        path: '/concepts/groups-and-scheduling',
        title: 'Groups와 Scheduling',
        description: '기본 modal queue와 독립적인 coordination boundary를 이해합니다.',
        toc: [
          { id: 'default-queue', label: '기본 queue' },
          { id: 'group-boundary', label: 'Group boundary' },
          { id: 'parallel', label: 'Parallel strategy' },
        ],
      },
    ],
  },
  {
    title: 'API Reference',
    items: [
      {
        path: '/api/application',
        title: 'Application API',
        description: '제품 코드가 오버레이를 열고 갱신하고 종료하는 API입니다.',
        toc: [
          { id: 'alert', label: 'alert' },
          { id: 'confirm', label: 'confirm' },
          { id: 'open', label: 'open' },
          { id: 'open-or-update', label: 'openOrUpdate' },
          { id: 'dismiss-all', label: 'dismissAll' },
          { id: 'types-and-definitions', label: 'Types와 definitions' },
        ],
      },
      {
        path: '/api/renderer',
        title: 'Renderer API',
        description: '앱 소유 UI와 primitive가 세션 수명주기를 연결하는 API입니다.',
        toc: [
          { id: 'session-values', label: 'open과 status' },
          { id: 'resolve', label: 'resolve' },
          { id: 'dismiss', label: 'dismiss' },
          { id: 'request-dismiss', label: 'requestDismiss' },
          { id: 'complete-exit', label: 'completeExit' },
        ],
      },
    ],
  },
  {
    title: 'Recipes',
    items: [
      {
        path: '/recipes/toast',
        title: 'Toast',
        description: '앱 소유 adapter와 parallel group으로 Toast를 연결합니다.',
        toc: [
          { id: 'contract', label: 'Recipe 계약' },
          { id: 'group', label: 'Parallel group' },
          { id: 'helpers', label: 'Helper API' },
          { id: 'identity', label: 'Identity 사용 여부' },
        ],
      },
      {
        path: '/recipes/progress',
        title: 'Progress',
        description: '업무 identity와 Handle로 진행 중인 작업을 갱신합니다.',
        toc: [
          { id: 'open-progress', label: 'Progress 열기' },
          { id: 'update-progress', label: '진행률 갱신' },
          { id: 'settle-progress', label: '결과 기다리기' },
        ],
      },
    ],
  },
  {
    title: 'Migrations',
    items: [
      {
        path: '/migrations/lifecycle-api',
        title: 'Lifecycle API',
        description: 'Renderer lifecycle 명칭과 dismiss policy를 새 계약으로 옮깁니다.',
        toc: [
          { id: 'changes', label: '변경표' },
          { id: 'renderer-connection', label: 'Renderer 연결' },
          { id: 'semantics', label: '의미 변화' },
        ],
      },
      {
        path: '/migrations/overlay-handle',
        title: 'Overlay Handle',
        description: 'upsert를 openOrUpdate와 awaitable Handle로 옮깁니다.',
        toc: [
          { id: 'rename', label: 'API 이름 변경' },
          { id: 'awaitable-handle', label: 'Awaitable Handle' },
          { id: 'migration-guide', label: '선택 가이드' },
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
