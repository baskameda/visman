import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

export default function Tx({ k, vars }) {
  const { t, i18n } = useTranslation()
  const [editMode, setEditMode] = useState(() => window.__labelEditMode ?? false)

  useEffect(() => {
    const handler = (e) => setEditMode(e.detail)
    window.addEventListener("labelEditModeChange", handler)
    return () => window.removeEventListener("labelEditModeChange", handler)
  }, [])

  const text = t(k, vars)
  if (!editMode) return text

  const handleClick = (e) => {
    e.stopPropagation()
    const next = window.prompt("Edit label [" + k + "]:", text)
    if (next === null) return
    try {
      const sk = "i18n_overrides:" + i18n.language
      const ov = JSON.parse(localStorage.getItem(sk) || "{}")
      ov[k] = next
      localStorage.setItem(sk, JSON.stringify(ov))
      const parts = k.split(".")
      const nested = {}
      let node = nested
      for (let i = 0; i < parts.length - 1; i++) { node[parts[i]] = {}; node = node[parts[i]] }
      node[parts[parts.length - 1]] = next
      i18n.addResourceBundle(i18n.language, "translation", nested, true, true)
    } catch(err) { console.error("Tx", err) }
  }

  let isCustom = false
  try {
    isCustom = k in JSON.parse(localStorage.getItem("i18n_overrides:" + i18n.language) || "{}")
  } catch {}

  return (
    <span onClick={handleClick} title={"Edit: " + k} style={{
      cursor: "pointer",
      outline: isCustom ? "2px solid #faad14" : "1.5px dashed #1677ff",
      outlineOffset: 2, borderRadius: 3,
      backgroundColor: isCustom ? "rgba(250,173,20,0.08)" : "rgba(22,119,255,0.05)",
      padding: "0 2px", display: "inline",
    }}>{text}</span>
  )
}
