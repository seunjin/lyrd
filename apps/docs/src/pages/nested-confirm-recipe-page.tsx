import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type DocStepItem, DocSteps } from '../components/doc-steps'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const nestedSteps = [
  {
    id: 'editor',
    title: 'ProjectSettings가 먼저 열립니다',
    description: '입력 draft를 가진 custom session이 stack 아래에 유지됩니다.',
  },
  {
    id: 'confirm',
    title: 'Confirm이 topmost로 push됩니다',
    description: 'ESC·outside·close는 가장 위 Confirm에만 적용됩니다.',
  },
  {
    id: 'return',
    title: 'Confirm이 먼저 제거됩니다',
    description: 'focus가 editor로 돌아오고 기존 projectName state가 그대로 남습니다.',
  },
  {
    id: 'finish',
    title: 'editor가 나중에 결과를 완료합니다',
    description: '저장 또는 취소로 아래 session을 독립적으로 종료합니다.',
  },
] satisfies DocStepItem[]

const nestedRelatedDocs = [
  {
    path: '/concepts/lifecycle',
    title: 'Stack과 Lifecycle',
    description: 'topmost와 LIFO 종료 규칙을 확인합니다.',
  },
  {
    path: '/recipes/async-confirm',
    title: 'Async Confirm',
    description: '중첩 Confirm의 비동기 작업과 재시도를 구성합니다.',
  },
  {
    path: '/playground',
    title: 'Playground',
    description: '관리형 Confirm과 custom Dialog의 실제 focus 동작을 확인합니다.',
  },
] satisfies RelatedDoc[]

export function NestedConfirmRecipePage() {
  return (
    <DocPage
      description="입력 중인 custom overlay 위에 Confirm을 push하고 아래 state와 focus를 유지합니다."
      eyebrow="RECIPE"
      title="Custom overlay 안에서 Confirm 열기"
    >
      <section id="when-to-use">
        <SectionHeading id="when-to-use">언제 사용하는가</SectionHeading>
        <p>
          편집 화면 안에서 초기화·삭제·페이지 이탈처럼 한 번 더 확인해야 하는 작업에 사용합니다.
          Confirm을 위해 editor를 닫았다가 다시 열지 않고, 같은 client의 stack 위에 새 interaction을
          올립니다.
        </p>
      </section>

      <section id="complete-component">
        <SectionHeading id="complete-component">1. 중첩 흐름을 가진 전체 컴포넌트</SectionHeading>
        <CodeBlock label="ProjectSettings.tsx">
          {`'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'
import { useState } from 'react'

import { useOverlay } from './overlays/scope'

type ProjectSettingsResult = { projectName: string }

export function ProjectSettings({ projectId }: { projectId: string }) {
  const overlay = useOverlay()
  const session = useOverlaySession<ProjectSettingsResult>()
  const [projectName, setProjectName] = useState('Lyrd')
  const [message, setMessage] = useState('아직 확인하지 않았습니다.')

  async function confirmReset() {
    const confirmed = await overlay.confirm({
      title: '프로젝트 이름을 초기화할까요?',
      description: '아래 편집 화면의 입력값과 state는 유지됩니다.',
      confirmLabel: '초기화',
      cancelLabel: '유지',
      tone: 'danger',
      onConfirm: () => setProjectName('Lyrd'),
    })

    setMessage(confirmed ? '초기화했습니다.' : '기존 이름을 유지합니다.')
  }

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
          <Dialog.Title>프로젝트 {projectId} 설정</Dialog.Title>
          <label>
            프로젝트 이름
            <input
              onChange={(event) => setProjectName(event.target.value)}
              value={projectName}
            />
          </label>
          <p aria-live="polite">{message}</p>
          <button onClick={() => void confirmReset()} type="button">
            이름 초기화
          </button>
          <button
            onClick={() => session.close('cancel')}
            type="button"
          >
            취소
          </button>
          <button
            onClick={() => session.resolve({ projectName })}
            type="button"
          >
            저장
          </button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}`}
        </CodeBlock>
      </section>

      <section id="open-parent">
        <SectionHeading id="open-parent">2. 부모 overlay를 한 번만 열기</SectionHeading>
        <CodeBlock label="application.tsx">
          {`const outcome = await overlay.open<ProjectSettingsResult>(
  <ProjectSettings projectId={projectId} />,
)

if (outcome.status === 'resolved') {
  updateProjectName(outcome.value.projectName)
}`}
        </CodeBlock>
        <p>
          <code>confirmReset()</code>이 실행되어도 부모 JSX를 다시 열지 않습니다. 아래 editor
          session은 mount된 채 local state를 유지하고 Confirm만 별도 Promise를 반환합니다.
        </p>
      </section>

      <section id="lifo-result">
        <SectionHeading id="lifo-result">3. LIFO 결과와 focus 순서</SectionHeading>
        <DocSteps items={nestedSteps} />
        <Callout title="중첩 primitive의 portal과 z-index도 확인하세요" tone="warning">
          Core는 stack 순서를 관리하지만 DOM portal 계층, inert, backdrop와 focus trap은 UI
          primitive와 앱 CSS의 책임입니다. Confirm이 editor보다 위에 보이고 닫힌 뒤 trigger로
          focus가 돌아오는지 키보드로 검증합니다.
        </Callout>
      </section>

      <section id="nested-pitfalls">
        <SectionHeading id="nested-pitfalls">결과와 흔한 함정</SectionHeading>
        <ContractList>
          <li>Confirm 취소는 false이며 아래 editor를 자동으로 닫지 않습니다.</li>
          <li>overlay.close()는 topmost인 Confirm부터 닫고 아래 session을 건너뛰지 않습니다.</li>
          <li>부모를 먼저 닫아야 한다면 해당 parent handle을 보관해 명시적으로 close합니다.</li>
          <li>중첩 Confirm을 열기 전에 editor state를 외부 props로 복제할 필요가 없습니다.</li>
        </ContractList>
        <RelatedDocs items={nestedRelatedDocs} />
      </section>
    </DocPage>
  )
}
