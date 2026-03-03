import en from "../../../../../../Downloads/label-edit-feature/src/i18n/locales/en.json"
import de from "../../../../../../Downloads/label-edit-feature/src/i18n/locales/de.json"
import it from "../../../../../../Downloads/label-edit-feature/src/i18n/locales/it.json"
import fr from "../../../../../../Downloads/label-edit-feature/src/i18n/locales/fr.json"
import zh from "../../../../../../Downloads/label-edit-feature/src/i18n/locales/zh.json"
import ru from "../../../../../../Downloads/label-edit-feature/src/i18n/locales/ru.json"

const BASE = { en, de, it, fr, zh, ru }

const STORAGE_KEY = (lang) => "i18n_overrides:" + lang

// ─── Read / write overrides from localStorage ──────────────────────────────────
export function getOverrides(lang) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(lang))
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveOverride(lang, key, value) {
  const map = getOverrides(lang)
  map[key] = value
  localStorage.setItem(STORAGE_KEY(lang), JSON.stringify(map))
}

export function deleteOverride(lang, key) {
  const map = getOverrides(lang)
  delete map[key]
  localStorage.setItem(STORAGE_KEY(lang), JSON.stringify(map))
}

// ─── Get the original (non-overridden) value for a dotted key ─────────────────
export function getBaseValue(lang, key) {
  const bundle = BASE[lang] || BASE.en
  return key.split(".").reduce((o, k) => (o != null ? o[k] : null), bundle) ?? key
}

// ─── Convert flat { "a.b": "v" } → nested { a: { b: "v" } } ──────────────────
export function flatToNested(flat) {
  const root = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".")
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] = node[parts[i]] ?? {}
      node = node[parts[i]]
    }
    node[parts[parts.length - 1]] = value
  }
  return root
}

// ─── Apply stored overrides for a language into an i18next instance ────────────
export function applyOverrides(i18n, lang) {
  const overrides = getOverrides(lang)
  if (Object.keys(overrides).length === 0) return
  i18n.addResourceBundle(lang, "translation", flatToNested(overrides), true, true)
}
