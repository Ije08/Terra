"use client"

import { useLayoutEffect, useState, type ReactNode } from "react"
import styles from "./FixedGameCanvas.module.css"

const DESIGN_WIDTH = 1600
const DESIGN_HEIGHT = 900

export function FixedGameCanvas({ children }: Readonly<{ children: ReactNode }>) {
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const fitCanvas = () => {
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT))
    }

    fitCanvas()
    window.addEventListener("resize", fitCanvas)
    return () => window.removeEventListener("resize", fitCanvas)
  }, [])

  return (
    <div className={styles.viewport}>
      <div
        className={styles.canvas}
        style={{ transform: `scale(${scale})`, visibility: scale === 0 ? "hidden" : "visible" }}
      >
        {children}
      </div>
    </div>
  )
}
