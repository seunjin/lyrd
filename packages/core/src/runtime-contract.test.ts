import { describe, it } from 'vitest'

describe('RFC 0004 runtime contract', () => {
  it.todo('마지막에 열린 session을 먼저 닫는 LIFO stack을 유지한다')
  it.todo('부모 custom overlay에서 await한 Confirm을 위에 열어도 교착되지 않는다')
  it.todo('closing top에서 반복 close가 아래 session으로 전달되지 않는다')
  it.todo('handle.close가 top 여부와 관계없이 정확한 session을 닫는다')
  it.todo('closeAll이 모든 session을 같은 reason으로 완료한다')
  it.todo('custom resolve와 close를 서로 다른 OverlayOutcome으로 반환한다')
  it.todo('Alert action이 동기 onAction을 실행하고 programmatic close는 실행하지 않는다')
  it.todo('Confirm이 pending, error와 같은 onConfirm 재시도를 관리한다')
})
