import assert from 'node:assert/strict'

import { assertHealthyPage, collectBrowserErrors } from './browser-errors.mjs'

async function expectText(locator, expected) {
  await locator.waitFor({ state: 'visible' })
  assert.equal(await locator.innerText(), expected)
}

export async function verifyViteConsumer(page, baseUrl) {
  const errors = collectBrowserErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await expectText(page.getByRole('heading', { name: 'Lyrd Vite consumer' }), 'Lyrd Vite consumer')

  await page.getByTestId('open-alert').click()
  await page.getByText('Alert contract', { exact: true }).waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '확인' }).click()
  await expectText(page.getByTestId('alert-result'), 'resolved')
  await page.getByText('Alert contract', { exact: true }).waitFor({ state: 'hidden' })

  await page.getByTestId('open-confirm').click()
  await page.getByText('Confirm contract', { exact: true }).waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '진행' }).click()
  await expectText(page.getByTestId('confirm-result'), 'true')
  await page.getByText('Confirm contract', { exact: true }).waitFor({ state: 'hidden' })

  await page.getByTestId('open-confirm').click()
  await page.getByText('Confirm contract', { exact: true }).waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '취소' }).click()
  await expectText(page.getByTestId('confirm-result'), 'false')
  await page.getByText('Confirm contract', { exact: true }).waitFor({ state: 'hidden' })

  await page.getByTestId('start-queue').click()
  const firstQueueTitle = page.getByText('Queue first', { exact: true })
  const secondQueueTitle = page.getByText('Queue second', { exact: true })
  await firstQueueTitle.waitFor({ state: 'visible' })
  assert.equal(await secondQueueTitle.count(), 0, '두 번째 modal은 queue에서 기다려야 합니다.')
  await page.getByRole('button', { name: '완료' }).click()
  await page
    .locator('[role="dialog"][data-ending-style]')
    .filter({ hasText: 'Queue first' })
    .waitFor({ state: 'attached' })
  assert.equal(
    await secondQueueTitle.count(),
    0,
    'outcome resolve 뒤 completeExit 전에는 다음 modal이 진입하면 안 됩니다.',
  )
  await secondQueueTitle.waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '완료' }).click()
  await expectText(page.getByTestId('queue-result'), 'resolved:true,resolved:true')
  await secondQueueTitle.waitFor({ state: 'hidden' })

  await page.getByTestId('start-handle').click()
  await expectText(page.getByTestId('handle-result'), 'awaitable:true')
  await page.getByText('Handle before update', { exact: true }).waitFor({ state: 'visible' })
  await page.getByTestId('dialog-update-handle').click()
  await expectText(page.getByTestId('handle-result'), 'updated:true')
  await page.getByText('Handle after update', { exact: true }).waitFor({ state: 'visible' })
  await page.getByTestId('dialog-dismiss-handle').click()
  await expectText(page.getByTestId('handle-result'), 'dismissed:programmatic')
  await page.getByText('Handle after update', { exact: true }).waitFor({ state: 'hidden' })

  await page.getByTestId('start-identity').click()
  await expectText(page.getByTestId('identity-result'), 'same:true')
  await page.getByText('Identity after update', { exact: true }).waitFor({ state: 'visible' })
  await page.getByTestId('dialog-dismiss-identity').click()
  await expectText(page.getByTestId('identity-result'), 'dismissed:programmatic')
  await page.getByText('Identity after update', { exact: true }).waitFor({ state: 'hidden' })

  await page.getByTestId('start-toasts').click()
  await expectText(page.getByTestId('toast-result'), 'opened:2')
  await page.getByText('Parallel toast one', { exact: true }).waitFor({ state: 'visible' })
  await page.getByText('Parallel toast two', { exact: true }).waitFor({ state: 'visible' })
  await page.getByTestId('dismiss-all').click()
  await expectText(
    page.getByTestId('toast-result'),
    'dismissed:programmatic,dismissed:programmatic',
  )
  assert.ok(
    (await page.locator('[data-ending-style]').filter({ hasText: 'Parallel toast' }).count()) > 0,
    'parallel session은 outcome 뒤 exit animation이 끝날 때까지 렌더링되어야 합니다.',
  )
  await page.getByText('Parallel toast one', { exact: true }).waitFor({ state: 'hidden' })
  await page.getByText('Parallel toast two', { exact: true }).waitFor({ state: 'hidden' })

  await assertHealthyPage(page, errors)
}
