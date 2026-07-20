"use client"

import { useEffect, useState } from "react"
import styles from "./TerraStartScreen.module.css"

const POSITION_KEY = "terra-start-title-position"
const DEFAULT_POSITION = { x: 4, y: 52 }
type Position = typeof DEFAULT_POSITION

export function MovableStartTitle({ onConnect }: { readonly onConnect: () => void }) {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(POSITION_KEY) ?? "null") as Partial<Position> | null
        if (typeof saved?.x === "number" && typeof saved.y === "number") setPosition({ x: saved.x, y: saved.y })
      } catch { localStorage.removeItem(POSITION_KEY) }
      setReady(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section className={`${styles.titleOnly} ${ready ? styles.titleReady : ""}`} style={{ transform: `translate3d(${position.x}vw, ${position.y}vh, 0)` }}>
      <div className={styles.brandLockup}>
        <span className={styles.titleWordmark}>FIRST LIGHT</span>
        <span className={styles.titleRule} aria-hidden="true"><i /><b>✦</b><i /></span>
        <span className={styles.titleSubmark}>TERRA</span>
      </div>
      <div className={styles.authActions} aria-label="접속 메뉴">
        <button className={styles.loginButton} type="button" onClick={onConnect}>테라 접속</button>
      </div>
    </section>
  )
}
