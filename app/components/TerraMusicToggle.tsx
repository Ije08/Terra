"use client"

import styles from "./TerraMusicToggle.module.css"

interface TerraMusicToggleProps {
  readonly enabled: boolean
  readonly onToggle: () => void
}

export function TerraMusicToggle({ enabled, onToggle }: TerraMusicToggleProps) {
  return <button className={styles.toggle} type="button" onClick={onToggle} aria-pressed={enabled} aria-label={enabled ? "BGM 끄기" : "BGM 켜기"} title={enabled ? "BGM 끄기" : "BGM 켜기"}>
    <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="M4 8.2v3.6h3l4 3V5.2l-4 3H4Z" /><path className={enabled ? styles.wave : styles.muted} d={enabled ? "M14 7.5a3.5 3.5 0 0 1 0 5" : "m14 8 3 4"} /></svg></span>
    <span className={styles.status}>{enabled ? "ON" : "OFF"}</span>
  </button>
}
