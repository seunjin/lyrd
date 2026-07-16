import { Dialog } from '@base-ui/react/dialog'
import { ExternalLink, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { docsSections } from '../docs-manifest'

function NavigationItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {docsSections.map((section) => (
        <section className="docs-nav-section" key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                  onClick={onNavigate}
                  to={item.path}
                >
                  {item.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

export function DocsSidebar() {
  return (
    <aside aria-label="문서 내비게이션" className="docs-sidebar">
      <div className="docs-sidebar-inner">
        <p className="docs-sidebar-kicker">DOCUMENTATION</p>
        <NavigationItems />
        <NavLink className="docs-playground-link" to="/playground">
          Playground <ExternalLink aria-hidden size={14} strokeWidth={2} />
        </NavLink>
      </div>
    </aside>
  )
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger aria-label="문서 메뉴 열기" className="mobile-nav-trigger">
        <Menu aria-hidden size={22} strokeWidth={2} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="mobile-nav-backdrop" />
        <Dialog.Viewport className="mobile-nav-viewport">
          <Dialog.Popup className="mobile-nav-popup">
            <div className="mobile-nav-heading">
              <Dialog.Title>문서 탐색</Dialog.Title>
              <Dialog.Close aria-label="문서 메뉴 닫기" className="mobile-nav-close">
                <X aria-hidden size={22} strokeWidth={2} />
              </Dialog.Close>
            </div>
            <nav aria-label="모바일 문서 내비게이션" className="mobile-nav-content">
              <Link className="mobile-home-link" onClick={() => setOpen(false)} to="/">
                Home
              </Link>
              <NavigationItems onNavigate={() => setOpen(false)} />
              <NavLink
                className="docs-playground-link"
                onClick={() => setOpen(false)}
                to="/playground"
              >
                Playground <ExternalLink aria-hidden size={14} strokeWidth={2} />
              </NavLink>
            </nav>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
