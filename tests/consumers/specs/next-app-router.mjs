import assert from 'node:assert/strict'

import { assertHealthyPage, collectBrowserErrors } from './browser-errors.mjs'

export async function verifyNextConsumer(page, baseUrl) {
  const errors = collectBrowserErrors(page)

  await page.goto(`${baseUrl}/lab`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Next overlay lab' }).waitFor({ state: 'visible' })
  await page.getByTestId('next-alert').click()
  await page.getByText('Next hydrated alert', { exact: true }).waitFor({ state: 'visible' })
  await page.getByRole('button', { name: '확인' }).click()
  await page.getByTestId('next-result').waitFor({ state: 'visible' })
  assert.equal(await page.getByTestId('next-result').innerText(), 'alert:resolved')
  await page.getByText('Next hydrated alert', { exact: true }).waitFor({ state: 'hidden' })

  await page.getByTestId('open-and-navigate').click()
  await page.getByText('Route cleanup dialog', { exact: true }).waitFor({ state: 'visible' })
  await page.waitForURL(`${baseUrl}/other`)
  await page.getByRole('heading', { name: 'Next other route' }).waitFor({ state: 'visible' })
  await page.getByText('Route cleanup dialog', { exact: true }).waitFor({ state: 'hidden' })
  await page.waitForFunction(() => sessionStorage.getItem('lyrd-route-outcome') !== null)
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('lyrd-route-outcome') ?? 'null')),
    { status: 'dismissed', reason: 'route-change' },
  )

  await page.getByRole('link', { name: 'Back to lab' }).click()
  await page.waitForURL(`${baseUrl}/lab`)
  await page.getByRole('link', { name: 'Home' }).click()
  await page.waitForURL(`${baseUrl}/`)
  await page.getByRole('heading', { name: 'Lyrd Next consumer' }).waitFor({ state: 'visible' })

  await assertHealthyPage(page, errors)
}
