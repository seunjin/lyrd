import type { PlaygroundDemoId } from './playground-events'

export type PlaygroundDemo = {
  code: string
  description: string
  docLabel: string
  docPath: string
  id: PlaygroundDemoId
  index: string
  title: string
}

export const playgroundDemos = [
  {
    id: 'alert',
    index: '01',
    title: 'Alert',
    description: '내용을 인지하고 action으로 void 완료합니다.',
    docLabel: 'Alert API',
    docPath: '/api/application#alert',
    code: `await overlay.alert({
  title: '배포 준비가 완료되었습니다.',
  description: '필수 품질 게이트가 모두 통과했습니다.',
  actionLabel: '확인',
})`,
  },
  {
    id: 'confirm',
    index: '02',
    title: 'Confirm',
    description: '확인 또는 취소를 boolean 결과로 받습니다.',
    docLabel: 'Confirm API',
    docPath: '/api/application#confirm',
    code: `const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  tone: 'danger',
})`,
  },
  {
    id: 'async-confirm',
    index: '03',
    title: 'Async Confirm',
    description: '첫 요청 실패, error 표시와 같은 action 재시도를 확인합니다.',
    docLabel: 'Async Confirm recipe',
    docPath: '/recipes/async-confirm',
    code: `let attempts = 0

const confirmed = await overlay.confirm({
  title: '변경사항을 배포할까요?',
  onConfirm: async () => {
    attempts += 1
    if (attempts === 1) {
      await wait(500)
      throw new Error('데모용 실패')
    }
    await deploy()
  },
})`,
  },
  {
    id: 'custom',
    index: '04',
    title: 'Custom Dialog',
    description: '입력 state를 내부에서 소유하고 typed outcome을 반환합니다.',
    docLabel: 'Form state recipe',
    docPath: '/recipes/form-state',
    code: `const outcome = await overlay.open<DialogResult>(
  <ProjectDialog projectId="lyrd-docs" />,
)

if (outcome.status === 'resolved') {
  updateName(outcome.value.name)
}`,
  },
  {
    id: 'nested',
    index: '05',
    title: 'Nested Confirm',
    description: '입력 중인 Dialog 위에 Confirm을 push하고 LIFO로 돌아옵니다.',
    docLabel: 'Nested Confirm recipe',
    docPath: '/recipes/nested-confirm',
    code: `const outcome = await overlay.open<DialogResult>(
  <ProjectDialog projectId="lyrd-docs" nested />,
)

// Dialog 내부
const confirmed = await overlay.confirm({
  title: '이름을 초기화할까요?',
})`,
  },
] as const satisfies readonly PlaygroundDemo[]

export function findPlaygroundDemo(id: PlaygroundDemoId): PlaygroundDemo {
  return playgroundDemos.find((demo) => demo.id === id) ?? playgroundDemos[0]
}
