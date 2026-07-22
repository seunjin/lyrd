'use client'

import { useOverlay } from '@lyrd/core'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { consumerLabDialog } from '../../overlays/dialogs/consumer-lab/ConsumerLabDialog'
import { notify } from '../../overlays/toast/notify'

export function OverlayLab() {
  const overlay = useOverlay()
  const router = useRouter()
  const [result, setResult] = useState('idle')

  useEffect(() => () => overlay.dismissAll('route-change'), [overlay])

  function openAlert() {
    void overlay.alert({ title: 'Next hydrated alert' }).then(() => setResult('alert:resolved'))
  }

  function openAndNavigate() {
    const handle = overlay.open(consumerLabDialog, { title: 'Route cleanup dialog' })
    void handle.then((outcome) => {
      sessionStorage.setItem('lyrd-route-outcome', JSON.stringify(outcome))
    })
    window.setTimeout(() => router.push('/other'), 250)
  }

  function openToast() {
    notify(overlay, {
      title: 'Tailwind CSS v4 toast',
      description: 'Base UI 공식 hero 예제의 stack 스타일입니다.',
    })
  }

  return (
    <section>
      <button data-testid="next-alert" onClick={openAlert} type="button">
        Open hydrated alert
      </button>
      <button data-testid="open-and-navigate" onClick={openAndNavigate} type="button">
        Open and navigate
      </button>
      <button data-testid="next-toast" onClick={openToast} type="button">
        Open Tailwind toast
      </button>
      <output data-testid="next-result">{result}</output>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/other">Other</Link>
      </nav>
    </section>
  )
}
