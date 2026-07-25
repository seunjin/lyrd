'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ConsumerLabDialog } from '../../overlays/dialogs/consumer-lab/ConsumerLabDialog'
import { useOverlay } from '../../overlays/scope'

export function OverlayLab() {
  const overlay = useOverlay()
  const router = useRouter()
  const [result, setResult] = useState('idle')

  useEffect(() => () => overlay.closeAll('route-change'), [overlay])

  function openAlert() {
    setResult('alert:waiting')
    void overlay
      .alert({
        title: 'Next hydrated alert',
        onAction: () => setResult('alert:action'),
      })
      .then(() => setResult((current) => `${current}:resolved`))
  }

  function openAndNavigate() {
    const handle = overlay.open(<ConsumerLabDialog title="Route cleanup dialog" />)
    void handle.then((outcome) => {
      sessionStorage.setItem('lyrd-route-outcome', JSON.stringify(outcome))
    })
    window.setTimeout(() => router.push('/other'), 250)
  }

  return (
    <section>
      <button data-testid="next-alert" onClick={openAlert} type="button">
        Open hydrated alert
      </button>
      <button data-testid="open-and-navigate" onClick={openAndNavigate} type="button">
        Open and navigate
      </button>
      <output data-testid="next-result">{result}</output>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/other">Other</Link>
      </nav>
    </section>
  )
}
