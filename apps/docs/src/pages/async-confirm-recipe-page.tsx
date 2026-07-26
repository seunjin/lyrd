import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type DocStepItem, DocSteps } from '../components/doc-steps'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const asyncConfirmSteps = [
  {
    id: 'start',
    title: '확인 버튼이 confirm()을 호출합니다',
    description: 'Core가 호출부 onConfirm을 정확히 한 번 실행합니다.',
  },
  {
    id: 'pending',
    title: 'Promise가 진행되는 동안 pending입니다',
    description: '생성된 Renderer가 확인·취소 버튼을 비활성화하고 aria-busy를 표시합니다.',
  },
  {
    id: 'error',
    title: '실패하면 error 상태로 열린 채 유지합니다',
    description: 'Renderer가 오류를 role=alert로 표시하고 확인 버튼을 다시 활성화합니다.',
  },
  {
    id: 'retry',
    title: '같은 confirm()으로 재시도합니다',
    description: '성공하면 true로 완료하고 exit 뒤 session을 제거합니다.',
  },
] satisfies DocStepItem[]

const asyncConfirmRelatedDocs = [
  {
    path: '/api/renderer',
    title: 'Renderer API',
    description: 'actionStatus·error·confirm command를 UI에 연결합니다.',
  },
  {
    path: '/playground',
    title: 'Playground',
    description: '첫 시도 실패와 두 번째 성공을 직접 재현합니다.',
  },
  {
    path: '/recipes/nested-confirm',
    title: 'Nested Confirm',
    description: '열린 custom overlay 위에서 Confirm을 실행합니다.',
  },
] satisfies RelatedDoc[]

export function AsyncConfirmRecipePage() {
  return (
    <DocPage eyebrow="RECIPE">
      <section id="when-to-use">
        <SectionHeading id="when-to-use">언제 사용하는가</SectionHeading>
        <p>
          삭제·배포처럼 사용자의 확인과 서버 작업 성공을 하나의 상호작용으로 묶을 때 사용합니다.
          단순히 boolean을 받은 뒤 별도 화면에서 작업할 수 있다면 <code>onConfirm</code> 없이
          Confirm 결과를 먼저 기다리는 편이 더 단순합니다.
        </p>
      </section>

      <section id="complete-example">
        <SectionHeading id="complete-example">
          1. 첫 실패 후 재시도하는 전체 호출 코드
        </SectionHeading>
        <CodeBlock label="deploy-project.tsx">
          {`async function requestProductionDeploy(projectId: string) {
  let attempts = 0

  const confirmed = await overlay.confirm({
    title: '프로덕션에 배포할까요?',
    description: '첫 번째 요청은 실패하고 다시 시도하면 성공합니다.',
    confirmLabel: '배포',
    cancelLabel: '나중에',
    tone: 'danger',
    onConfirm: async () => {
      attempts += 1
      if (attempts === 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        throw new Error('배포 승인 서버가 응답하지 않았습니다.')
      }

      await deployProject(projectId)
    },
  })

  if (confirmed) {
    showToast('배포가 시작되었습니다.')
  }
}`}
        </CodeBlock>
        <Callout title="예제의 첫 실패는 동작을 보여 주기 위한 장치입니다">
          실제 앱에서는 <code>deployProject()</code>가 던진 오류를 그대로 사용합니다. Core는 오류를
          가공하지 않고 Renderer의 <code>error</code>에 전달합니다.
        </Callout>
      </section>

      <section id="state-flow">
        <SectionHeading id="state-flow">2. Pending·error·retry 흐름</SectionHeading>
        <DocSteps items={asyncConfirmSteps} />
        <CodeBlock label="ConfirmSurface.tsx">
          {`const pending = actionStatus === 'pending'

{actionStatus === 'error' ? (
  <p role="alert">
    {error instanceof Error
      ? error.message
      : '작업을 완료하지 못했습니다.'}
  </p>
) : null}

<button disabled={pending} onClick={cancel} type="button">
  취소
</button>
<button
  aria-busy={pending}
  disabled={pending}
  onClick={confirm}
  type="button"
>
  {pending ? '처리 중' : (request.confirmLabel ?? '확인')}
</button>`}
        </CodeBlock>
        <p>
          버튼 문구와 spinner, 오류 문장은 앱 Renderer가 소유합니다. Core가 제공하는 것은
          <code>actionStatus</code>, <code>error</code>와 재실행 가능한 <code>confirm()</code>
          입니다.
        </p>
      </section>

      <section id="explicit-abort">
        <SectionHeading id="explicit-abort">
          3. 앱 명령으로 닫을 때 작업 취소가 필요하다면
        </SectionHeading>
        <CodeBlock label="abortable-confirm.ts">
          {`const controller = new AbortController()

const handle = overlay.confirm({
  title: '대용량 내보내기를 시작할까요?',
  onConfirm: () => exportProject({ signal: controller.signal }),
})

function teardown() {
  controller.abort()
  handle.close('route-change')
}

const confirmed = await handle`}
        </CodeBlock>
        <Callout title="Lyrd는 onConfirm 작업을 자동으로 취소하지 않습니다" tone="warning">
          pending 중 Renderer의 confirm·cancel·ESC·outside command는 무시되지만, 앱의{' '}
          <code>handle.close()</code>와 <code>closeAll()</code>은 session을 종료할 수 있습니다. 늦게
          도착한 성공·실패는 무시되며 네트워크 취소는 앱이 AbortSignal로 관리합니다.
        </Callout>
      </section>

      <section id="async-result">
        <SectionHeading id="async-result">결과와 흔한 함정</SectionHeading>
        <ContractList>
          <li>onConfirm이 동기 또는 비동기로 성공하면 true입니다.</li>
          <li>
            취소 버튼·ESC·outside·프로그램 종료는 false이며 종료 이유는 boolean에 포함되지 않습니다.
          </li>
          <li>
            onConfirm 안에서 오류를 삼키면 Core는 성공으로 판단하므로 재시도 UI가 나타나지 않습니다.
          </li>
          <li>
            Renderer에서 onConfirm을 직접 실행하면 pending·error·중복 방지 계약을 우회하게 됩니다.
          </li>
        </ContractList>
        <RelatedDocs items={asyncConfirmRelatedDocs} />
      </section>
    </DocPage>
  )
}
