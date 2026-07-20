"use client"

import { useEffect, useState } from "react"
import { CommunityBuildPanel, type ResourceInventory } from "./TerraCommandUi"
import type { TerminalTab } from "../game/types"
import styles from "./TerminalPanel.module.css"

interface TerminalPanelProps {
  readonly nickname: string
  readonly progress: number
  readonly resourceCount: number
  readonly resourceInventory: ResourceInventory
  readonly initialTab?: TerminalTab
  readonly onClose: () => void
}

const TABS: readonly { id: TerminalTab; label: string }[] = [
  { id: "map", label: "항로 지도" },
  { id: "build", label: "공동 건설" },
  { id: "missions", label: "미션" },
  { id: "news", label: "전광판·뉴스" },
  { id: "community", label: "커뮤니티" },
  { id: "chat", label: "전체 채팅" },
]

export function TerminalPanel({ nickname, progress, resourceCount, resourceInventory, initialTab = "map", onClose }: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<TerminalTab>(initialTab)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<readonly string[]>([
    "[탐사대] TERRA 광장에 새로운 신호가 감지되었습니다.",
    "[별바람] 오늘도 무사히 만나요.",
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  const sendMessage = () => {
    const nextMessage = message.trim()
    if (!nextMessage) return
    setMessages((previous) => [...previous, `[${nickname}] ${nextMessage}`])
    setMessage("")
  }

  return <div className={`terminal-backdrop ${styles.fullScreenBackdrop}`} role="presentation" onMouseDown={onClose}>
    <section className={`terminal-panel ${styles.fullScreen}`} role="dialog" aria-modal="true" aria-labelledby="terminal-title" onMouseDown={(event) => event.stopPropagation()}>
      <header className="terminal-header"><div><span className="eyebrow">TERRA EXPLORATION CONSOLE</span><h2 id="terminal-title">탐사 단말기</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="단말기 닫기">×</button></header>
      <nav className="terminal-tabs" aria-label="탐사 단말기 메뉴">{TABS.map((tab) => <button className={activeTab === tab.id ? "terminal-tab active" : "terminal-tab"} key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav>
      <div className={`terminal-content ${styles.fullScreenContent}`}>
        {activeTab === "map" && <div className="map-console">
          <div className={`planet-map ${styles.routeMap}`} aria-label="TERRA에서 LUNA와 SOL로 이어지는 항로">
            <div className={styles.mapStarField} aria-hidden="true" />
            <div className={`${styles.node} ${styles.terra}`}><strong>TERRA</strong><span>현재 위치</span></div>
            <div className={styles.routeLine}><span /></div>
            <div className={`${styles.node} ${styles.luna}`}><strong>LUNA</strong><span>{progress >= 100 ? "항로 활성" : "부분 해금"}</span></div>
            <div className={`${styles.routeLine} ${styles.routeLineSecond}`}><span /></div>
            <div className={`${styles.node} ${styles.sol}`}><strong>SOL</strong><span>잠긴 신호</span></div>
            <span className={styles.mapLegend}>ROUTE RECORD · FIRST LIGHT</span>
          </div>
          <div className="progress-card"><div className="progress-heading"><span>LUNA 항로 통신탑 복구</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><p>시그널 잔해를 모아 모두의 다음 항로를 준비합니다. 내 기여: {resourceCount}개</p></div>
        </div>}
        {activeTab === "build" && <CommunityBuildPanel inventory={resourceInventory} progress={progress} />}
        {activeTab === "missions" && <div className="console-list"><div className="console-list-heading"><span>오늘의 작은 신호</span><span className="tag">개발 모드</span></div>{["1분 스트레칭", "창문을 열고 하늘 바라보기", "작은 공간 하나 정리하기"].map((mission, index) => <div className="mission-row" key={mission}><span className="mission-index">0{index + 1}</span><span><strong>{mission}</strong><small>완료하면 개인 신호 에너지 +1</small></span><button className="small-button" type="button">기록</button></div>)}</div>}
        {activeTab === "news" && <div className="console-list news-list"><div className="news-item"><span className="news-dot cyan" /><p><strong>탐사대 시스템</strong> TERRA 광장에 새로운 신호가 감지되었습니다.</p><time>방금</time></div><div className="news-item"><span className="news-dot gold" /><p><strong>공동 건설소</strong> 통신탑 복구율이 {progress}%에 도달했습니다.</p><time>오늘</time></div><div className="news-item"><span className="news-dot violet" /><p><strong>SOL SIGNAL</strong> 오래된 관측 기록이 깨어나고 있습니다.</p><time>기록</time></div></div>}
        {activeTab === "community" && <div className="community-console"><div className="community-card"><span className="eyebrow">SHARED GOAL</span><h3>함께 만든 항로</h3><p>한 사람의 신호는 작지만, 이어지면 다음 행성으로 향하는 길이 됩니다.</p><strong>{progress}% 진행</strong></div><div className="community-card muted"><span className="eyebrow">GALLERY</span><h3>탐사 기록</h3><p>사진 탐사와 따뜻한 반응은 다음 단계에서 열립니다.</p><span className="tag">준비 중</span></div></div>}
        {activeTab === "chat" && <div className="chat-console"><div className="chat-messages" aria-live="polite">{messages.map((chatMessage, index) => <p key={`${chatMessage}-${index}`}>{chatMessage}</p>)}</div><div className="chat-compose"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage() }} maxLength={120} placeholder="따뜻한 신호를 남겨보세요" aria-label="전체 채팅 메시지" /><button className="small-button" type="button" onClick={sendMessage}>보내기</button></div><small className="console-note">현재는 로컬 개발 모드입니다. 연결 후 모든 광장에 동기화됩니다.</small></div>}
      </div>
    </section>
  </div>
}
