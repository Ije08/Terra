"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "./LanguageProvider"
import styles from "./TerraStartScreen.module.css"

const POSITION_KEY = "terra-start-title-position"
const DESIGN_WIDTH = 1600
const DESIGN_HEIGHT = 900
const DEFAULT_POSITION = { x: 39, y: 39 }
type Position = typeof DEFAULT_POSITION

function clampPosition(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function readPosition(raw: string | null): Position {
  if (!raw) return DEFAULT_POSITION

  try {
    const saved = JSON.parse(raw) as Partial<Position>
    if (typeof saved.x !== "number" || typeof saved.y !== "number") return DEFAULT_POSITION

    // Previous builds stored viewport units (vw/vh). Convert them once to the
    // fixed 1600×900 game canvas so letterboxed and incognito views agree.
    return {
      x: clampPosition((saved.x * window.innerWidth) / DESIGN_WIDTH),
      y: clampPosition((saved.y * window.innerHeight) / DESIGN_HEIGHT),
    }
  } catch {
    localStorage.removeItem(POSITION_KEY)
    return DEFAULT_POSITION
  }
}

export function MovableStartTitle({ onConnect }: { readonly onConnect: () => void }) {
  const { language } = useLanguage()
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setPosition(readPosition(localStorage.getItem(POSITION_KEY)))
      } catch { localStorage.removeItem(POSITION_KEY) }
      setReady(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section className={`${styles.titleOnly} ${ready ? styles.titleReady : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }}>
      <div className={`${styles.brandLockup} ${ready ? styles.textFocusIn : ""}`}>
        <span className={styles.titleWordmark}>FIRST LIGHT</span>
        <span className={styles.titleRule} aria-hidden="true"><i /><b>✦</b><i /></span>
        <span className={styles.titleSubmark}>TERRA</span>
      </div>
      <div className={`${styles.authActions} ${ready ? styles.scaleInVerCenter : ""}`} aria-label="접속 메뉴">
        <button className={styles.loginButton} type="button" onClick={onConnect}>{language === "ko" ? "테라 접속" : "ENTER TERRA"}</button>
      </div>
    </section>
  )
}
