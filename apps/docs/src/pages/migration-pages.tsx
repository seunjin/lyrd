import { CodeBlock, ContractList, DocPage } from '../components/doc-page'

export function LifecycleMigrationPage() {
  return (
    <DocPage
      description="0.1 prerelease에서 Renderer lifecycle의 이름과 dismiss option을 의미가 드러나는 계약으로 옮깁니다."
      eyebrow="MIGRATION · 0.1"
      title="Lifecycle API migration"
    >
      <section id="changes">
        <h2>변경표</h2>
        <CodeBlock label="DIFF">
          {`- session.requestClose(reason)
+ session.requestDismiss(reason)

- session.completeClose()
+ session.completeExit()

- { dismiss: 'block' }
+ { dismissPolicy: 'block' }`}
        </CodeBlock>
      </section>

      <section id="renderer-connection">
        <h2>Renderer 연결</h2>
        <CodeBlock label="RENDERER">
          {`<Dialog.Root
  open={session.open}
  onOpenChange={(open, details) => {
    if (!open) {
      session.requestDismiss(
        details.reason === 'escape-key' ? 'escape' : 'outside',
      )
    }
  }}
  onOpenChangeComplete={(open) => {
    if (!open) session.completeExit()
  }}
/>`}
        </CodeBlock>
      </section>

      <section id="semantics">
        <h2>이름과 함께 의미도 확인하기</h2>
        <ContractList>
          <li>requestDismiss는 외부 dismiss 시도를 policy에 전달합니다.</li>
          <li>dismiss는 이미 결정된 Renderer action이므로 requestDismiss와 다릅니다.</li>
          <li>completeExit은 closing transition 이후 최종 제거 신호입니다.</li>
        </ContractList>
        <a
          className="text-link"
          href="https://github.com/seunjin/lyrd/blob/main/docs/migrations/0.1-lifecycle-api.md"
        >
          원본 migration 문서 보기 ↗
        </a>
      </section>
    </DocPage>
  )
}

export function OverlayHandleMigrationPage() {
  return (
    <DocPage
      description="identity 기반 갱신 API는 openOrUpdate로 이름이 바뀌고, open 계열은 직접 제어할 수 있는 awaitable Handle을 반환합니다."
      eyebrow="MIGRATION · 0.1"
      title="Overlay Handle migration"
    >
      <section id="rename">
        <h2>API 이름 변경</h2>
        <CodeBlock label="DIFF">
          {`- overlay.upsert(definition, identity, input, options)
+ overlay.openOrUpdate(definition, identity, input, options)`}
        </CodeBlock>
        <p>
          같은 definition과 identity의 활성 세션이 있으면 input, Handle과 component instance를
          재사용하고, 없으면 새 세션을 생성한다는 동작이 이름에 드러납니다.
        </p>
      </section>

      <section id="awaitable-handle">
        <h2>Awaitable Handle</h2>
        <CodeBlock label="BEFORE AND AFTER">
          {`const upload = overlay.openOrUpdate(
  uploadProgress,
  uploadId,
  initialInput,
)

- overlay.upsert(uploadProgress, uploadId, nextInput)
+ upload.update(nextInput)

const outcome = await upload`}
        </CodeBlock>
        <ContractList>
          <li>Handle 자체가 Promise이므로 handle.outcome property는 없습니다.</li>
          <li>openWithHandle 같은 별도 API도 없습니다.</li>
          <li>종료된 Handle의 update와 dismiss는 false를 반환합니다.</li>
        </ContractList>
      </section>

      <section id="migration-guide">
        <h2>호출부 선택 가이드</h2>
        <div className="decision-guide">
          <article>
            <span>한 번 열기</span>
            <strong>await overlay.open(...)</strong>
          </article>
          <article>
            <span>로컬 갱신</span>
            <strong>handle.update(...)</strong>
          </article>
          <article>
            <span>업무 ID로 탐색</span>
            <strong>openOrUpdate(...)</strong>
          </article>
        </div>
        <a
          className="text-link"
          href="https://github.com/seunjin/lyrd/blob/main/docs/migrations/0.1-overlay-handle.md"
        >
          원본 migration 문서 보기 ↗
        </a>
      </section>
    </DocPage>
  )
}
