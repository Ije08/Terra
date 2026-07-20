"use client"

import { useEffect, useState, type FormEvent } from "react"
import styles from "./TerraAuthPanel.module.css"

export type AuthMode = "login" | "signup"

interface TerraAuthPanelProps {
  readonly initialMode: AuthMode
  readonly onClose: () => void
  readonly onLogin: () => void
  readonly onCreateAccount: () => void
}

interface ChatGPTIdentity {
  readonly displayName: string
  readonly email: string
}

const CHATGPT_AUTH_ENABLED = process.env.NEXT_PUBLIC_CHATGPT_AUTH_ENABLED === "true"

export function TerraAuthPanel({ initialMode, onClose, onLogin, onCreateAccount }: TerraAuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [chatGPTUser, setChatGPTUser] = useState<ChatGPTIdentity | null>(null)

  useEffect(() => {
    if (!CHATGPT_AUTH_ENABLED) return
    void fetch("/api/auth/chatgpt", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ user: ChatGPTIdentity | null }> : { user: null })
      .then(({ user }) => setChatGPTUser(user))
      .catch(() => setChatGPTUser(null))
  }, [])

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError("")
    setShowPassword(false)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirmation = String(form.get("password-confirmation") ?? "")
    if (mode === "signup" && password !== confirmation) {
      setError("비밀번호 확인이 일치하지 않습니다.")
      return
    }
    if (mode === "login") onLogin()
    else onCreateAccount()
  }

  return (
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className={styles.closeButton} type="button" onClick={onClose} aria-label="계정 창 닫기">×</button>
      <aside className={styles.signalRail} aria-labelledby="game-intro-title">
        <span className={styles.railIndex}>게임 소개</span>
        <div className={styles.railCopy}>
          <strong id="game-intro-title">작은 행동이 다시<br />사람을 잇습니다.</strong>
          <p>온라인에서는 익명성이 말을 거칠게 만들고, 현실에서는 경계 때문에 먼저 다가가기 어렵습니다.</p>
          <p>테라는 작은 행동과 대화를 공동 세계의 변화로 남겨, 부담 없이 만나고 협력할 수 있게 합니다.</p>
          <ul className={styles.railFeatures}>
            <li>광장을 탐사하고 자원 수집</li>
            <li>다른 탐사대원과 교류</li>
            <li>함께 건설하고 항로 복구</li>
          </ul>
        </div>
        <span className={styles.coordinates}>함께 만든 변화가 다음 항로를 엽니다.</span>
      </aside>

      <div className={styles.formSide}>
        <div className={styles.modeTabs} role="tablist" aria-label="계정 모드">
          <button className={mode === "login" ? styles.activeTab : ""} type="button" role="tab" aria-selected={mode === "login"} onClick={() => selectMode("login")}>로그인</button>
          <button className={mode === "signup" ? styles.activeTab : ""} type="button" role="tab" aria-selected={mode === "signup"} onClick={() => selectMode("signup")}>계정 생성</button>
        </div>

        <header className={styles.formHeader}>
          <h2 id="auth-title">{mode === "login" ? "다시 만나 반가워요" : "첫 탐사를 준비하세요"}</h2>
          <p>{mode === "login" ? "등록한 계정으로 로그인하세요." : "계정을 만든 뒤 탐사대원의 모습을 설정합니다."}</p>
        </header>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            <span>아이디 또는 이메일</span>
            <input name="identifier" type="text" autoComplete="username" placeholder="아이디 또는 이메일 입력" required autoFocus />
          </label>
          <label className={styles.field}>
            <span>비밀번호</span>
            <span className={styles.passwordField}>
              <input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="8자 이상 입력" minLength={8} required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>{showPassword ? "숨김" : "보기"}</button>
            </span>
          </label>
          {mode === "signup" ? (
            <label className={styles.field}>
              <span>비밀번호 확인</span>
              <input name="password-confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="한 번 더 입력" minLength={8} required />
            </label>
          ) : (
            <label className={styles.remember}><input type="checkbox" name="remember" /> <span>이 기기에서 계정 신호 기억하기</span></label>
          )}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.primaryButton} type="submit">{mode === "login" ? "로그인" : "계정 생성"}</button>
        </form>

        <div className={styles.divider}><span>또는</span></div>
        {chatGPTUser ? (
          <button className={styles.chatGPTButton} type="button" onClick={onLogin}><span className={styles.openAiMark}>✦</span><span><strong>챗지피티 계정으로 로그인</strong><small>{chatGPTUser.email}</small></span></button>
        ) : CHATGPT_AUTH_ENABLED ? (
          <a className={styles.chatGPTButton} href="/signin-with-chatgpt?return_to=%2F"><span className={styles.openAiMark}>✦</span><span><strong>챗지피티로 계속하기</strong><small>오픈에이아이 계정으로 안전하게 연결</small></span></a>
        ) : (
          <button className={`${styles.chatGPTButton} ${styles.disabled}`} type="button" disabled><span className={styles.openAiMark}>✦</span><span><strong>챗지피티로 계속하기</strong><small>사이트 배포 후 사용 가능</small></span></button>
        )}
        <p className={styles.prototypeNote}>현재 로컬 계정 입력은 화면 흐름 검증용이며 입력값과 비밀번호를 저장하지 않습니다.</p>
      </div>
    </section>
  )
}
