import { createBrowserRouter } from 'react-router-dom'

import { DocsLayout } from './layouts/docs-layout'
import { SiteLayout } from './layouts/site-layout'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

function RouteFallback() {
  return (
    <main className="route-fallback" aria-live="polite">
      <span>
        LYRD<span aria-hidden="true">.</span>
      </span>
      <p>문서를 불러오는 중입니다.</p>
    </main>
  )
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <SiteLayout />,
      hydrateFallbackElement: <RouteFallback />,
      children: [
        {
          index: true,
          lazy: async () => {
            const { HomePage } = await import('./pages/home-page')
            return { Component: HomePage }
          },
        },
        {
          element: <DocsLayout />,
          children: [
            {
              path: 'introduction',
              lazy: async () => {
                const { IntroductionPage } = await import('./pages/introduction-page')
                return { Component: IntroductionPage }
              },
            },
            {
              path: 'getting-started',
              lazy: async () => {
                const { GettingStartedPage } = await import('./pages/getting-started-page')
                return { Component: GettingStartedPage }
              },
            },
            {
              path: 'getting-started/vite',
              lazy: async () => {
                const { ViteSetupPage } = await import('./pages/vite-setup-page')
                return { Component: ViteSetupPage }
              },
            },
            {
              path: 'getting-started/next-app-router',
              lazy: async () => {
                const { NextAppRouterSetupPage } = await import(
                  './pages/next-app-router-setup-page'
                )
                return { Component: NextAppRouterSetupPage }
              },
            },
            {
              path: 'concepts/outcome-and-handle',
              lazy: async () => {
                const { OutcomeAndHandlePage } = await import('./pages/concept-pages')
                return { Component: OutcomeAndHandlePage }
              },
            },
            {
              path: 'concepts/lifecycle',
              lazy: async () => {
                const { LifecyclePage } = await import('./pages/concept-pages')
                return { Component: LifecyclePage }
              },
            },
            {
              path: 'concepts/glossary',
              lazy: async () => {
                const { GlossaryPage } = await import('./pages/glossary-page')
                return { Component: GlossaryPage }
              },
            },
            {
              path: 'api/application',
              lazy: async () => {
                const { ApplicationApiPage } = await import('./pages/api-pages')
                return { Component: ApplicationApiPage }
              },
            },
            {
              path: 'api/public-types',
              lazy: async () => {
                const { PublicTypesPage } = await import('./pages/public-types-page')
                return { Component: PublicTypesPage }
              },
            },
            {
              path: 'api/renderer',
              lazy: async () => {
                const { RendererGuidePage } = await import('./pages/renderer-guide-page')
                return { Component: RendererGuidePage }
              },
            },
            {
              path: 'recipes/custom-overlay',
              lazy: async () => {
                const { CustomOverlayRecipePage } = await import(
                  './pages/custom-overlay-recipe-page'
                )
                return { Component: CustomOverlayRecipePage }
              },
            },
            {
              path: 'recipes/form-state',
              lazy: async () => {
                const { FormStateRecipePage } = await import('./pages/form-state-recipe-page')
                return { Component: FormStateRecipePage }
              },
            },
            {
              path: 'recipes/async-confirm',
              lazy: async () => {
                const { AsyncConfirmRecipePage } = await import('./pages/async-confirm-recipe-page')
                return { Component: AsyncConfirmRecipePage }
              },
            },
            {
              path: 'recipes/nested-confirm',
              lazy: async () => {
                const { NestedConfirmRecipePage } = await import(
                  './pages/nested-confirm-recipe-page'
                )
                return { Component: NestedConfirmRecipePage }
              },
            },
            {
              path: 'troubleshooting',
              lazy: async () => {
                const { TroubleshootingPage } = await import('./pages/troubleshooting-page')
                return { Component: TroubleshootingPage }
              },
            },
            {
              path: 'migrations/overlay-api',
              lazy: async () => {
                const { OverlayApiMigrationPage } = await import('./pages/migration-pages')
                return { Component: OverlayApiMigrationPage }
              },
            },
          ],
        },
        {
          path: 'playground',
          lazy: async () => {
            const { PlaygroundPage } = await import('./pages/playground-page')
            return { Component: PlaygroundPage }
          },
        },
        {
          path: '*',
          lazy: async () => {
            const { NotFoundPage } = await import('./pages/not-found-page')
            return { Component: NotFoundPage }
          },
        },
      ],
    },
  ],
  { basename },
)
