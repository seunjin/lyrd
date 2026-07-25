import assert from 'node:assert/strict'

import { assertHealthyPage, collectBrowserErrors } from './browser-errors.mjs'

async function expectText(locator, expected) {
  await locator.waitFor({ state: 'visible' })
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    if ((await locator.innerText()) === expected) return
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  assert.equal(await locator.innerText(), expected)
}

function dialogWithText(page, text) {
  return page.locator('[role="dialog"], [role="alertdialog"]').filter({ hasText: text })
}

export async function verifyViteConsumer(page, baseUrl) {
  const errors = collectBrowserErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await expectText(page.getByRole('heading', { name: 'Lyrd Vite consumer' }), 'Lyrd Vite consumer')

  await page.getByTestId('open-alert').click()
  await dialogWithText(page, 'Alert contract').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '확인' }).click()
  await expectText(page.getByTestId('alert-result'), 'action:resolved')
  await dialogWithText(page, 'Alert contract').waitFor({ state: 'hidden' })

  await page.getByTestId('open-confirm').click()
  await dialogWithText(page, 'Pending confirm').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '저장' }).click()
  const pendingButton = page.getByRole('button', { name: '처리 중' })
  await pendingButton.waitFor({ state: 'visible' })
  assert.equal(await pendingButton.isDisabled(), true)
  await expectText(page.getByTestId('confirm-result'), 'true')
  await dialogWithText(page, 'Pending confirm').waitFor({ state: 'hidden' })

  await page.getByTestId('open-cancel-confirm').click()
  await dialogWithText(page, 'Cancel confirm').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '취소' }).click()
  await expectText(page.getByTestId('cancel-result'), 'callback:true,result:false')
  await dialogWithText(page, 'Cancel confirm').waitFor({ state: 'hidden' })

  await page.getByTestId('open-retry-confirm').click()
  const retryDialog = dialogWithText(page, 'Retry confirm')
  await retryDialog.waitFor({ state: 'visible' })
  await retryDialog.getByRole('button', { name: '재시도' }).click()
  await retryDialog.getByRole('alert').waitFor({ state: 'visible' })
  assert.match(await retryDialog.getByRole('alert').innerText(), /first attempt failed/)
  await retryDialog.getByRole('button', { name: '재시도' }).click()
  await expectText(page.getByTestId('retry-result'), 'result:true,attempts:2')
  await retryDialog.waitFor({ state: 'hidden' })

  await page.getByTestId('open-custom').click()
  const customDialog = dialogWithText(page, 'Custom result dialog')
  await customDialog.waitFor({ state: 'visible' })
  await customDialog.getByRole('button', { name: '완료' }).click()
  await expectText(page.getByTestId('custom-result'), 'resolved:true')
  await customDialog.waitFor({ state: 'hidden' })

  await page.getByTestId('open-nested').click()
  const parentDialog = dialogWithText(page, 'Nested parent dialog')
  await parentDialog.waitFor({ state: 'visible' })
  await parentDialog.getByTestId('open-nested-confirm').click()
  const nestedConfirm = page.getByRole('alertdialog', { name: 'Nested confirm' })
  await nestedConfirm.waitFor({ state: 'visible' })
  await nestedConfirm.getByRole('button', { name: '중첩 확인' }).click()
  await expectText(page.getByTestId('nested-result'), 'true')
  await parentDialog.waitFor({ state: 'visible' })
  await parentDialog.getByRole('button', { name: '완료' }).click()
  await expectText(page.getByTestId('nested-outer-result'), 'resolved')
  await parentDialog.waitFor({ state: 'hidden' })

  await page.getByTestId('open-close-stack').click()
  const handleDialog = dialogWithText(page, 'Handle close target')
  const clientDialog = dialogWithText(page, 'Client close target')
  await handleDialog.waitFor({ state: 'visible' })
  await clientDialog.waitFor({ state: 'visible' })
  await clientDialog.getByTestId('handle-close').click()
  await expectText(page.getByTestId('handle-close-result'), 'cancel')
  await handleDialog.waitFor({ state: 'hidden' })
  await clientDialog.waitFor({ state: 'visible' })
  await clientDialog.getByTestId('client-close').click()
  await expectText(page.getByTestId('client-close-result'), 'programmatic')
  await clientDialog.waitFor({ state: 'hidden' })

  await page.getByTestId('open-close-all').click()
  const closeAllLower = dialogWithText(page, 'Close all lower')
  const closeAllTop = dialogWithText(page, 'Close all top')
  await closeAllLower.waitFor({ state: 'visible' })
  await closeAllTop.waitFor({ state: 'visible' })
  await closeAllTop.getByTestId('client-close-all').click()
  await expectText(page.getByTestId('close-all-result'), 'route-change,route-change')
  await closeAllLower.waitFor({ state: 'hidden' })
  await closeAllTop.waitFor({ state: 'hidden' })

  await assertHealthyPage(page, errors)
}
