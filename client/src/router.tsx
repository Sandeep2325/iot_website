import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteError } from '@/components/layout/RouteError'

/** Each page is its own chunk, loaded when first visited (keeps the charting library out of the first download). */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      {
        // Page crashes render inside the layout, so navigation keeps working.
        errorElement: <RouteError />,
        children: [
          { index: true, lazy: page(() => import('@/pages/DashboardPage')) },
          { path: 'search', lazy: page(() => import('@/pages/SearchPage')) },
          { path: 'parts/:partId', lazy: page(() => import('@/pages/PartDetailPage')) },
          { path: 'compare', lazy: page(() => import('@/pages/ComparePage')) },
          { path: 'bom', lazy: page(() => import('@/pages/BomPage')) },
          { path: 'watchlist', lazy: page(() => import('@/pages/WatchlistPage')) },
          { path: 'settings', lazy: page(() => import('@/pages/SettingsPage')) },
          { path: '*', lazy: page(() => import('@/pages/NotFoundPage')) },
        ],
      },
    ],
  },
])
