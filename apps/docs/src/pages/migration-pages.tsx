import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const migrationRelatedDocs = [
  {
    path: '/api/application',
    title: 'Application API',
    description: '전환 후 사용할 현재 application method를 확인합니다.',
  },
  {
    path: '/recipes/form-state',
    title: 'Form state와 snapshot',
    description: '제거된 update API 대신 state를 소유하는 방법을 확인합니다.',
  },
  {
    path: '/troubleshooting',
    title: 'Troubleshooting',
    description: '전환 후 Provider와 lifecycle 연결 문제를 진단합니다.',
  },
] satisfies RelatedDoc[]

export function OverlayApiMigrationPage() {
  return (
    <DocPage
      description="정식 버전 이전 API를 호환 계층 없이 제거하고 modal interaction에 집중한 새 계약으로 이동합니다."
      eyebrow="MIGRATION · 0.2"
      title="최소 modal stack으로 전환"
    >
      <section id="removed">
        <SectionHeading id="removed">제거된 API</SectionHeading>
        <ContractList>
          <li>
            <code>defineOverlay</code>, definition input → JSX와 일반 props
          </li>
          <li>
            <code>dialog</code> → <code>open(&lt;Component /&gt;)</code>
          </li>
          <li>
            <code>openOrUpdate</code>, <code>handle.update</code> → 내부 state 또는 외부 store/query
          </li>
          <li>
            <code>dismiss</code>, <code>dismissAll</code> → <code>close</code>,{' '}
            <code>closeAll</code>
          </li>
          <li>queue, group, dedupe, identity lookup → 단일 LIFO stack</li>
        </ContractList>
      </section>

      <section id="custom-overlay">
        <SectionHeading id="custom-overlay">Custom overlay</SectionHeading>
        <CodeBlock label="BEFORE AND AFTER">
          {`- const editor = defineOverlay(Editor)
- overlay.open(editor, { projectId })
+ overlay.open<Result>(<Editor projectId={projectId} />)`}
        </CodeBlock>
        <p>
          새 <code>OverlayHandle</code>은 Promise와 <code>close()</code>만 제공합니다. props는 호출
          시점 snapshot이며 변하는 값은 컴포넌트가 소유합니다.
        </p>
      </section>

      <section id="lifecycle">
        <SectionHeading id="lifecycle">Lifecycle 이름</SectionHeading>
        <CodeBlock label="BEFORE AND AFTER">
          {`- session.dismiss('cancel')
- session.requestDismiss('outside')
- session.completeExit()
+ session.close('cancel')
+ session.requestClose('outside')
+ session.completeClose()`}
        </CodeBlock>
        <p>
          상태 이름도 mounting에서 opening으로 바뀌며, scheduling은 FIFO queue가 아니라 LIFO입니다.
        </p>
      </section>

      <section id="toast">
        <SectionHeading id="toast">Toast</SectionHeading>
        <p>
          Toast와 parallel group starter는 Core와 CLI에서 제거되었습니다. Toast는 modal focus와 닫힘
          규칙을 공유하지 않는 non-modal notification이므로 앱의 기존 Toast 라이브러리나 별도 알림
          시스템으로 이동합니다.
        </p>
        <a
          className="text-link"
          href="https://github.com/seunjin/lyrd/blob/main/docs/migrations/0.2-overlay-api.md"
        >
          저장소 migration 문서 보기 ↗
        </a>
      </section>
      <RelatedDocs items={migrationRelatedDocs} title="현재 계약으로 이어서 보기" />
    </DocPage>
  )
}
