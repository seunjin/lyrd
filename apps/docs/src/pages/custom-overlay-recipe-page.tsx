import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { DocTable, type DocTableRow } from '../components/doc-table'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const surfaceRows = [
  {
    id: 'dialog',
    cells: ['Dialog', '짧은 결정·편집', '화면 중앙', "placement='dialog'"],
  },
  {
    id: 'sheet',
    cells: ['Sheet', '보조 정보·설정', '화면 오른쪽', "placement='right-sheet'"],
  },
  {
    id: 'bottom-sheet',
    cells: ['BottomSheet', '모바일 선택·간단 입력', '화면 아래', "placement='bottom-sheet'"],
  },
  {
    id: 'fullscreen',
    cells: ['Fullscreen', '복합 편집·몰입 작업', '전체 viewport', "placement='fullscreen'"],
  },
] satisfies DocTableRow[]

const customOverlayRelatedDocs = [
  {
    path: '/recipes/form-state',
    title: 'Form state와 props snapshot',
    description: '입력 draft와 서버 최신값을 열린 컴포넌트에서 소유합니다.',
  },
  {
    path: '/concepts/outcome-and-handle',
    title: 'Outcome과 Handle',
    description: 'resolve와 close가 돌려주는 결과 계약을 확인합니다.',
  },
  {
    path: '/api/renderer',
    title: 'Renderer adapter',
    description: 'primitive와 Core의 lifecycle 책임을 확인합니다.',
  },
] satisfies RelatedDoc[]

export function CustomOverlayRecipePage() {
  return (
    <DocPage
      description="Dialog, Sheet, BottomSheet와 fullscreen은 같은 open() 계약 위에서 앱이 형태와 접근성을 결정합니다."
      eyebrow="RECIPE"
      title="Custom surface를 JSX로 열기"
    >
      <section id="choose-surface">
        <SectionHeading id="choose-surface">언제 어떤 형태를 쓰는가</SectionHeading>
        <DocTable
          caption="Custom surface 선택"
          columns={['형태', '사용 시점', '배치', '예제 값']}
          rows={surfaceRows}
        />
        <Callout title="형태가 달라도 Core API는 늘 open()입니다">
          Sheet나 BottomSheet라는 이유로 새 Core 메서드를 만들지 않습니다. 차이는 app-owned JSX와
          CSS, 선택한 Dialog primitive에만 있고 session·stack·결과 계약은 같습니다.
        </Callout>
      </section>

      <section id="surface-component">
        <SectionHeading id="surface-component">1. controlled surface 만들기</SectionHeading>
        <CodeBlock label="ProjectSurface.tsx">
          {`'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'
import { useState } from 'react'

type Placement =
  | 'dialog'
  | 'right-sheet'
  | 'bottom-sheet'
  | 'fullscreen'

type ProjectResult = { name: string }

export function ProjectSurface({
  placement,
  projectId,
}: {
  placement: Placement
  projectId: string
}) {
  const session = useOverlaySession<ProjectResult>()
  const [name, setName] = useState('Lyrd')

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
        <Dialog.Backdrop className="surfaceBackdrop" />
        <Dialog.Viewport className="surfaceViewport">
          <Dialog.Popup
            className="projectSurface"
            data-placement={placement}
          >
            <Dialog.Title>프로젝트 {projectId} 편집</Dialog.Title>
            <Dialog.Description>
              형태는 앱 CSS가, lifecycle은 session이 결정합니다.
            </Dialog.Description>
            <label>
              이름
              <input
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>
            <button
              onClick={() => session.close('cancel')}
              type="button"
            >
              취소
            </button>
            <button
              onClick={() => session.resolve({ name })}
              type="button"
            >
              저장
            </button>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}`}
        </CodeBlock>
      </section>

      <section id="surface-css">
        <SectionHeading id="surface-css">2. 배치와 반응형 UX는 앱 CSS로 결정</SectionHeading>
        <CodeBlock label="ProjectSurface.css">
          {`.surfaceViewport {
  position: fixed;
  inset: 0;
  display: flex;
}

.surfaceBackdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 45%);
}

.projectSurface[data-placement='dialog'] {
  width: min(32rem, calc(100vw - 2rem));
  margin: auto;
}

.projectSurface[data-placement='right-sheet'] {
  width: min(28rem, 100vw);
  height: 100dvh;
  margin-left: auto;
}

.projectSurface[data-placement='bottom-sheet'] {
  width: 100%;
  max-height: min(80dvh, 44rem);
  margin-top: auto;
  border-radius: 1.25rem 1.25rem 0 0;
}

.projectSurface[data-placement='fullscreen'] {
  width: 100vw;
  min-height: 100dvh;
}`}
        </CodeBlock>
        <ContractList>
          <li>
            모바일에서 Sheet를 BottomSheet로 바꿀지는 CSS나 앱의 responsive component가 정합니다.
          </li>
          <li>focus trap·focus return·portal·scroll lock은 선택한 primitive에서 검증합니다.</li>
          <li>BottomSheet drag gesture와 snap point도 Core가 아니라 앱 UI의 책임입니다.</li>
          <li>surface별 exit가 끝난 시점에 한 번만 completeClose를 호출합니다.</li>
        </ContractList>
      </section>

      <section id="open-and-result">
        <SectionHeading id="open-and-result">3. JSX를 열고 typed 결과 받기</SectionHeading>
        <CodeBlock label="application.tsx">
          {`const placement = isMobile ? 'bottom-sheet' : 'right-sheet'

const outcome = await overlay.open<ProjectResult>(
  <ProjectSurface
    placement={placement}
    projectId={projectId}
  />,
  { closeOnEscape: true, closeOnOutsidePress: false },
)

if (outcome.status === 'resolved') {
  updateProjectName(outcome.value.name)
} else {
  logDismiss(outcome.reason)
}`}
        </CodeBlock>
        <Callout title="Result generic은 JSX에서 자동 추론되지 않습니다" tone="warning">
          <code>open&lt;ProjectResult&gt;()</code>와 컴포넌트 안의{' '}
          <code>useOverlaySession&lt;ProjectResult&gt;()</code>에 같은 타입을 사용합니다. props
          타입과 결과 타입은 서로 다른 계약입니다.
        </Callout>
      </section>

      <section id="surface-pitfalls">
        <SectionHeading id="surface-pitfalls">결과와 흔한 함정</SectionHeading>
        <ContractList>
          <li>저장은 resolved outcome, 취소·ESC·outside는 reason이 있는 closed outcome입니다.</li>
          <li>
            primitive의 자체 open state를 따로 만들면 Core와 UI가 서로 다른 상태를 가질 수 있습니다.
          </li>
          <li>z-index만 올리고 focus·inert 순서를 확인하지 않으면 중첩 modal 접근성이 깨집니다.</li>
          <li>새 placement는 open 메서드가 아니라 app-owned component나 props로 확장합니다.</li>
        </ContractList>
        <RelatedDocs items={customOverlayRelatedDocs} />
      </section>
    </DocPage>
  )
}
