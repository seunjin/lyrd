import { createBrowserRouter } from 'react-router-dom'

import { DocsLayout } from './layouts/docs-layout'
import { SiteLayout } from './layouts/site-layout'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <SiteLayout />,
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
              path: 'concepts/groups-and-scheduling',
              lazy: async () => {
                const { GroupsAndSchedulingPage } = await import('./pages/concept-pages')
                return { Component: GroupsAndSchedulingPage }
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
              path: 'recipes/toast',
              lazy: async () => {
                const { ToastRecipePage } = await import('./pages/recipe-pages')
                return { Component: ToastRecipePage }
              },
            },
            {
              path: 'recipes/progress',
              lazy: async () => {
                const { ProgressRecipePage } = await import('./pages/recipe-pages')
                return { Component: ProgressRecipePage }
              },
            },
            {
              path: 'migrations/lifecycle-api',
              lazy: async () => {
                const { LifecycleMigrationPage } = await import('./pages/migration-pages')
                return { Component: LifecycleMigrationPage }
              },
            },
            {
              path: 'migrations/overlay-handle',
              lazy: async () => {
                const { OverlayHandleMigrationPage } = await import('./pages/migration-pages')
                return { Component: OverlayHandleMigrationPage }
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
