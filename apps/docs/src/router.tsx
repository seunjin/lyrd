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
              path: 'api/application',
              lazy: async () => {
                const { ApplicationApiPage } = await import('./pages/api-pages')
                return { Component: ApplicationApiPage }
              },
            },
            {
              path: 'api/renderer',
              lazy: async () => {
                const { RendererApiPage } = await import('./pages/api-pages')
                return { Component: RendererApiPage }
              },
            },
            {
              path: 'recipes/custom-overlay',
              lazy: async () => {
                const { CustomOverlayRecipePage } = await import('./pages/recipe-pages')
                return { Component: CustomOverlayRecipePage }
              },
            },
            {
              path: 'recipes/nested-confirm',
              lazy: async () => {
                const { NestedConfirmRecipePage } = await import('./pages/recipe-pages')
                return { Component: NestedConfirmRecipePage }
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
