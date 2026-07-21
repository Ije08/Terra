"use client"

import { useLanguage } from "./LanguageProvider"
import styles from "./LanguageToggle.module.css"

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()
  return <button className={styles.toggle} type="button" onClick={toggleLanguage} aria-label={language === "ko" ? "Switch to English" : "한국어로 전환"} title={language === "ko" ? "Switch to English" : "한국어로 전환"}><span className={language === "ko" ? styles.active : ""}>한</span><i aria-hidden="true">/</i><span className={language === "en" ? styles.active : ""}>EN</span></button>
}
