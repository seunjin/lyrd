import { Callout, CodeBlock, ContractList, DocPage } from '../components/doc-page'

export function ProgressRecipePage() {
  return (
    <DocPage
      description="진행률처럼 하나의 업무가 여러 input을 거치는 UI는 stable identity로 세션을 열고 반환된 Handle로 갱신합니다."
      eyebrow="RECIPE"
      title="진행 중인 작업 표시하기"
    >
      <section id="open-progress">
        <h2>1. 업무 identity로 열기</h2>
        <p>
          Storybook의 실제 upload progress 사례는 uploadId를 업무 identity로 사용합니다. 업로드가
          진행 중일 때 외부 dismiss를 막기 위해 dismissPolicy도 함께 설정합니다.
        </p>
        <CodeBlock label="APPLICATION">
          {`const upload = overlay.openOrUpdate(
  uploadProgress,
  uploadId,
  initialInput,
  { dismissPolicy: 'block' },
)`}
        </CodeBlock>
        <Callout title="identity는 업무 ID입니다">
          임의의 렌더링 ID가 아니라 여러 호출부가 같은 작업이라고 합의할 수 있는 uploadId, exportId
          같은 값을 사용합니다.
        </Callout>
      </section>

      <section id="update-progress">
        <h2>2. 같은 Handle 갱신</h2>
        <CodeBlock label="LOCAL FLOW">
          {`upload.update({
  uploadId,
  fileName,
  uploadedBytes,
  totalBytes,
})`}
        </CodeBlock>
        <p>
          Handle을 보유한 같은 로컬 흐름에서는 <code>upload.update()</code>가 가장 직접적입니다.
          WebSocket listener처럼 다른 호출부에 Handle이 없다면 같은 definition과 identity로{' '}
          <code>openOrUpdate()</code>를 다시 호출할 수 있습니다.
        </p>
      </section>

      <section id="settle-progress">
        <h2>3. 최종 outcome 기다리기</h2>
        <CodeBlock label="COMPLETE FLOW">
          {`const upload = overlay.openOrUpdate(
  uploadProgress,
  uploadId,
  initialInput,
  { dismissPolicy: 'block' },
)

upload.update(nextInput)

const outcome = await upload`}
        </CodeBlock>
        <ContractList>
          <li>같은 활성 작업은 Handle과 Renderer component instance를 재사용합니다.</li>
          <li>종료된 Handle의 update는 false이며 세션을 다시 만들지 않습니다.</li>
          <li>작업이 끝난 뒤 같은 identity로 다시 호출하면 새 세션을 만듭니다.</li>
          <li>활성 세션이 사용하는 group은 도중에 변경할 수 없습니다.</li>
        </ContractList>
      </section>
    </DocPage>
  )
}

export function ToastRecipePage() {
  return (
    <DocPage
      description="Toast는 Lyrd가 그리는 내장 UI가 아니라, 애플리케이션이 소유하는 adapter와 helper의 조합입니다."
      eyebrow="RECIPE"
      title="App-owned Toast 연결하기"
    >
      <section id="contract">
        <h2>Recipe 계약</h2>
        <ContractList>
          <li>Toast definition, Base UI adapter와 CSS는 애플리케이션이 소유합니다.</li>
          <li>Toast는 명시적인 parallel group에서 열립니다.</li>
          <li>일반 호출부는 notify()와 notifyWithUndo() helper를 사용합니다.</li>
          <li>일반 Toast에는 openOrUpdate()를 사용하지 않습니다.</li>
        </ContractList>
        <CodeBlock label="TERMINAL">pnpm dlx @lyrd/cli add toast</CodeBlock>
      </section>

      <section id="group">
        <h2>명시적인 parallel group</h2>
        <CodeBlock label="TOAST GROUP">
          {`const toastGroup = defineOverlayGroup({
  strategy: 'parallel',
})

return overlay.open(appToast, input, {
  group: toastGroup,
})`}
        </CodeBlock>
        <p>
          Toast들은 서로 기다리지 않고, 기본 modal queue의 confirm이나 dialog도 막지 않습니다.
          Group은 단순 strategy 옵션이 아니라 같은 실행 공간을 공유하는 coordination boundary입니다.
        </p>
      </section>

      <section id="helpers">
        <h2>notify helper</h2>
        <CodeBlock label="APPLICATION">
          {`notify(overlay, {
  title: '저장했습니다.',
})

const action = await notifyWithUndo(overlay, {
  title: '문서를 삭제했습니다.',
  description: '실행 취소할 수 있습니다.',
})`}
        </CodeBlock>
        <p>
          Helper가 toastId, definition과 group을 숨기므로 일반 제품 코드가 adapter 세부사항을
          반복하지 않습니다. notifyWithUndo는 <code>'undo'</code> 또는 <code>'dismissed'</code>를
          반환하도록 앱에서 설계할 수 있습니다.
        </p>
      </section>

      <section id="identity">
        <h2>openOrUpdate는 언제 쓰나</h2>
        <Callout title="일반 Toast에는 사용하지 않습니다">
          “저장했습니다” 같은 알림은 각각 독립된 사건이므로 새로운 Toast로 엽니다. Progress
          Toast처럼 동일한 업무를 계속 갱신할 때만 stable identity와 openOrUpdate를 고려합니다.
        </Callout>
      </section>
    </DocPage>
  )
}
