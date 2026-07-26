import type { ReactNode } from 'react'

import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { DocPage } from '../components/doc-page'
import { DocSteps } from '../components/doc-steps'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const troubleshootingRelatedDocs = [
  {
    path: '/getting-started',
    title: 'Quickstart',
    description: '생성 파일과 Provider 연결을 처음부터 확인합니다.',
  },
  {
    path: '/concepts/lifecycle',
    title: 'Stack & Lifecycle',
    description: '닫힘 결정과 DOM 제거가 분리되는 이유를 확인합니다.',
  },
  {
    path: '/api/renderer',
    title: 'Renderer API',
    description: 'UI primitive를 requestClose와 completeClose에 연결합니다.',
  },
] satisfies RelatedDoc[]

function TroubleshootingCase({
  cause,
  children,
  id,
  symptom,
  title,
}: {
  cause: ReactNode
  children: ReactNode
  id: string
  symptom: ReactNode
  title: string
}) {
  return (
    <section id={id}>
      <SectionHeading id={id}>{title}</SectionHeading>
      <dl className="troubleshooting-summary">
        <div>
          <dt>증상</dt>
          <dd>{symptom}</dd>
        </div>
        <div>
          <dt>원인</dt>
          <dd>{cause}</dd>
        </div>
      </dl>
      <h3>해결</h3>
      {children}
    </section>
  )
}

export function TroubleshootingPage() {
  return (
    <DocPage eyebrow="TROUBLESHOOTING">
      <section id="diagnose">
        <SectionHeading id="diagnose">먼저 확인할 것</SectionHeading>
        <p>
          Lyrd 오류는 대부분 호출부, scope Provider, 앱 Renderer와 UI primitive 사이의 연결 하나가
          끊어져 발생합니다. 아래 순서대로 확인하면 원인을 빠르게 좁힐 수 있습니다.
        </p>
        <DocSteps
          items={[
            {
              id: 'read-first-error',
              title: '브라우저의 첫 오류 메시지를 읽습니다.',
              description:
                '뒤따르는 React 오류보다 Lyrd가 처음 던진 위치 안내 문구를 기준으로 봅니다.',
            },
            {
              id: 'check-scope',
              title: '호출부와 Provider가 같은 scope를 import하는지 확인합니다.',
              description: '생성된 overlays 모듈 하나를 애플리케이션의 단일 진입점으로 사용합니다.',
            },
            {
              id: 'check-exit',
              title: 'Renderer가 closing을 DOM 제거까지 완료하는지 확인합니다.',
              description:
                'requestClose는 허용 요청이고 completeClose는 exit가 끝났다는 알림입니다.',
            },
          ]}
        />
        <Callout title="빠른 진단 원칙">
          호출이 시작되지 않으면 Provider와 scope를, Promise는 끝났는데 화면이 남으면{' '}
          <code>completeClose()</code>를, 열린 UI의 값이 바뀌지 않으면 props snapshot을 먼저
          확인하세요.
        </Callout>
      </section>

      <TroubleshootingCase
        cause="애플리케이션 root에 생성된 OverlayProvider가 연결되지 않았습니다."
        id="provider-missing"
        symptom={
          <>
            모든 호출부에서 <code>useOverlay()</code>가 Provider 안에서 사용되어야 한다는 오류를
            던집니다.
          </>
        }
        title="Provider를 마운트하지 않았습니다"
      >
        <p>
          CLI가 생성한 Provider를 애플리케이션 root에 한 번 연결합니다. Vite에서는{' '}
          <code>main.tsx</code>, Next.js에서는 client wrapper가 일반적인 위치입니다.
        </p>
        <CodeBlock label="APP ROOT">{`<OverlayProvider>
  <App />
</OverlayProvider>`}</CodeBlock>
        <p>
          Provider 파일을 직접 다시 만들기보다 생성된 <code>overlays</code> 모듈을 사용해야
          Renderer와 scope가 같은 계약을 공유합니다.
        </p>
      </TroubleshootingCase>

      <TroubleshootingCase
        cause="Provider는 존재하지만 해당 컴포넌트가 Provider의 React 자식 트리 밖에 있습니다."
        id="hook-outside-provider"
        symptom={
          <>
            일부 화면에서만 <code>useOverlay()</code> 위치 오류가 발생하고 다른 화면은 정상입니다.
          </>
        }
        title="Hook 호출부가 Provider 밖에 있습니다"
      >
        <p>
          DOM 위치가 아니라 React 트리를 확인합니다. 별도 React root, Provider보다 위의 layout 또는
          독립 테스트 render는 같은 context를 받지 못합니다. 호출부를 Provider 아래로 옮기거나
          테스트를 Provider로 감싸세요.
        </p>
        <Callout title="Import도 함께 확인하세요" tone="warning">
          제품 코드는 Core에서 전역 Hook을 찾지 말고 생성된 앱 모듈의 <code>useOverlay</code>를
          import해야 합니다. 각 scope는 자신만의 Hook과 Provider를 만듭니다.
        </Callout>
      </TroubleshootingCase>

      <TroubleshootingCase
        cause="Provider와 주입한 client가 서로 다른 createOverlayScope() 호출에서 만들어졌습니다."
        id="scope-mismatch"
        symptom={
          <code>OverlayProvider의 client는 같은 createOverlayScope()에서 생성해야 합니다.</code>
        }
        title="Provider와 client의 scope가 다릅니다"
      >
        <p>
          scope 선언은 한 파일에서 한 번만 만들고, Provider·Hook·외부 코드용 client를 모두 그
          객체에서 꺼냅니다. 테스트 전용 client도 같은 <code>appOverlay</code>를 사용해야 합니다.
        </p>
        <CodeBlock label="SAME SCOPE">{`export const appOverlay = createOverlayScope<AppRequests>()
export const useOverlay = appOverlay.useOverlay

const client = appOverlay.createClient()

<appOverlay.OverlayProvider client={client} renderers={renderers} />`}</CodeBlock>
      </TroubleshootingCase>

      <TroubleshootingCase
        cause="Session context는 overlay.open()으로 생성된 custom JSX에만 제공됩니다."
        id="session-position"
        symptom={
          <code>
            useOverlaySession()은 overlay.open()으로 열린 컴포넌트 안에서 사용해야 합니다.
          </code>
        }
        title="useOverlaySession()의 위치가 잘못됐습니다"
      >
        <p>
          페이지나 일반 Dialog에서 session Hook을 미리 호출하지 마세요. Hook은 <code>open()</code>에
          전달할 컴포넌트 내부에서 호출하고, 호출부는 그 JSX를 열기만 합니다.
        </p>
        <CodeBlock label="CUSTOM SESSION">{`function ProjectDialog() {
  const session = useOverlaySession<ProjectResult>()
  return <Dialog open={session.open} />
}

const outcome = await overlay.open<ProjectResult>(<ProjectDialog />)`}</CodeBlock>
      </TroubleshootingCase>

      <TroubleshootingCase
        cause="Renderer가 닫힘을 시작했지만 exit 완료 뒤 completeClose()를 호출하지 않았습니다."
        id="complete-close"
        symptom="Promise 결과는 도착했는데 Overlay DOM, scroll lock 또는 stack의 closing 항목이 계속 남습니다."
        title="닫힌 Overlay가 제거되지 않습니다"
      >
        <p>
          UI primitive의 exit 완료 callback에서 <code>completeClose()</code>를 호출합니다.
          animation이 없다면 session이 closing이 된 직후 호출해도 됩니다.
        </p>
        <CodeBlock label="EXIT COMPLETE">{`<Dialog.Root
  open={session.open}
  onOpenChangeComplete={(open) => {
    if (!open) session.completeClose()
  }}
/>`}</CodeBlock>
        <Callout title="requestClose와 역할이 다릅니다" tone="warning">
          <code>requestClose('escape' | 'outside')</code>는 닫아도 되는지 Core에 묻습니다. DOM
          제거가 끝났다는 신호는 반드시 <code>completeClose()</code>로 따로 전달합니다.
        </Callout>
      </TroubleshootingCase>

      <TroubleshootingCase
        cause="open()은 전달받은 React element와 props를 호출 시점 snapshot으로 보관합니다."
        id="props-snapshot"
        symptom="부모 state가 바뀌었지만 이미 열린 custom overlay의 props가 갱신되지 않습니다."
        title="열린 Overlay의 props가 갱신되지 않습니다"
      >
        <p>
          입력 draft, 단계와 loading state는 열린 컴포넌트 내부에서 소유하세요. 서버 최신값이
          필요하면 안정적인 ID만 전달하고 컴포넌트 안에서 query나 store를 구독합니다.
        </p>
        <CodeBlock label="SNAPSHOT-SAFE">{`overlay.open(<ProjectDialog projectId={projectId} />)

function ProjectDialog({ projectId }: { projectId: string }) {
  const project = useProjectQuery(projectId)
  const [draft, setDraft] = useState(project.data?.name ?? '')
  // ...
}`}</CodeBlock>
        <p>
          새 props로 바꾸기 위해 기존 Overlay를 닫았다 다시 열거나 update API를 찾지 마세요. 다른
          대상을 열어야 하는 명시적 사용자 행동이라면 새 session을 여는 것이 맞습니다.
        </p>
      </TroubleshootingCase>

      <TroubleshootingCase
        cause="React Hook과 이벤트 handler를 사용하는 Provider 또는 호출 컴포넌트가 Server Component로 해석됐습니다."
        id="next-client-boundary"
        symptom="Next.js App Router에서 useState·context·event handler 관련 빌드 오류가 발생합니다."
        title="Next.js client boundary가 없습니다"
      >
        <p>
          생성된 Provider와 <code>useOverlay()</code> 호출 컴포넌트에는 <code>'use client'</code>{' '}
          경계가 필요합니다. root <code>layout.tsx</code> 자체는 Server Component로 유지하고 client
          Provider를 자식으로 조합하세요.
        </p>
        <CodeBlock label="APP/LYRD-OVERLAY-PROVIDER.TSX">{`'use client'

export { OverlayProvider as LyrdOverlayProvider } from '@/overlays'`}</CodeBlock>
        <CodeBlock label="APP/LAYOUT.TSX">{`export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="ko">
      <body>
        <LyrdOverlayProvider>{children}</LyrdOverlayProvider>
      </body>
    </html>
  )
}`}</CodeBlock>
      </TroubleshootingCase>

      <RelatedDocs items={troubleshootingRelatedDocs} title="원리와 설정 다시 보기" />
    </DocPage>
  )
}
