import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type DocStepItem, DocSteps } from '../components/doc-steps'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const viteSuccessSteps = [
  {
    id: 'click',
    title: '버튼을 누릅니다',
    description: 'useOverlay가 같은 scope의 client에 Alert 요청을 전달합니다.',
  },
  {
    id: 'open',
    title: '앱 소유 Alert가 열립니다',
    description: '생성된 AlertSurface와 Base UI AlertDialog가 화면과 접근성 동작을 담당합니다.',
  },
  {
    id: 'resolve',
    title: '확인을 누르면 호출이 완료됩니다',
    description: 'action()이 Alert를 닫고 await 이후 코드가 계속 실행됩니다.',
  },
] satisfies DocStepItem[]

const viteRelatedDocs = [
  {
    path: '/api/application',
    title: 'Application API',
    description: 'Alert 다음에 Confirm과 custom overlay를 사용합니다.',
  },
  {
    path: '/api/renderer',
    title: 'Renderer API',
    description: '생성된 AlertSurface와 ConfirmSurface의 연결을 이해합니다.',
  },
] satisfies RelatedDoc[]

export function ViteSetupPage() {
  return (
    <DocPage
      description="Vite React entry에 생성된 OverlayProvider를 한 번 연결하고 client 컴포넌트에서 첫 Alert를 엽니다."
      eyebrow="FRAMEWORK SETUP"
      title="Vite React 설정"
    >
      <section id="generate">
        <SectionHeading id="generate">1. CSS Modules Renderer 생성</SectionHeading>
        <CodeBlock label="TERMINAL">
          pnpm dlx @lyrd/cli add overlay --style css-modules --verbose
        </CodeBlock>
        <p>
          CLI가 Vite와 <code>src/main.tsx</code> 또는 <code>src/main.jsx</code>를 감지합니다.
          verbose 출력의 <code>Overlay runtime</code> 항목에서 실제 entry 파일과 import 경로를
          확인합니다.
        </p>
      </section>

      <section id="mount-provider">
        <SectionHeading id="mount-provider">2. main.tsx에 Provider 연결</SectionHeading>
        <CodeBlock label="src/main.tsx">
          {`import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'
import { OverlayProvider } from './overlays/OverlayProvider'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

createRoot(rootElement).render(
  <StrictMode>
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </StrictMode>,
)`}
        </CodeBlock>
        <p>
          기존 root Provider가 있다면 그 안이나 밖 어느 쪽이든 가능하지만 <code>useOverlay</code>를
          호출하는 모든 컴포넌트를 감싸야 합니다. 한 앱 root에는 같은 scope의 Provider를 한 번만
          mount합니다.
        </p>
      </section>

      <section id="first-alert">
        <SectionHeading id="first-alert">3. 첫 Alert 열기</SectionHeading>
        <CodeBlock label="src/app.tsx">
          {`import { useOverlay } from './overlays/scope'

export function App() {
  const overlay = useOverlay()

  async function showWelcome() {
    await overlay.alert({
      title: 'Lyrd 연결이 완료되었습니다.',
      description: '이 UI는 src/overlays 안의 앱 코드입니다.',
      actionLabel: '확인',
    })

    console.log('Alert가 닫혔습니다.')
  }

  return (
    <button onClick={() => void showWelcome()} type="button">
      첫 Alert 열기
    </button>
  )
}`}
        </CodeBlock>
        <DocSteps items={viteSuccessSteps} />
      </section>

      <section id="troubleshooting">
        <SectionHeading id="troubleshooting">4. 열리지 않을 때</SectionHeading>
        <ContractList>
          <li>
            <code>useOverlay</code>를 <code>@lyrd/core</code>에서 직접 찾지 말고 생성된{' '}
            <code>./overlays/scope</code>에서 import합니다.
          </li>
          <li>
            <code>OverlayProvider</code>가 <code>App</code>을 실제로 감싸는지 확인합니다.
          </li>
          <li>
            다른 경로에 생성했다면 <code>lyrd.json</code>의 <code>paths.overlay</code>와 import를
            맞춥니다.
          </li>
        </ContractList>
        <Callout title="스타일을 바꾸고 싶다면">
          <code>AlertSurface.tsx</code>, <code>ConfirmSurface.tsx</code>와 CSS Module은 패키지
          내부가 아니라 앱 소스입니다. 구조, 필드, 문구와 스타일을 제품에 맞게 직접 수정합니다.
        </Callout>
        <RelatedDocs items={viteRelatedDocs} title="다음 단계" />
      </section>
    </DocPage>
  )
}
