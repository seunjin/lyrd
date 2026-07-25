import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const formStateRelatedDocs = [
  {
    path: '/recipes/custom-overlay',
    title: 'Custom surface',
    description: '폼을 담을 Dialog·Sheet의 controlled lifecycle을 연결합니다.',
  },
  {
    path: '/concepts/outcome-and-handle',
    title: 'Props snapshot',
    description: '호출 시점 JSX와 Handle의 의미를 확인합니다.',
  },
  {
    path: '/api/application',
    title: 'closeAll',
    description: 'route teardown에서 모든 session을 닫는 계약을 확인합니다.',
  },
] satisfies RelatedDoc[]

export function FormStateRecipePage() {
  return (
    <DocPage
      description="호출부는 안정적인 ID만 넘기고, 서버 데이터와 입력 draft·validation은 열린 컴포넌트가 소유합니다."
      eyebrow="RECIPE"
      title="Form state와 props snapshot"
    >
      <section id="snapshot-rule">
        <SectionHeading id="snapshot-rule">언제 사용하는가</SectionHeading>
        <p>
          편집 Dialog나 Sheet처럼 열린 뒤 사용자가 입력을 계속 바꾸는 화면에 사용합니다.{' '}
          <code>open()</code>에 넘긴 React element는 그 호출 시점의 snapshot이며, Lyrd는 이미 열린
          element에 새 props를 주입하는 update API를 제공하지 않습니다.
        </p>
        <Callout title="props snapshot은 제한이 아니라 state 소유권 규칙입니다">
          호출부는 어떤 대상을 열지 나타내는 ID를 넘깁니다. 서버 최신값은 overlay 내부 query가 읽고,
          사용자가 수정하는 draft는 form component의 local state가 소유합니다.
        </Callout>
      </section>

      <section id="query-by-id">
        <SectionHeading id="query-by-id">1. ID로 최신 서버 데이터 읽기</SectionHeading>
        <CodeBlock label="ProjectEditor.tsx">
          {`'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'

type ProjectResult = { id: string; name: string }

export function ProjectEditor({ projectId }: { projectId: string }) {
  const session = useOverlaySession<ProjectResult>()
  const projectQuery = useProjectQuery(projectId)

  return (
    <Dialog.Root
      open={session.open}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen) {
          session.requestClose(
            details.reason === 'escape-key' ? 'escape' : 'outside',
          )
        }
      }}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) session.completeClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>프로젝트 편집</Dialog.Title>
          {projectQuery.isPending ? <p>불러오는 중…</p> : null}
          {projectQuery.isError ? (
            <button onClick={() => projectQuery.refetch()} type="button">
              다시 불러오기
            </button>
          ) : null}
          {projectQuery.data ? (
            <ProjectDraft
              key={projectQuery.data.id}
              initialName={projectQuery.data.name}
              onCancel={() => session.close('cancel')}
              onSave={(name) =>
                session.resolve({ id: projectId, name })
              }
            />
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}`}
        </CodeBlock>
        <p>
          <code>useProjectQuery</code>는 애플리케이션의 query hook을 뜻합니다. Lyrd는 서버 데이터
          도구를 정하지 않으며, 동일한 패턴을 store selector에도 적용할 수 있습니다.
        </p>
      </section>

      <section id="local-draft">
        <SectionHeading id="local-draft">2. 입력과 validation을 form 내부에 유지</SectionHeading>
        <CodeBlock label="ProjectDraft.tsx">
          {`import { useState } from 'react'

export function ProjectDraft({
  initialName,
  onCancel,
  onSave,
}: {
  initialName: string
  onCancel(): void
  onSave(name: string): void
}) {
  const [name, setName] = useState(initialName)
  const error = name.trim() ? null : '이름을 입력해 주세요.'

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!error) onSave(name.trim())
      }}
    >
      <label>
        이름
        <input
          aria-describedby={error ? 'name-error' : undefined}
          aria-invalid={Boolean(error)}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </label>
      {error ? <p id="name-error">{error}</p> : null}
      <button onClick={onCancel} type="button">취소</button>
      <button disabled={Boolean(error)} type="submit">저장</button>
    </form>
  )
}`}
        </CodeBlock>
        <ContractList>
          <li>타이핑할 때 부모가 overlay를 다시 열지 않으므로 focus와 draft가 유지됩니다.</li>
          <li>서버 mutation pending·error도 이 form이나 mutation hook이 소유합니다.</li>
          <li>다른 projectId를 편집하는 것은 update가 아니라 새로운 사용자 상호작용입니다.</li>
        </ContractList>
      </section>

      <section id="open-by-id">
        <SectionHeading id="open-by-id">3. 호출부에는 안정적인 식별자만 전달</SectionHeading>
        <CodeBlock label="application.tsx">
          {`const outcome = await overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
)

if (outcome.status === 'resolved') {
  projectCache.update(outcome.value)
}`}
        </CodeBlock>
        <Callout title="부모 state가 바뀌어도 열린 JSX를 교체하지 않습니다" tone="warning">
          부모의 <code>projectId</code>가 달라졌다면 기존 편집을 명시적으로 닫고 새 overlay를
          여세요. 조용히 props를 교체하면 사용자가 입력 중인 form의 의미가 바뀔 수 있습니다.
        </Callout>
      </section>

      <section id="route-cleanup">
        <SectionHeading id="route-cleanup">4. route teardown에서 전체 stack 정리</SectionHeading>
        <CodeBlock label="RouteOverlayCleanup.tsx">
          {`import { useEffect } from 'react'

import { useOverlay } from './overlays/scope'

export function RouteOverlayCleanup() {
  const overlay = useOverlay()

  useEffect(() => {
    return () => overlay.closeAll('route-change')
  }, [overlay])

  return null
}

// route layout 안, OverlayProvider 아래에 한 번 배치합니다.
<RouteOverlayCleanup />`}
        </CodeBlock>
        <p>
          layout이 unmount되면 현재 client의 모든 session이 닫힙니다. Custom overlay는{' '}
          <code>{`{ status: 'closed', reason: 'route-change' }`}</code>, Confirm은 false로
          완료됩니다. 이미 시작한 비동기 작업은 자동 취소되지 않으므로 필요한 경우 앱에서
          AbortSignal을 함께 관리합니다.
        </p>
      </section>

      <section id="state-pitfalls">
        <SectionHeading id="state-pitfalls">결과와 흔한 함정</SectionHeading>
        <ContractList>
          <li>
            React element와 props는 snapshot이지만 컴포넌트 내부 state는 정상적으로 rerender됩니다.
          </li>
          <li>
            외부 store나 query 구독은 계속 갱신되므로 제품에 맞는 draft 충돌 정책이 필요합니다.
          </li>
          <li>
            closeAll은 UI session을 종료할 뿐 mutation이나 fetch를 자동으로 취소하지 않습니다.
          </li>
        </ContractList>
        <RelatedDocs items={formStateRelatedDocs} />
      </section>
    </DocPage>
  )
}
