"use client"

import { useState, type FormEvent } from "react"
import type { CharacterProfile, TerminalTab } from "../game/types"
import { CommunityBuildPanel, ResourceHud, type ResourceInventory } from "./TerraCommandUi"
import styles from "./TerraCommandCenter.module.css"

type PlanetId = "terra" | "luna" | "sol"

interface TerraCommandCenterProps {
  readonly profile: CharacterProfile
  readonly inventory: ResourceInventory
  readonly progress: number
  readonly resourceCount: number
  readonly onEnterTerra: () => void
  readonly onEditProfile: () => void
}

const NAV_ITEMS: readonly { readonly id: TerminalTab; readonly label: string }[] = [
  { id: "map", label: "항로" },
  { id: "community", label: "광장" },
  { id: "build", label: "전초기지" },
  { id: "missions", label: "작전" },
]

const PLANETS: Readonly<Record<PlanetId, { readonly name: string; readonly kicker: string; readonly status: string; readonly summary: string }>> = {
  terra: { name: "TERRA", kicker: "최초 정착지", status: "입장 가능", summary: "탐사대의 공동 거점입니다. 광장에서 재활용 부품과 건설 재료를 수집할 수 있습니다." },
  luna: { name: "LUNA", kicker: "두 번째 항로", status: "항로 복구 중", summary: "공동 건설 재료를 모아 끊어진 통신 항로를 복구해야 합니다." },
  sol: { name: "SOL", kicker: "미확인 신호원", status: "접근 불가", summary: "신호 좌표가 불완전합니다. LUNA 항로 복구 이후 추가 분석이 시작됩니다." },
}

type ChatChannel = "all" | "local" | "system"

interface ChatMessage {
  readonly id: string
  readonly channel: Exclude<ChatChannel, "all">
  readonly author: string
  readonly body: string
  readonly time: string
}

interface ChatWindowProps {
  readonly nickname: string
  readonly messages: readonly ChatMessage[]
  readonly onSend: (body: string, channel: Exclude<ChatChannel, "system">) => void
  readonly compact?: boolean
}

function ChatWindow({ nickname, messages, onSend, compact = false }: ChatWindowProps) {
  const [message, setMessage] = useState("")
  const [channel, setChannel] = useState<ChatChannel>("all")
  const visibleMessages = messages.filter((item) => channel === "all" || item.channel === channel)
  const canSend = channel !== "system"
  const sendMessage = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = message.trim(); if (!next || !canSend) return; onSend(next, channel); setMessage("") }
  const channels: readonly { readonly id: ChatChannel; readonly label: string }[] = [{ id: "all", label: "전체" }, { id: "local", label: "지역" }, { id: "system", label: "시스템" }]
  return <section className={compact ? `${styles.chatPanel} ${styles.routeChat}` : styles.chatPanel} aria-labelledby={compact ? "route-chat-title" : "global-chat-title"}><header><div><span className={styles.liveDot} /><h2 id={compact ? "route-chat-title" : "global-chat-title"}>전체 채팅</h2></div><span className={styles.onlineCount}><i />12명 접속</span></header><nav className={styles.chatChannels} aria-label="채팅 채널">{channels.map((item) => <button type="button" key={item.id} className={channel === item.id ? styles.channelActive : ""} onClick={() => setChannel(item.id)} aria-pressed={channel === item.id}>{item.label}<small>{item.id === "all" ? messages.length : messages.filter((messageItem) => messageItem.channel === item.id).length}</small></button>)}</nav><div className={styles.chatMessages} aria-live="polite">{visibleMessages.length ? visibleMessages.slice(compact ? -5 : 0).map((item) => <p className={item.channel === "system" ? styles.systemMessage : ""} key={item.id}><time>{item.time}</time><strong>{item.author}</strong><span>{item.body}</span></p>) : <p className={styles.emptyChat}>이 채널에 도착한 신호가 없습니다.</p>}</div><form onSubmit={sendMessage}><span className={styles.chatScope}>{channel === "local" ? "지역" : channel === "system" ? "시스템" : "전체"}</span><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={120} disabled={!canSend} placeholder={canSend ? `${nickname}(으)로 메시지 입력` : "시스템 채널은 읽기 전용입니다"} aria-label="전체 채팅 메시지" /><span className={styles.chatLimit}>{message.length}/120</span><button type="submit" disabled={!canSend || !message.trim()} aria-label="채팅 보내기">↑</button></form></section>
}

function ChatDrawer({ nickname, messages, onSend }: Pick<ChatWindowProps, "nickname" | "messages" | "onSend">) {
  const [open, setOpen] = useState(false)

  return <div className={`${styles.chatDrawer} ${open ? styles.chatDrawerOpen : styles.chatDrawerClosed}`}>
    <div className={styles.chatDrawerPanel} id="route-chat-panel"><ChatWindow compact nickname={nickname} messages={messages} onSend={onSend} /></div>
    <button className={styles.chatDrawerToggle} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="route-chat-panel"><span className={styles.liveDot} />{open ? "채팅 닫기" : "전체 채팅"}<small>12명 접속</small><b>{open ? "⌄" : "⌃"}</b></button>
  </div>
}

function RouteMap({ progress, nickname, messages, onSend, onEnterTerra }: { readonly progress: number; readonly nickname: string; readonly messages: readonly ChatMessage[]; readonly onSend: (body: string, channel: Exclude<ChatChannel, "system">) => void; readonly onEnterTerra: () => void }) {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null)
  const planet = selectedPlanet ? PLANETS[selectedPlanet] : null

  return <section className={styles.routeView} aria-labelledby="route-title">
    <div className={styles.routeMap}>
      <div className={`${styles.routeAsset} ${styles.routeSpace}`} aria-hidden="true" />
      <div className={`${styles.routeAsset} ${styles.routeTerra}`} aria-hidden="true" />
      <div className={`${styles.routeAsset} ${styles.routeLuna}`} aria-hidden="true" />
      <div className={`${styles.routeAsset} ${styles.routeSol}`} aria-hidden="true" />
      <div className={styles.routeIntro}><span>01 / STELLAR ROUTE</span><h1 id="route-title">다음 항로를<br /><em>선택하세요.</em></h1><p>TERRA는 지금 입장할 수 있습니다. 다른 항로는 모든 탐사대의 공동 기여로 해금됩니다.</p></div>
      {(["terra", "luna", "sol"] as const).map((id) => <button className={`${styles.planet} ${styles[`planet${id[0].toUpperCase()}${id.slice(1)}`]} ${selectedPlanet === id ? styles.planetActive : ""}`} type="button" key={id} onClick={() => setSelectedPlanet(id)} aria-pressed={selectedPlanet === id} aria-expanded={selectedPlanet === id} aria-controls="planet-information"><span className={styles.planetCore} /><strong>{PLANETS[id].name}</strong><small>{id === "terra" ? "입장 가능" : id === "luna" ? `복구 ${progress}%` : "잠김"}</small></button>)}
      <div className={styles.mapBrand} aria-label="FIRST LIGHT"><strong>FIRST LIGHT</strong><span><i />✦<i /></span><small>TERRA</small></div>
      <ChatDrawer nickname={nickname} messages={messages} onSend={onSend} />
      <span className={styles.mapCoordinate}>34° 18′ 22″ N&nbsp;&nbsp; / &nbsp;&nbsp;FIRST LIGHT NETWORK</span>
    </div>
    {selectedPlanet && planet ? <aside id="planet-information" className={styles.planetPanel} aria-live="polite"><button className={styles.panelClose} type="button" onClick={() => setSelectedPlanet(null)} aria-label="행성 정보 닫기">×</button><div><span className={styles.panelNumber}>0{selectedPlanet === "terra" ? 1 : selectedPlanet === "luna" ? 2 : 3}</span><span className={styles.status}>{planet.status}</span></div><span className={styles.kicker}>{planet.kicker}</span><h2>{planet.name}</h2><p>{planet.summary}</p>{selectedPlanet === "luna" ? <div className={styles.unlockProgress}><span><strong>공동 항로 복구</strong><b>{progress}%</b></span><i><b style={{ width: `${progress}%` }} /></i><small>목재 · 철 · 시그널 잔해 · 재활용 부품 필요</small></div> : null}<div className={styles.panelDivider} />{selectedPlanet === "terra" ? <button className={styles.enterButton} type="button" onClick={onEnterTerra}>TERRA 입장하기 <span>→</span></button> : <button className={styles.lockedButton} type="button" disabled>현재 이동할 수 없습니다</button>}<small className={styles.panelHint}>닫은 뒤 다른 행성을 선택할 수 있습니다.</small></aside> : null}
  </section>
}

function PlazaNews() {
  const news = [
    { id: "terra-progress", time: "방금", type: "행성", body: "TERRA 공동 기여율이 42%에 도달했습니다." },
    { id: "top-contributor", time: "02분 전", type: "기여", body: "별바람 대원이 철 120개를 공동 창고에 보탰습니다." },
    { id: "reality-mission", time: "18분 전", type: "현실", body: "유리별 대원이 야간 구조 임무를 완료했습니다." },
  ]

  return <section className={styles.plazaNews} aria-labelledby="plaza-news-title"><header><div><span className={styles.liveDot} /><h2 id="plaza-news-title">광장 뉴스</h2></div><small>실시간</small></header><ul>{news.map((item) => <li key={item.id}><time>{item.time}</time><span>{item.type}</span><p>{item.body}</p></li>)}</ul></section>
}

function PlazaMiniGames({ activeGame, onSelect }: { readonly activeGame: string; readonly onSelect: (id: string) => void }) {
  const games = [
    { id: "fishing", title: "광장 낚시", detail: "사람들과 낚싯대를 맞춰 희귀 재료를 낚아보세요.", icon: "〰", reward: "철 · 재활용 부품" },
    { id: "football", title: "3분 축구", detail: "대원을 모아 짧고 빠른 팀 경기를 즐겨보세요.", icon: "◉", reward: "공동 기여 보너스" },
    { id: "mining", title: "공동 채굴", detail: "타이밍을 맞춰 노역 현장의 재료를 확보합니다.", icon: "◇", reward: "목재 · 철" },
  ]

  return <aside className={styles.plazaMiniGames} aria-labelledby="mini-games-title"><header className={styles.miniGamesHeader}><div><span>PLAY TOGETHER</span><h2 id="mini-games-title">미니게임</h2></div></header><p className={styles.miniGamesIntro}>전체 채팅으로 대원을 모아 함께 플레이하세요.</p><div className={styles.miniGameList}>{games.map((game) => <article className={`${styles.miniGameCard} ${activeGame === game.id ? styles.miniGameCardActive : ""}`} key={game.id}><div className={styles.miniGameArt}><strong>{game.icon}</strong><span>2~8명</span></div><div className={styles.miniGameCopy}><small>{game.reward}</small><h3>{game.title}</h3><p>{game.detail}</p><button type="button" onClick={() => onSelect(game.id)}>{activeGame === game.id ? "선택됨" : "게임 시작"}<span>→</span></button></div></article>)}</div><small className={styles.miniGameFooter}>선택한 게임은 이 작업 영역에서 실행됩니다.</small></aside>
}

function PlazaCctv() {
  return <article className={styles.plazaCctv}><header className={styles.plazaCardHeading}><div><span>중앙 노역 현장 CCTV</span><h2 id="plaza-title">교정시설 관찰실</h2></div><b>● LIVE</b></header><div className={styles.worksiteScene} aria-label="교정시설에 갇힌 사람들이 공동 작업을 하는 중앙 노역 현장"><div className={styles.worksiteBars}><i /><i /><i /><i /><i /></div><span className={styles.worksiteSignal}>CAM-01 · 관찰 중</span><div className={`${styles.plazaWorker} ${styles.workerOne}`} /><div className={`${styles.plazaWorker} ${styles.workerTwo}`} /><div className={`${styles.plazaWorker} ${styles.workerThree}`} /><div className={styles.worksiteFloor}><span>오늘의 공동 목표</span><strong>재활용 부품 240개</strong></div></div><footer className={styles.plazaCctvFooter}><span>참여 대원 12명</span><span>현장 기여율 <strong>68%</strong></span><span>다음 갱신 02:41:13</span></footer></article>
}

function PlazaView({ nickname, messages, onSend }: { readonly nickname: string; readonly messages: readonly ChatMessage[]; readonly onSend: (body: string, channel: Exclude<ChatChannel, "system">) => void }) {
  const [activeGame, setActiveGame] = useState("fishing")

  return <section className={`${styles.contentView} ${styles.plazaView}`} aria-label="광장"><div className={styles.plazaGrid}><PlazaMiniGames activeGame={activeGame} onSelect={setActiveGame} /><div className={styles.plazaRightColumn}><PlazaCctv /><aside className={styles.plazaInfoRow} aria-label="광장 소식과 채팅"><PlazaNews /><ChatWindow nickname={nickname} messages={messages} onSend={onSend} /></aside></div></div></section>
}

function BuildView({ inventory, progress, resourceCount }: { readonly inventory: ResourceInventory; readonly progress: number; readonly resourceCount: number }) {
  return <section className={`${styles.contentView} ${styles.buildView}`} aria-labelledby="build-title"><header className={styles.sectionHeading}><span>03 / JOINT CONSTRUCTION</span><h1 id="build-title">공동 <em>전초기지</em></h1><p>목재, 철, 시그널 잔해, 재활용 부품을 모아 다음 항로를 함께 엽니다.</p></header><div className={styles.buildGrid}><CommunityBuildPanel inventory={inventory} progress={progress} /><aside className={styles.contribution}><span>YOUR CONTRIBUTION</span><strong>{resourceCount.toLocaleString("ko-KR")}</strong><p>이번 접속에서 확보한 공동 자원</p><div /><h2>시그널 잔해</h2><p>희귀 탐사 신호, 공동 작전 보상, 미확인 구조물 조사에서 발견할 수 있습니다.</p></aside></div></section>
}

function MissionsView() {
  const missions = [{ code: "OPS 01", title: "광장의 잔해", detail: "TERRA 광장에서 재활용 부품 5개를 확보하세요.", reward: "목재 40" }, { code: "OPS 02", title: "끊어진 신호", detail: "미확인 신호를 추적해 시그널 잔해의 위치를 확인하세요.", reward: "신호 좌표" }, { code: "OPS 03", title: "첫 번째 기여", detail: "전초기지에 공동 자원을 처음으로 기부하세요.", reward: "탐사 기록" }]
  return <section className={styles.contentView} aria-labelledby="missions-title"><header className={styles.sectionHeading}><span>04 / OPERATIONS</span><h1 id="missions-title">현재 <em>작전</em></h1><p>항로 복구에 필요한 개인 임무와 공동 목표입니다.</p></header><div className={styles.missionList}>{missions.map((mission, index) => <article key={mission.code}><span className={styles.missionIndex}>0{index + 1}</span><div><small>{mission.code}</small><h2>{mission.title}</h2><p>{mission.detail}</p></div><div className={styles.reward}><small>REWARD</small><strong>{mission.reward}</strong></div><button type="button">기록</button></article>)}</div></section>
}

export function TerraCommandCenter({ profile, inventory, progress, resourceCount, onEnterTerra, onEditProfile }: TerraCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<TerminalTab>("map")
  const [messages, setMessages] = useState<readonly ChatMessage[]>([
    { id: "system-arrival", channel: "system", author: "관제", body: "TERRA 광장에 새로운 탐사 신호가 감지되었습니다.", time: "20:14" },
    { id: "local-iron", channel: "local", author: "별바람", body: "LUNA 복구에 철이 더 필요해요.", time: "20:16" },
    { id: "local-welcome", channel: "local", author: "유리별", body: "신입대원 환영해요! 광장에서 만나요.", time: "20:18" },
  ])
  const sendMessage = (body: string, channel: Exclude<ChatChannel, "system">) => setMessages((current) => [...current, { id: `${Date.now()}-${current.length}`, channel: channel === "all" ? "local" : channel, author: profile.nickname, body, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) }])
  return <main className={styles.commandCenter}><header className={styles.header}><nav aria-label="관제실 주 메뉴">{NAV_ITEMS.map((item) => <button type="button" key={item.id} className={activeTab === item.id ? styles.navActive : ""} onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? "page" : undefined}><strong>{item.label}</strong></button>)}</nav><div className={styles.headerStatus}><ResourceHud inventory={inventory} /><button className={styles.profile} type="button" onClick={onEditProfile}><span className={styles.rankMark}>L</span><span><small>신입대원</small><strong>{profile.nickname}</strong></span></button></div></header><div className={styles.screen}>{activeTab === "map" ? <RouteMap progress={progress} nickname={profile.nickname} messages={messages} onSend={sendMessage} onEnterTerra={onEnterTerra} /> : activeTab === "community" ? <PlazaView nickname={profile.nickname} messages={messages} onSend={sendMessage} /> : activeTab === "build" ? <BuildView inventory={inventory} progress={progress} resourceCount={resourceCount} /> : <MissionsView />}</div></main>
}
