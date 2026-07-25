import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type DocStepItem, DocSteps } from '../components/doc-steps'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const nextSuccessSteps = [
  {
    id: 'server-layout',
    title: 'RootLayout은 Server Component로 남습니다',
    description: 'layout은 생성된 LyrdOverlayProvider를 import해 children을 감싸기만 합니다.',
  },
  {
    id: 'client-boundary',
    title: '생성된 wrapper가 client boundary를 만듭니다',
    description: "lyrd-overlay-provider.tsx의 'use client' 아래에서 Core Provider가 mount됩니다.",
  },
  {
    id: 'client-call',
    title: 'Client Component가 useOverlay를 호출합니다',
    description: '버튼을 누르면 hydrated Alert가 열리고 확인 뒤 await가 완료됩니다.',
  },
] satisfies DocStepItem[]

const nextRelatedDocs = [
  {
    path: '/api/application',
    title: 'Application API',
    description: 'Client Component에서 사용할 Alert, Confirm과 open을 확인합니다.',
  },
  {
    path: '/concepts/lifecycle',
    title: 'Stack과 Lifecycle',
    description: 'route change에서 stack을 정리하는 원리를 이해합니다.',
  },
] satisfies RelatedDoc[]

export function NextAppRouterSetupPage() {
  return (
    <DocPage
      description="Server Component인 RootLayout을 유지하면서 생성된 client wrapper로 OverlayProvider를 연결합니다."
      eyebrow="FRAMEWORK SETUP"
      title="Next.js App Router 설정"
    >
      <section id="generate">
        <SectionHeading id="generate">1. Tailwind v4 Renderer 생성</SectionHeading>
        <CodeBlock label="TERMINAL">
          pnpm dlx @lyrd/cli add overlay --style tailwind-v4 --verbose
        </CodeBlock>
        <p>
          CLI가 <code>app</code> 또는 <code>src/app</code>을 감지하면 overlay 파일과 함께{' '}
          <code>lyrd-overlay-provider.tsx</code>를 생성합니다. 기존 <code>layout.tsx</code>는
          수정하지 않습니다.
        </p>
        <CodeBlock label="GENERATED CLIENT BOUNDARY">
          {`'use client'

import type { ReactNode } from 'react'

import { OverlayProvider } from '../overlays/OverlayProvider'

export function LyrdOverlayProvider({ children }: { children: ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>
}`}
        </CodeBlock>
        <p>
          위 import는 <code>src/app</code>과 <code>src/overlays</code>를 사용하는 예입니다. root{' '}
          <code>app</code> 구조라면 CLI가 해당 위치에 맞는 상대 경로를 생성합니다.
        </p>
      </section>

      <section id="mount-provider">
        <SectionHeading id="mount-provider">2. RootLayout에 wrapper 연결</SectionHeading>
        <CodeBlock label="src/app/layout.tsx">
          {`import type { ReactNode } from 'react'

import { LyrdOverlayProvider } from './lyrd-overlay-provider'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <LyrdOverlayProvider>{children}</LyrdOverlayProvider>
      </body>
    </html>
  )
}`}
        </CodeBlock>
        <Callout title="layout 전체를 Client Component로 바꾸지 않습니다">
          RootLayout에는 <code>'use client'</code>를 추가하지 않습니다. 생성된 wrapper만 client
          boundary이며 Server Component인 <code>children</code>을 그대로 받을 수 있습니다.
        </Callout>
      </section>

      <section id="first-alert">
        <SectionHeading id="first-alert">3. Client Component에서 첫 Alert 열기</SectionHeading>
        <CodeBlock label="src/app/overlay-demo.tsx">
          {`'use client'

import { useOverlay } from '../overlays/scope'

export function OverlayDemo() {
  const overlay = useOverlay()

  async function showWelcome() {
    await overlay.alert({
      title: 'Lyrd 연결이 완료되었습니다.',
      description: '이 Alert는 Client Component에서 열렸습니다.',
      actionLabel: '확인',
    })
  }

  return (
    <button onClick={() => void showWelcome()} type="button">
      첫 Alert 열기
    </button>
  )
}`}
        </CodeBlock>
        <CodeBlock label="src/app/page.tsx">
          {`import { OverlayDemo } from './overlay-demo'

export default function HomePage() {
  return (
    <main>
      <h1>Overlay demo</h1>
      <OverlayDemo />
    </main>
  )
}`}
        </CodeBlock>
        <DocSteps items={nextSuccessSteps} />
      </section>

      <section id="troubleshooting">
        <SectionHeading id="troubleshooting">4. 열리지 않을 때</SectionHeading>
        <ContractList>
          <li>
            <code>useOverlay</code>를 호출하는 파일에 <code>'use client'</code>가 있는지 확인합니다.
          </li>
          <li>
            <code>LyrdOverlayProvider</code>가 root layout의 <code>children</code>을 감싸는지
            확인합니다.
          </li>
          <li>
            <code>src/app</code>과 root <code>app</code> 중 실제 구조에 맞는 생성 파일을
            import합니다.
          </li>
          <li>Provider나 scope 파일을 Server Component에서 직접 실행하려 하지 않습니다.</li>
        </ContractList>
        <Callout title="Provider 파일이 이미 있다면">
          CLI는 기존 <code>lyrd-overlay-provider.tsx</code>를 덮어쓰지 않습니다. 출력의{' '}
          <code>Kept existing</code> 목록을 확인하고 현재 template과 직접 비교합니다.
        </Callout>
        <RelatedDocs items={nextRelatedDocs} title="다음 단계" />
      </section>
    </DocPage>
  )
}
