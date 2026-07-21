"use client"

import { MovableStartTitle } from "./MovableStartTitle"
import { LanguageToggle } from "./LanguageToggle"
import { TerraMusicToggle } from "./TerraMusicToggle"
import styles from "./TerraStartScreen.module.css"

interface TerraStartScreenProps {
  readonly onLogin: () => void
  readonly musicEnabled: boolean
  readonly onToggleMusic: () => void
}

export function TerraStartScreen({ onLogin, musicEnabled, onToggleMusic }: TerraStartScreenProps) {
  return (
    <main className={`start-screen ${styles.art}`}>
      <div className={styles.spaceBase} aria-hidden="true" />
      <div className={styles.nebulaLayer} aria-hidden="true" />
      <div className={styles.starField} aria-hidden="true" />
      <div className={styles.spaceEffects} aria-hidden="true">
        <div className={`${styles.effectStars} ${styles.effectStarsFar}`} />
        <div className={`${styles.effectStars} ${styles.effectStarsNear}`} />
        <div className={`${styles.effectStars} ${styles.effectStarsDense}`} />
        <div className={styles.brightStars}>
          <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
        </div>
        {[styles.cometOne, styles.cometTwo, styles.cometThree, styles.cometFour, styles.cometFive, styles.cometSix].map((variant) => (
          <div className={`${styles.cometTrack} ${variant}`} key={variant}><div className={styles.cometRunner}><div className={styles.comet}><span /></div></div></div>
        ))}
      </div>
      <div className={styles.planetLayer} aria-hidden="true" />
      <div className={styles.moonLayer} aria-hidden="true" />
      <div className={styles.sunCorona} aria-hidden="true" />
      <div className={styles.sunLayer} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.utilityControls}><LanguageToggle /><TerraMusicToggle enabled={musicEnabled} onToggle={onToggleMusic} /></div>
      <MovableStartTitle onConnect={onLogin} />
    </main>
  )
}
