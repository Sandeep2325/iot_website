import { useEffect } from 'react'

const APP_NAME = 'PartScout'

/** Sets the browser tab title, e.g. "Parts list · PartScout". */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} · IoT Parts Prices`
  }, [title])
}
