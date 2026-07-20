import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      <h1>Lyrd Next consumer</h1>
      <p>This page is rendered as a Server Component.</p>
      <Link href="/lab">Open client overlay lab</Link>
    </main>
  )
}
