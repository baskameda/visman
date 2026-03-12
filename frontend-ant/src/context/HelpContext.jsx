import React, { createContext, useContext, useState, useCallback } from 'react'

const HelpContext = createContext(null)

export function HelpProvider({ children }) {
  const [sections, setSections] = useState(null)
  const setHelp   = useCallback(s  => setSections(s),   [])
  const clearHelp = useCallback(()  => setSections(null), [])
  return (
    <HelpContext.Provider value={{ sections, setHelp, clearHelp }}>
      {children}
    </HelpContext.Provider>
  )
}

export function useHelp() { return useContext(HelpContext) }
