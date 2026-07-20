"use client"

import { useState, type ReactNode } from "react"
import type { TerminalTab } from "../game/types"

export type ResourceKey = "wood" | "iron" | "signal" | "reclaimed"
export type ResourceInventory = Record<ResourceKey, number>

export const RESOURCE_META: readonly { readonly key: ResourceKey; readonly label: string; readonly code: string; readonly tone: string; readonly rare?: boolean }[] = [
  { key: "wood", label: "목재", code: "WOOD", tone: "wood" },
  { key: "iron", label: "철", code: "IRON", tone: "iron" },
  { key: "signal", label: "시그널 잔해", code: "SIGNAL", tone: "signal", rare: true },
  { key: "reclaimed", label: "재활용 부품", code: "RECLAIMED", tone: "reclaimed" },
]

const BUILD_REQUIREMENTS: Readonly<Record<ResourceKey, number>> = { wood: 1200, iron: 900, signal: 12, reclaimed: 240 }

function ResourceIcon({ resource }: { readonly resource: ResourceKey }) {
  const paths: Readonly<Record<ResourceKey, ReactNode>> = {
    wood: <><path d="M5 7.5h10.5a3.5 3.5 0 0 1 0 7H5z" /><circle cx="15.5" cy="11" r="3.5" /><path d="M14.2 11a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 0 0-2.6 0ZM7 7.5l-2-2m2 9-2 2" /></>,
    iron: <><path d="m5 8 3-3h8l3 3-3 8H8z" /><path d="M5 8h14M8 5l2 3m6-3-2 3" /></>,
    signal: <><path d="m12 3 4 6-4 12-4-12z" /><path d="M8 9h8m-6.7 4h5.4" /><path d="M4.5 7.5a7.5 7.5 0 0 0 0 9m15-9a7.5 7.5 0 0 1 0 9" /></>,
    reclaimed: <><path d="M8 4h8l4 7-4 7H8l-4-7z" /><path d="m8 4 4 7 4-7M4 11h8l4 7" /><circle cx="12" cy="11" r="2" /></>,
  }
  return <svg className="resource-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[resource]}</svg>
}

export function ResourceHud({ inventory }: { readonly inventory: ResourceInventory }) {
  return <div className="resource-hud" aria-label="보유 자원" role="list">{RESOURCE_META.map((resource) => <div className={`resource-chip ${resource.tone}`} key={resource.key} role="listitem" aria-label={`${resource.label} ${inventory[resource.key].toLocaleString("ko-KR")}`} title={resource.label}><ResourceIcon resource={resource.key} /><strong>{inventory[resource.key].toLocaleString("ko-KR")}</strong></div>)}</div>
}

export function GameNav({ activeTab, onNavigate }: { readonly activeTab: TerminalTab; readonly onNavigate: (tab: TerminalTab) => void }) {
  const items: readonly { readonly id: TerminalTab; readonly label: string }[] = [{ id: "map", label: "항로" }, { id: "chat", label: "교신" }, { id: "build", label: "전초기지" }, { id: "missions", label: "작전" }]
  return <nav className="game-nav" aria-label="테라 관제 메뉴">{items.map((item) => <button className={activeTab === item.id ? "game-nav-item active" : "game-nav-item"} type="button" key={item.id} onClick={() => onNavigate(item.id)} aria-current={activeTab === item.id ? "page" : undefined}>{item.label}</button>)}</nav>
}

export function CommunityBuildPanel({ inventory, progress }: { readonly inventory: ResourceInventory; readonly progress: number }) {
  return <section className="build-panel" aria-labelledby="build-panel-title"><div className="build-panel-heading"><div><span className="eyebrow">SHARED CONSTRUCTION</span><h2 id="build-panel-title">LUNA 통신탑 복구</h2></div><strong>{progress}%</strong></div><div className="build-progress" aria-label={`공동 건설 진행도 ${progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><p className="build-panel-copy">모두의 다음 항로를 열기 위해 네 가지 재료를 모읍니다.</p><ul className="material-list">{RESOURCE_META.map((resource) => { const required = BUILD_REQUIREMENTS[resource.key]; const current = inventory[resource.key]; const ratio = Math.min(100, Math.round((current / required) * 100)); return <li className="material-row" key={resource.key}><span className={`resource-glyph ${resource.tone}`} aria-hidden="true" /><span className="material-name"><strong>{resource.label}</strong>{resource.rare ? <small>희귀 · 특별 탐사</small> : <small>광장 수집</small>}</span><span className="material-amount"><strong>{current.toLocaleString("ko-KR")}</strong><small>/ {required.toLocaleString("ko-KR")}</small><i aria-hidden="true"><b style={{ width: `${ratio}%` }} /></i></span></li> })}</ul></section>
}

export function GlobalChatDock({ nickname, onOpenChat }: { readonly nickname: string; readonly onOpenChat: () => void }) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<readonly string[]>(["[탐사대] TERRA 광장에 새로운 신호가 감지되었습니다.", "[별바람] 오늘도 무사히 만나요."])
  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const nextMessage = message.trim(); if (!nextMessage) return; setMessages((previous) => [...previous, `[${nickname}] ${nextMessage}`]); setMessage("") }
  return <aside className="chat-dock" aria-labelledby="chat-dock-title"><header><div><span className="live-dot" /><span id="chat-dock-title">전역 교신</span></div><button type="button" onClick={onOpenChat}>전체 채팅 ↗</button></header><div className="chat-dock-messages" aria-live="polite">{messages.slice(-3).map((chatMessage, index) => <p key={`${chatMessage}-${index}`}>{chatMessage}</p>)}</div><form onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={120} placeholder="신호를 남겨보세요" aria-label="전역 교신 메시지" /><button type="submit" aria-label="메시지 보내기">↑</button></form></aside>
}
