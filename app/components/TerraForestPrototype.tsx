"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import { Vector3 } from "three"
import type { CharacterProfile } from "../game/types"
import { ChatWindow, PlazaNewsPanel, type ChatMessage, type ChatSendHandler } from "./TerraCommandCenter"
import { ResourceHud, type ResourceInventory } from "./TerraCommandUi"
import commandStyles from "./TerraCommandCenter.module.css"
import styles from "./TerraForestPrototype.module.css"

const TerraForestScene = dynamic(() => import("./TerraForestScene").then((module) => module.TerraForestScene), { ssr: false, loading: () => <div className={styles.loading} role="status">숲을 구성하는 중...</div> })

interface TerraForestPrototypeProps {
  readonly character: CharacterProfile
  readonly inventory: ResourceInventory
  readonly messages: readonly ChatMessage[]
  readonly onSendMessage: ChatSendHandler
  readonly onCollect: (label: string) => void
  readonly onReturn: () => void
  readonly levelId?: string
}

export function TerraForestPrototype({ character, inventory, messages, onSendMessage, onCollect, onReturn, levelId = "terra-forest" }: TerraForestPrototypeProps) {
  const inputRef = useRef(new Set<string>())
  const interactionRef = useRef({ startedAt: 0, targetId: null as string | null })
  const playerPositionRef = useRef(new Vector3())
  const [collectedIds, setCollectedIds] = useState<ReadonlySet<string>>(new Set())
  const [showRegionIntro, setShowRegionIntro] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setShowRegionIntro(false), 3000)
    return () => window.clearTimeout(timer)
  }, [])

  const collect = (id: string, label: string) => {
    setCollectedIds((current) => { if (current.has(id)) return current; const next = new Set(current); next.add(id); return next })
    onCollect(label)
  }

  return <main className={styles.forest} aria-label="TERRA 숲 탐험 프로토타입">
    <header><div><small>TERRA 탐험 · 숲 지역</small><h1>바람이 머무는 숲</h1></div><div className={styles.topStatus}><ResourceHud inventory={inventory} /><div className={styles.profile} aria-label={`탐사대원 ${character.nickname}`}><span className={styles.profileLevel}>1</span><div className={styles.profileCopy}><small>신입대원</small><strong>{character.nickname}</strong><div className={styles.profileXp}><span aria-hidden="true" /><em>0 / 120 XP</em></div></div></div></div></header>
    <nav className={styles.returnBar} aria-label="탐험 경로"><button type="button" onClick={onReturn}>항로로 복귀</button></nav>
    <section className={styles.viewport} aria-label="플레이어 추적 3D 숲 필드">
      <TerraForestScene levelId={levelId} character={character} collectedIds={collectedIds} inputRef={inputRef} interactionRef={interactionRef} playerPositionRef={playerPositionRef} onCollect={collect} />
    </section>
    <aside className={styles.commsRail} aria-label="탐사 통신 패널">
      <div className={commandStyles.plazaChatSlot}><ChatWindow nickname={character.nickname} messages={messages} onSend={onSendMessage} /></div>
      <PlazaNewsPanel headingId="forest-news-title" className={styles.forestNewsPanel} />
    </aside>
    {showRegionIntro && <aside className={styles.regionCard} role="status" aria-live="polite"><small>탐험 구역 01</small><strong>바람이 머무는 숲</strong><span>{collectedIds.size ? `${collectedIds.size}개 채집 완료 · 공동 창고 기록` : "나무와 바위 사이에서 자원을 수집하세요"}</span></aside>}
  </main>
}
