import assert from 'node:assert/strict'

export function collectBrowserErrors(page) {
  const errors = []

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

  return errors
}

export async function assertHealthyPage(page, errors) {
  const bodyText = await page.locator('body').innerText()
  assert.notEqual(bodyText.trim(), '', '브라우저가 빈 페이지를 렌더링했습니다.')
  assert.equal(
    await page
      .locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')
      .count(),
    0,
    'framework error overlay가 없어야 합니다.',
  )
  assert.doesNotMatch(bodyText, /Hydration failed|hydration error/i)
  assert.deepEqual(errors, [], `브라우저 오류가 없어야 합니다.\n${errors.join('\n')}`)
}
