import { useEffect, useRef } from 'react'
import { Bell, Cpu, GitCompareArrows, LayoutDashboard, ListChecks, Search, Settings, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { useWatchStatus } from '@/lib/useWatchStatus'
import { DataSourceNote } from './DataSourceNote'
import { cn } from '@/lib/utils'
import { useBom } from '@/store/bomStore'
import { useCompare } from '@/store/compareStore'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/search', label: 'Search parts', icon: Search },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/bom', label: 'Parts list (BOM)', icon: ListChecks },
  { to: '/watchlist', label: 'Watchlist', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { triggeredCount } = useWatchStatus()
  const bomCount = useBom((s) => s.items.length)
  const compareCount = useCompare((s) => s.partIds.length)
  const counts: Record<string, { value: number; label: string; alert?: boolean } | undefined> = {
    '/watchlist': triggeredCount ? { value: triggeredCount, label: 'at target price', alert: true } : undefined,
    '/bom': bomCount ? { value: bomCount, label: 'parts' } : undefined,
    '/compare': compareCount ? { value: compareCount, label: 'parts' } : undefined,
  }

  // Opening the mobile drawer moves focus into it; closing returns focus to the menu button.
  const closeButton = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open) closeButton.current?.focus()
    else if (wasOpen.current) document.getElementById('menu-button')?.focus()
    wasOpen.current = open
  }, [open])

  return (
    <>
      {/* Backdrop for the mobile drawer */}
      <div
        className={cn('fixed inset-0 z-30 bg-black/40 md:hidden', open ? 'block' : 'hidden')}
        onClick={onClose}
        aria-hidden
      />
      <aside
        aria-label="Sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-card md:visible md:sticky md:top-0 md:h-screen md:translate-x-0',
          // Closed on mobile, the drawer is also invisible so its links leave the Tab order. Visibility flips
          // instantly on open (so focus can move in) and only after the slide-out animation on close.
          open ? 'visible translate-x-0 transition-[translate]' : 'invisible -translate-x-full transition-[translate,visibility]',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold" onClick={onClose}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Cpu className="h-4 w-4" />
            </span>
            PartScout
          </NavLink>
          <button
            ref={closeButton}
            className="cursor-pointer rounded-md p-1 hover:bg-muted md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
              {counts[to] && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-1.5 text-xs font-medium tabular-nums',
                    counts[to].alert ? 'bg-success text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                  aria-label={`${counts[to].value} ${counts[to].label}`}
                >
                  {counts[to].value}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <DataSourceNote />
      </aside>
    </>
  )
}
