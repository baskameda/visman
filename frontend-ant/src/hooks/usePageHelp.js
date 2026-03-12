import { useEffect } from 'react'
import { useHelp } from '../context/HelpContext'

/**
 * Register contextual help sections for the current page.
 * Sections are an array of { title: string, items: string[] }.
 * Content is cleared automatically when the page unmounts.
 */
export function usePageHelp(sections) {
  const { setHelp, clearHelp } = useHelp()
  useEffect(() => {
    setHelp(sections)
    return clearHelp
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
