import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const frameworkSetupDocs = [
  {
    path: '/getting-started/vite',
    title: 'Vite React 설정',
    description: 'main.tsx에 Provider를 연결하고 첫 Alert를 엽니다.',
  },
  {
    path: '/getting-started/next-app-router',
    title: 'Next.js App Router 설정',
    description: 'Server layout과 생성된 client Provider 경계를 연결합니다.',
  },
] satisfies RelatedDoc[]

export function GettingStartedPage() {
  return (
    <DocPage
      description="프로젝트를 감지하고 앱이 소유할 Base UI Renderer를 생성한 뒤 프레임워크 root에 연결합니다."
      eyebrow="QUICKSTART"
      title="첫 오버레이를 준비하기"
    >
      <section id="requirements">
        <SectionHeading id="requirements">1. 시작하기 전에</SectionHeading>
        <ContractList>
          <li>Node.js 18 이상과 React 19 애플리케이션이 필요합니다.</li>
          <li>
            CLI는 Vite React의 <code>src/main.tsx</code>·<code>src/main.jsx</code>와 Next.js App
            Router의 <code>app</code>·<code>src/app</code>을 감지합니다.
          </li>
          <li>
            <code>package.json</code>이 있는 프로젝트 root에서 실행합니다. lockfile이 있으면 package
            manager를 감지하고, 없으면 pnpm을 사용합니다.
          </li>
          <li>기존 Git 변경을 먼저 확인합니다. CLI는 생성 파일을 자동으로 덮어쓰지 않습니다.</li>
        </ContractList>
      </section>

      <section id="generate">
        <SectionHeading id="generate">2. Overlay Renderer 생성</SectionHeading>
        <CodeBlock label="TERMINAL">pnpm dlx @lyrd/cli add overlay</CodeBlock>
        <p>
          설정이 없다면 CLI가 CSS Modules와 Tailwind CSS v4 중 하나를 묻고 <code>lyrd.json</code>을
          만듭니다. 이어서 <code>@lyrd/core</code>와 <code>@base-ui/react</code>를 설치하고 앱 안에
          Alert·Confirm Renderer를 생성합니다.
        </p>
        <CodeBlock label="NON-INTERACTIVE">
          {`pnpm dlx @lyrd/cli add overlay --style css-modules
pnpm dlx @lyrd/cli add overlay --style tailwind-v4`}
        </CodeBlock>
        <p>
          대화형 입력을 사용할 수 없는 CI나 자동화에서는 <code>--style</code>을 반드시 지정합니다.{' '}
          <code>--verbose</code>를 추가하면 감지된 app root에 넣을 Provider 코드도 출력합니다.
        </p>
        <Callout title="init은 선택 사항입니다">
          <code>pnpm dlx @lyrd/cli init</code>은 style을 선택받고 framework, package manager와
          source root를 감지해 <code>lyrd.json</code>을 먼저 만듭니다. 바로 Renderer를 생성하려면{' '}
          <code>add overlay</code> 하나만 실행해도 됩니다.
        </Callout>
      </section>

      <section id="generated-files">
        <SectionHeading id="generated-files">3. 무엇이 생성되는가</SectionHeading>
        <CodeBlock label="CSS MODULES OUTPUT">
          {`lyrd.json
src/overlays/
├─ scope.ts
├─ OverlayProvider.tsx
├─ index.ts
├─ alert/
│  ├─ AlertSurface.tsx
│  ├─ Alert.module.css
│  └─ index.ts
└─ confirm/
   ├─ ConfirmSurface.tsx
   ├─ Confirm.module.css
   └─ index.ts`}
        </CodeBlock>
        <p>
          Tailwind CSS v4를 선택하면 별도 CSS Module 없이 같은 TypeScript 구조가 생성됩니다. Next.js
          App Router에서는 여기에 <code>app/lyrd-overlay-provider.tsx</code> 또는{' '}
          <code>src/app/lyrd-overlay-provider.tsx</code>가 추가됩니다.
        </p>
        <ContractList>
          <li>
            <code>scope.ts</code>: 앱의 Alert·Confirm 표시 필드와 typed <code>useOverlay</code>
          </li>
          <li>
            <code>OverlayProvider.tsx</code>: 앱 Renderer를 하나의 scope에 연결
          </li>
          <li>
            <code>AlertSurface.tsx</code>·<code>ConfirmSurface.tsx</code>: 수정 가능한 앱 소유 UI
          </li>
        </ContractList>
      </section>

      <section id="connect-framework">
        <SectionHeading id="connect-framework">4. 프레임워크 root에 연결</SectionHeading>
        <p>
          CLI는 기존 app entry를 임의로 수정하지 않습니다. 아래에서 사용하는 프레임워크를 선택해
          Provider 연결과 첫 Alert까지 완료합니다.
        </p>
        <RelatedDocs items={frameworkSetupDocs} title="프레임워크 선택" />
      </section>

      <section id="success-check">
        <SectionHeading id="success-check">5. 성공 기준</SectionHeading>
        <ContractList>
          <li>Provider가 애플리케이션 root에 한 번만 mount됩니다.</li>
          <li>
            호출부는 생성된 <code>scope.ts</code>의 <code>useOverlay</code>를 import합니다.
          </li>
          <li>첫 Alert가 열리고 확인 버튼을 누르면 await가 완료됩니다.</li>
          <li>브라우저 console에 Provider나 scope 관련 오류가 없습니다.</li>
        </ContractList>
        <Callout title="파일이 이미 있다면">
          CLI는 기존 파일을 <code>Kept existing</code>으로 보고하고 덮어쓰지 않습니다. 이전 Lyrd에서
          만든 파일이라면 새 template과 직접 비교해 필요한 부분만 병합합니다.
        </Callout>
      </section>
    </DocPage>
  )
}
