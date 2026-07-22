"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import type { CharacterProfile, TerminalTab } from "../game/types"
import { calculateBuildProgress, CommunityBuildPanel, ResourceHud, type ResourceInventory, type ResourceKey } from "./TerraCommandUi"
import { DailyMissionWorkspace } from "./DailyMissionWorkspace"
import { LanguageToggle } from "./LanguageToggle"
import { useLanguage } from "./LanguageProvider"
import { TerraMusicToggle } from "./TerraMusicToggle"
import styles from "./TerraCommandCenter.module.css"

export const LEGACY_TERRA_ENTRY_LABEL = "TERRA 입장하기"

type PlanetId = "terra" | "luna" | "sol"
export type ChatChannel = "all" | "local" | "system"
type PlazaPhase = "dawn" | "day" | "evening" | "night"
type PlazaGame = "timing" | "pattern"
type MissionStatus = "not-started" | "in-progress" | "complete"
type MissionKind = "real" | "ingame"
type MissionDifficulty = "easy" | "normal" | "hard"

interface ActivePlazaSignal {
  readonly id: string
  readonly kind: PlazaGame
  readonly left: number
  readonly top: number
  readonly expiresAt: number
}

const PLAZA_PHASES: Readonly<Record<PlazaPhase, { readonly label: string; readonly time: string; readonly source: string; readonly treatment: string }>> = {
  dawn: { label: "새벽", time: "05:00–08:00", source: "낮 원본", treatment: "차가운 채도 보정" },
  day: { label: "낮", time: "08:00–17:00", source: "낮 원본", treatment: "원본" },
  evening: { label: "저녁", time: "17:00–21:00", source: "저녁 원본", treatment: "원본" },
  night: { label: "밤", time: "21:00–05:00", source: "밤 원본", treatment: "원본" },
}

const PLAZA_PHASE_EN: Readonly<Record<PlazaPhase, { readonly label: string; readonly time: string; readonly source: string; readonly treatment: string }>> = {
  dawn: { label: "DAWN", time: "05:00–08:00", source: "DAY SOURCE", treatment: "COOL SATURATION" },
  day: { label: "DAY", time: "08:00–17:00", source: "DAY SOURCE", treatment: "ORIGINAL" },
  evening: { label: "EVENING", time: "17:00–21:00", source: "EVENING SOURCE", treatment: "ORIGINAL" },
  night: { label: "NIGHT", time: "21:00–05:00", source: "NIGHT SOURCE", treatment: "ORIGINAL" },
}

const PATTERN_SEQUENCE = [0, 2, 1, 3] as const
const PLAZA_PHASE_ORDER: readonly PlazaPhase[] = ["dawn", "day", "evening", "night"]
const SIGNAL_POSITIONS = [
  { left: 10, top: 18 },
  { left: 42, top: 48 },
  { left: 22, top: 70 },
  { left: 60, top: 20 },
  { left: 56, top: 68 },
] as const

const LIVE_CHAT_LINES: readonly Pick<ChatMessage, "channel" | "author" | "body">[] = [
  { channel: "local", author: "은하수", body: "방금 광장 서쪽에서 새로운 신호를 봤어요." },
  { channel: "local", author: "모래시계", body: "목재 기여 완료했습니다. 다음 목표가 기대돼요." },
  { channel: "system", author: "관제사", body: "공동 창고 자원 현황이 갱신되었습니다." },
  { channel: "local", author: "별자리", body: "숲으로 가는 대원 있으면 같이 움직여요." },
  { channel: "local", author: "푸른잔광", body: "오늘도 작은 신호 하나 남기고 갑니다." },
]

const LIVE_CHAT_ENGLISH_LINES = [
  "A new signal was spotted west of the plaza.",
  "Wood contribution complete. I am looking forward to the next goal.",
  "The shared storage resource report has been updated.",
  "Anyone heading to the forest? Let’s move together.",
  "Leaving one small signal behind before I log off.",
] as const

const CHAT_ENGLISH_BY_ID: Readonly<Record<string, string>> = {
  "system-arrival": "A new explorer signal has been detected in the TERRA plaza.",
  "local-iron": "LUNA needs more iron for restoration.",
  "local-welcome": "Welcome, new explorer. See you in the plaza.",
}

interface PlazaNewsItem {
  readonly id: string
  readonly category: string
  readonly body: string
  readonly englishCategory?: string
  readonly englishBody?: string
  readonly time: string
}

const PLAZA_NEWS_EN = [
  { category: "RESTORATION NETWORK", body: "The shared LUNA restoration signal has been updated." },
  { category: "WORLD NEWS", body: "New resources have arrived at the explorer shared storage." },
  { category: "MEMORY LOG", body: "Today's mission records and new signals have been archived." },
  { category: "RESOURCE STATUS", body: "Plaza explorers secured 240 reclaimed parts." },
  { category: "EXPLORATION NEWS", body: "A collectible resource signal was detected in the forest." },
  { category: "COMMUNITY", body: "A welcome signal has arrived for a newly connected explorer." },
] as const

const PLAZA_NEWS_LINES: readonly Omit<PlazaNewsItem, "id" | "time">[] = [
  { category: "복구 통신망", body: "LUNA 공동 복구 신호가 업데이트되었습니다." },
  { category: "세계 소식", body: "탐사대 공동 창고에 새로운 자원이 도착했습니다." },
  { category: "기억 기록", body: "오늘의 미션 기록과 새로운 신호가 등록되었습니다." },
  { category: "자원 현황", body: "광장 탐사대가 재활용 부품 240개를 확보했습니다." },
  { category: "탐사 소식", body: "숲 지역에서 수집 가능한 자원 신호가 감지되었습니다." },
  { category: "공동체", body: "새로 접속한 탐사대원에게 환영 신호가 도착했습니다." },
]

function getPlazaPhase(date: Date): PlazaPhase {
  const hour = date.getHours() + date.getMinutes() / 60
  if (hour >= 5 && hour < 8) return "dawn"
  if (hour >= 8 && hour < 17) return "day"
  if (hour >= 17 && hour < 21) return "evening"
  return "night"
}

interface TerraCommandCenterProps {
  readonly profile: CharacterProfile
  readonly inventory: ResourceInventory
  readonly progress: number
  readonly resourceCount: number
  readonly messages: readonly ChatMessage[]
  readonly onSendMessage: ChatSendHandler
  readonly onEnterTerra: () => void
  readonly musicEnabled: boolean
  readonly onToggleMusic: () => void
  readonly onTabChange: (tab: TerminalTab) => void
}

export interface ChatMessage {
  readonly id: string
  readonly channel: Exclude<ChatChannel, "all">
  readonly author: string
  readonly body: string
  readonly englishBody?: string
  readonly englishAuthor?: string
  readonly time: string
}

export type ChatSendHandler = (body: string, channel: Exclude<ChatChannel, "system">) => void

interface DailyMission {
  readonly id: string
  readonly kind: MissionKind
  readonly difficulty: MissionDifficulty
  readonly code: string
  readonly category: string
  readonly title: string
  readonly detail: string
  readonly duration: string
  readonly rewardXp: number
  readonly rewardResource: ResourceKey
  readonly rewardAmount: number
  readonly status: MissionStatus
}

interface SignalPost {
  readonly id: string
  readonly author: string
  readonly missionTitle: string
  readonly note: string
  readonly photo?: string
  readonly createdAt: string
  readonly praiseCount: number
  readonly praised: boolean
}

interface MissionCompletion {
  readonly missionId: string
  readonly note: string
  readonly photo?: string
}

const MISSION_DAILY_LIMIT = 5

const NAV_ITEMS: readonly { readonly id: TerminalTab; readonly label: string }[] = [
  { id: "community", label: "광장" },
  { id: "missions", label: "시그널" },
  { id: "build", label: "프로젝트" },
  { id: "map", label: "항로" },
]
const NAV_ITEMS_EN: readonly { readonly id: TerminalTab; readonly label: string }[] = [
  { id: "community", label: "PLAZA" },
  { id: "missions", label: "SIGNAL" },
  { id: "build", label: "PROJECT" },
  { id: "map", label: "ROUTE" },
]

const PLANETS: Readonly<Record<PlanetId, { readonly name: string; readonly kicker: string; readonly status: string; readonly summary: string }>> = {
  terra: { name: "TERRA", kicker: "첫 번째 전초기지", status: "입장 가능", summary: "탐사대가 모이고 작은 행동이 공동 항로로 이어지는 시작점입니다." },
  luna: { name: "LUNA", kicker: "두 번째 항로", status: "복구 진행 중", summary: "공동건설 자원을 모아 끊어진 통신 항로를 복구해야 합니다." },
  sol: { name: "SOL", kicker: "미확인 신호원", status: "잠김", summary: "LUNA 복구 이후 추가 신호 분석을 시작할 수 있습니다." },
}

const PLANETS_EN: Readonly<Record<PlanetId, { readonly name: string; readonly kicker: string; readonly status: string; readonly summary: string }>> = {
  terra: { name: "TERRA", kicker: "FIRST OUTPOST", status: "OPEN", summary: "A starting point where explorers gather and small actions become a shared route." },
  luna: { name: "LUNA", kicker: "SECOND ROUTE", status: "RESTORATION IN PROGRESS", summary: "Gather shared construction resources to restore the broken communication route." },
  sol: { name: "SOL", kicker: "UNIDENTIFIED SIGNAL SOURCE", status: "LOCKED", summary: "Further signal analysis begins after LUNA is restored." },
}

const MISSION_POOL: readonly DailyMission[] = [
  { id: "self-care", kind: "real", difficulty: "easy", code: "REAL 01", category: "나 돌보기", title: "잠깐의 회복", detail: "오늘 나를 위해 10분 동안 쉬거나 좋아하는 일을 해보세요.", duration: "약 10분", rewardXp: 16, rewardResource: "signal", rewardAmount: 1, status: "not-started" },
  { id: "home-thanks", kind: "real", difficulty: "easy", code: "REAL 02", category: "나 돌보기", title: "고마운 물건", detail: "집 안에서 오늘 고마웠던 물건 하나를 발견하고 이유를 기록해보세요.", duration: "약 5분", rewardXp: 18, rewardResource: "reclaimed", rewardAmount: 1, status: "not-started" },
  { id: "neighborhood", kind: "real", difficulty: "normal", code: "REAL 03", category: "주변 돌보기", title: "동네의 작은 신호", detail: "주변의 식물이나 하늘을 바라보고 마음에 남은 장면을 기록하세요.", duration: "약 15분", rewardXp: 26, rewardResource: "wood", rewardAmount: 2, status: "not-started" },
  { id: "kind-neighborhood", kind: "real", difficulty: "normal", code: "REAL 04", category: "주변 돌보기", title: "따뜻한 흔적", detail: "동네에서 누군가를 배려할 수 있는 작은 행동을 한 가지 실천해보세요.", duration: "약 20분", rewardXp: 30, rewardResource: "iron", rewardAmount: 2, status: "not-started" },
  { id: "photo-sky", kind: "real", difficulty: "hard", code: "REAL 05", category: "아름다운 순간", title: "오늘의 하늘 신호", detail: "집이나 밖에서 마음에 남은 하늘, 별, 식물, 동네 풍경을 사진으로 남겨보세요.", duration: "약 20분", rewardXp: 44, rewardResource: "signal", rewardAmount: 3, status: "not-started" },
  { id: "photo-neighborhood", kind: "real", difficulty: "hard", code: "REAL 06", category: "아름다운 순간", title: "빛이 머문 곳", detail: "사진 한 장과 짧은 소감으로 오늘 발견한 아름다운 순간을 교신에 남겨보세요.", duration: "약 25분", rewardXp: 48, rewardResource: "reclaimed", rewardAmount: 3, status: "not-started" },
  { id: "window-breath", kind: "real", difficulty: "easy", code: "REAL 07", category: "나 돌보기", title: "창가의 숨", detail: "창가에서 천천히 세 번 숨을 고르고 지금 들리는 소리를 하나 찾아보세요.", duration: "약 3분", rewardXp: 14, rewardResource: "signal", rewardAmount: 1, status: "not-started" },
  { id: "kind-note", kind: "real", difficulty: "normal", code: "REAL 08", category: "주변 돌보기", title: "작은 고마움 남기기", detail: "오늘 도움을 준 사람이나 물건에게 짧은 감사의 말을 기록해보세요.", duration: "약 5분", rewardXp: 22, rewardResource: "reclaimed", rewardAmount: 1, status: "not-started" },
  { id: "greeting", kind: "ingame", difficulty: "easy", code: "GAME 01", category: "사람과 연결", title: "먼저 인사하기", detail: "광장이나 채팅에서 다른 탐사대원 한 명에게 따뜻하게 인사해보세요.", duration: "약 3분", rewardXp: 18, rewardResource: "signal", rewardAmount: 1, status: "not-started" },
  { id: "encourage", kind: "ingame", difficulty: "normal", code: "GAME 02", category: "사람과 연결", title: "신호에 답하기", detail: "다른 탐사대원의 기록을 읽고 구체적인 응원의 말을 남겨보세요.", duration: "약 5분", rewardXp: 28, rewardResource: "iron", rewardAmount: 1, status: "not-started" },
  { id: "welcome", kind: "ingame", difficulty: "normal", code: "GAME 03", category: "사람과 연결", title: "새로운 대원 환영하기", detail: "처음 만난 탐사대원에게 이곳에서 할 수 있는 일을 하나 알려주세요.", duration: "약 7분", rewardXp: 32, rewardResource: "wood", rewardAmount: 2, status: "not-started" },
  { id: "community-signal", kind: "ingame", difficulty: "hard", code: "GAME 04", category: "공동체 돌보기", title: "작은 신호 모으기", detail: "오늘의 교신에서 마음에 남은 신호 세 개를 읽고, 그중 하나를 응원해보세요.", duration: "약 10분", rewardXp: 42, rewardResource: "reclaimed", rewardAmount: 2, status: "not-started" },
  { id: "signal-trail", kind: "ingame", difficulty: "easy", code: "GAME 05", category: "사람과 연결", title: "빛의 흔적 따라가기", detail: "광장의 신호 하나를 골라 어떤 이야기에서 시작됐는지 천천히 살펴보세요.", duration: "약 4분", rewardXp: 20, rewardResource: "wood", rewardAmount: 1, status: "not-started" },
  { id: "signal-share", kind: "ingame", difficulty: "hard", code: "GAME 06", category: "공동체 돌보기", title: "오늘의 신호 공유하기", detail: "오늘 마음에 남은 장면을 짧은 문장으로 적어 다른 탐사대원과 나눠보세요.", duration: "약 8분", rewardXp: 36, rewardResource: "iron", rewardAmount: 2, status: "not-started" },
]
const INITIAL_MISSIONS: readonly DailyMission[] = [MISSION_POOL[0], MISSION_POOL[2], MISSION_POOL[4], MISSION_POOL[6], MISSION_POOL[7], MISSION_POOL[9]]
const SEED_SIGNAL_POSTS: readonly SignalPost[] = [
  { id: "seed-beach", author: "해질녘 산책자", missionTitle: "오늘의 하늘 신호", note: "파도 소리를 들으며 잠깐 멈춰 있었습니다. 오늘의 마음도 조금 가벼워졌어요.", photo: "/assets/missions/seed/signal-beach.png", createdAt: "오늘 09:14", praiseCount: 12, praised: false },
  { id: "seed-sunset-forest", author: "노을을 모으는 사람", missionTitle: "동네의 작은 신호", note: "집 근처 숲길에서 본 노을입니다. 같은 하늘을 보고 있는 사람이 있겠죠.", photo: "/assets/missions/seed/signal-sunset-forest.png", createdAt: "오늘 08:42", praiseCount: 8, praised: false },
  { id: "seed-tropical-coast", author: "느린 여행자", missionTitle: "잠깐의 회복", note: "아무것도 하지 않고 바다를 바라보는 시간을 선물했습니다.", photo: "/assets/missions/seed/signal-tropical-coast.png", createdAt: "어제 22:18", praiseCount: 19, praised: false },
  { id: "seed-mountain-lake", author: "첫빛 기록자", missionTitle: "오늘의 하늘 신호", note: "물에 비친 산과 새 한 마리를 발견했습니다. 아름다운 순간을 남겨요.", photo: "/assets/missions/seed/signal-mountain-lake.png", createdAt: "어제 19:06", praiseCount: 24, praised: false },
  { id: "seed-short-note", author: "작은 응원", missionTitle: "잠깐의 회복", note: "오늘은 창문을 열고 깊게 숨을 쉬었습니다.", createdAt: "오늘 07:35", praiseCount: 5, praised: false },
  { id: "seed-long-note", author: "길 위의 관찰자", missionTitle: "동네의 작은 신호", note: "매일 지나던 길인데 오늘은 담장 아래 피어난 작은 꽃이 먼저 보였습니다. 바쁘다는 이유로 보지 못했던 것들이 가까이에 있었네요. 이 기록을 남기고 나니 내일도 조금 천천히 걸어보고 싶어졌습니다.", createdAt: "어제 16:22", praiseCount: 16, praised: false },
]

const ZERO_RESOURCES: ResourceInventory = { wood: 0, iron: 0, signal: 0, reclaimed: 0 }
interface PlayerProgression {
  readonly level: number
  readonly xp: number
  readonly title: string
  readonly nextTitle: string | null
  readonly nextLevelXp: number | null
  readonly levelProgress: number
  readonly earnedTitles: readonly string[]
}

const PLAYER_RANKS = [
  { level: 1, minXp: 0, title: "신입대원" },
  { level: 2, minXp: 120, title: "견습대원" },
  { level: 3, minXp: 300, title: "정식대원" },
  { level: 4, minXp: 650, title: "숙련대원" },
  { level: 5, minXp: 1200, title: "선임대원" },
  { level: 6, minXp: 2000, title: "항로 개척자" },
] as const

function calculatePlayerProgression(contributed: ResourceInventory, missions: readonly DailyMission[]): PlayerProgression {
  const totalContributed = Object.values(contributed).reduce((sum, value) => sum + value, 0)
  const completedMissions = missions.filter((mission) => mission.status === "complete")
  const xp = totalContributed * 2 + completedMissions.reduce((sum, mission) => sum + mission.rewardXp, 0)
  const rankIndex = PLAYER_RANKS.reduce((selected, rank, index) => xp >= rank.minXp ? index : selected, 0)
  const currentRank = PLAYER_RANKS[rankIndex]
  const nextRank = PLAYER_RANKS[rankIndex + 1]
  const earnedTitles = [
    contributed.wood >= 30 ? "목재 탐사자" : null,
    totalContributed >= 60 ? "공동 보급자" : null,
    contributed.signal >= 6 ? "신호 복구자" : null,
    completedMissions.length >= 3 ? "현실 기록자" : null,
  ].filter((title): title is string => title !== null)
  return {
    level: currentRank.level,
    xp,
    title: currentRank.title,
    nextTitle: nextRank?.title ?? null,
    nextLevelXp: nextRank?.minXp ?? null,
    levelProgress: nextRank ? Math.round(((xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100) : 100,
    earnedTitles,
  }
}

export function formatTime(date = new Date()): string {
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
}

function PlayerProfile({ nickname, progression }: { readonly nickname: string; readonly progression: PlayerProgression }) {
  const { language } = useLanguage()
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const availableTitles = [...PLAYER_RANKS.filter((rank) => rank.level <= progression.level).map((rank) => rank.title), ...progression.earnedTitles].filter((title, index, titles) => titles.indexOf(title) === index)
  const displayTitle = selectedTitle && availableTitles.includes(selectedTitle) ? selectedTitle : progression.title
  const titleText: Readonly<Record<string, string>> = { "신입대원": "New Explorer", "견습대원": "Apprentice", "정식대원": "Full Explorer", "숙련대원": "Skilled Explorer", "선임대원": "Senior Explorer", "항로 개척자": "Route Pioneer", "목재 탐사자": "Woodland Scout", "공동 보급자": "Shared Supplier", "신호 복구자": "Signal Restorer", "현실 기록자": "Reality Chronicler" }
  const shownTitle = language === "en" ? titleText[displayTitle] ?? displayTitle : displayTitle
  const shownNickname = language === "en" && nickname === "탐사대원" ? "Explorer" : nickname
  return <><button className={styles.profile} type="button" onClick={() => setPickerOpen(true)} aria-haspopup="dialog" aria-expanded={pickerOpen} aria-label={language === "en" ? shownNickname + " profile, change title" : nickname + " 프로필, 칭호 변경"}><span className={styles.rankMark}>{progression.level}</span><span><small>{shownTitle}</small><strong>{shownNickname}</strong><span className={styles.profileXp}><i aria-hidden="true"><b style={{ width: progression.levelProgress + "%" }} /></i><em>{progression.nextLevelXp ? progression.xp + " / " + progression.nextLevelXp + " XP" : progression.xp + " XP"}</em></span></span></button>{pickerOpen ? <div className={styles.titleDialogBackdrop}><section className={styles.titleDialog} role="dialog" aria-modal="true" aria-labelledby="title-dialog-heading"><header><div><span>PROFILE TITLE</span><h2 id="title-dialog-heading">{language === "en" ? "Choose title" : "칭호 선택"}</h2></div><button className={styles.titleDialogClose} type="button" onClick={() => setPickerOpen(false)} aria-label={language === "en" ? "Close title picker" : "칭호 창 닫기"}>×</button></header><p>{language === "en" ? "Select an earned title to show on your profile." : "획득한 칭호를 선택하면 프로필에 표시됩니다."}</p><div className={styles.titleChoiceList}>{availableTitles.map((title) => <button className={`${styles.titleChoice} ${displayTitle === title ? styles.titleChoiceActive : ""}`} type="button" key={title} onClick={() => { setSelectedTitle(title); setPickerOpen(false) }} aria-pressed={displayTitle === title}><strong>{language === "en" ? titleText[title] ?? title : title}</strong><small>{title === progression.title ? (language === "en" ? "Current level" : "현재 레벨") : (language === "en" ? "Earned title" : "획득 칭호")}</small></button>)}</div></section></div> : null}</>
}

export function ChatWindow({ nickname, messages, onSend, compact = false }: { readonly nickname: string; readonly messages: readonly ChatMessage[]; readonly onSend: ChatSendHandler; readonly compact?: boolean }) {
  const { language } = useLanguage()
  const english = language === "en"
  const [message, setMessage] = useState("")
  const [channel, setChannel] = useState<ChatChannel>("all")
  const [activityMessages, setActivityMessages] = useState<readonly ChatMessage[]>([])
  useEffect(() => {
    if (compact) return
    let sequence = 0
    const timer = window.setInterval(() => {
      const lineIndex = sequence++ % LIVE_CHAT_LINES.length
      const line = LIVE_CHAT_LINES[lineIndex]
      setActivityMessages((current) => [...current, { ...line, id: `live-chat-${Date.now()}-${sequence}`, englishBody: LIVE_CHAT_ENGLISH_LINES[lineIndex], time: formatTime() }].slice(-8))
    }, 4_800)
    return () => window.clearInterval(timer)
  }, [compact])
  const rawMessages = [...messages, ...activityMessages]
  const allMessages = rawMessages.map((item, index) => { const participantNumber = rawMessages.slice(0, index + 1).filter((entry) => entry.channel !== "system").length; return { ...item, author: item.channel === "system" ? (english ? "CONTROLLER" : "관제사") : "대원_" + String(participantNumber).padStart(2, "0"), body: english ? item.englishBody ?? CHAT_ENGLISH_BY_ID[item.id] ?? "A new explorer signal has been recorded." : item.body } })
  const visibleMessages = allMessages.filter((item) => channel === "all" || item.channel === channel)
  const sendMessage = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = message.trim(); if (!next || channel === "system") return; onSend(next, channel); setMessage("") }
  const channels: readonly { readonly id: ChatChannel; readonly label: string }[] = english ? [{ id: "all", label: "ALL" }, { id: "local", label: "LOCAL" }, { id: "system", label: "SYSTEM" }] : [{ id: "all", label: "전체" }, { id: "local", label: "지역" }, { id: "system", label: "시스템" }]
  return <section className={compact ? styles.chatPanel + " " + styles.routeChat : styles.chatPanel} aria-labelledby={compact ? "route-chat-title" : "global-chat-title"}><header><div><span className={styles.liveDot} /><h2 id={compact ? "route-chat-title" : "global-chat-title"}>{english ? "GLOBAL CHAT" : "전체 채팅"}</h2></div><span className={styles.onlineCount}><i />{english ? "12 ONLINE" : "12명 접속"}</span></header><nav className={styles.chatChannels} aria-label={english ? "Chat channels" : "채팅 채널"}>{channels.map((item) => <button type="button" key={item.id} className={channel === item.id ? styles.channelActive : ""} onClick={() => setChannel(item.id)} aria-pressed={channel === item.id}>{item.label}<small>{item.id === "all" ? allMessages.length : allMessages.filter((messageItem) => messageItem.channel === item.id).length}</small></button>)}</nav><div className={styles.chatMessages} aria-live="polite">{visibleMessages.length ? visibleMessages.slice(compact ? -5 : undefined).map((item) => <p className={item.channel === "system" ? styles.systemMessage : ""} key={item.id}><time>{item.time}</time><strong>{item.author}</strong><span>{item.body}</span></p>) : <p className={styles.emptyChat}>{english ? "No signals in this channel yet." : "이 채널에는 아직 신호가 없습니다."}</p>}</div><form onSubmit={sendMessage}><span className={styles.chatScope}>{channel === "local" ? (english ? "LOCAL" : "지역") : channel === "system" ? (english ? "SYSTEM" : "시스템") : (english ? "ALL" : "전체")}</span><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={120} disabled={channel === "system"} placeholder={channel === "system" ? (english ? "System channel is read-only" : "시스템 채널은 읽기 전용입니다") : (english ? nickname + " message" : nickname + "의 메시지 입력")} aria-label={english ? "Global chat message" : "전체 채팅 메시지"} /><span className={styles.chatLimit}>{message.length}/120</span><button type="submit" disabled={channel === "system" || !message.trim()} aria-label={english ? "Send chat message" : "채팅 보내기"}>{english ? "SEND" : "전송"}</button></form></section>
}

function ChatDrawer({ nickname, messages, onSend }: { readonly nickname: string; readonly messages: readonly ChatMessage[]; readonly onSend: (body: string, channel: Exclude<ChatChannel, "system">) => void }) {
  const { language } = useLanguage()
  const english = language === "en"
  const [open, setOpen] = useState(false)
  return <div className={`${styles.chatDrawer} ${open ? styles.chatDrawerOpen : styles.chatDrawerClosed}`}><div className={styles.chatDrawerPanel} id="route-chat-panel"><ChatWindow compact nickname={nickname} messages={messages} onSend={onSend} /></div><button className={styles.chatDrawerToggle} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="route-chat-panel"><span className={styles.liveDot} />{open ? (english ? "CLOSE CHAT" : "채팅 닫기") : (english ? "GLOBAL CHAT" : "전체 채팅")}<small>{english ? "12 ONLINE" : "12명 접속"}</small><b>{open ? "⌃" : "⌄"}</b></button></div>
}

function RouteMap({ progress, nickname, messages, onSend, onEnterTerra }: { readonly progress: number; readonly nickname: string; readonly messages: readonly ChatMessage[]; readonly onSend: (body: string, channel: Exclude<ChatChannel, "system">) => void; readonly onEnterTerra: () => void }) {
  const { language } = useLanguage()
  const english = language === "en"
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null)
  const planet = selectedPlanet ? (english ? PLANETS_EN[selectedPlanet] : PLANETS[selectedPlanet]) : null
  return <section className={styles.routeView} aria-labelledby="route-title"><div className={styles.routeMap}><div className={`${styles.routeAsset} ${styles.routeSpace}`} aria-hidden="true" /><div className={`${styles.routeAsset} ${styles.routeTerra}`} aria-hidden="true" /><div className={`${styles.routeAsset} ${styles.routeLuna}`} aria-hidden="true" /><div className={`${styles.routeAsset} ${styles.routeSol}`} aria-hidden="true" /><div className={styles.routeIntro}><span>01 / STELLAR ROUTE</span><h1 id="route-title">{english ? <>Choose the<br /><em>next route.</em></> : <>다음 항로를<br /><em>선택하세요.</em></>}</h1><p>{english ? "TERRA is open now. Other routes unlock through shared contributions." : "TERRA는 지금 입장할 수 있습니다. 다른 항로는 모든 탐사대의 공동 기여로 해금됩니다."}</p></div>{(["terra", "luna", "sol"] as const).map((id) => <button className={`${styles.planet} ${styles[`planet${id[0].toUpperCase()}${id.slice(1)}`]} ${selectedPlanet === id ? styles.planetActive : ""}`} type="button" key={id} onClick={() => setSelectedPlanet(id)} aria-pressed={selectedPlanet === id} aria-expanded={selectedPlanet === id} aria-controls="planet-information"><span className={styles.planetCore} /><strong>{PLANETS[id].name}</strong><small>{english ? (id === "terra" ? "OPEN" : id === "luna" ? "RESTORE " + progress + "%" : "LOCKED") : id === "terra" ? "입장 가능" : id === "luna" ? `복구 ${progress}%` : "잠김"}</small></button>)}<div className={styles.mapBrand} aria-label="FIRST LIGHT"><strong>FIRST LIGHT</strong><span><i />✦</span><small>TERRA</small></div><ChatDrawer nickname={nickname} messages={messages} onSend={onSend} /><span className={styles.mapCoordinate}>34° 18′ 22″ N&nbsp;&nbsp; / &nbsp;&nbsp;FIRST LIGHT NETWORK</span></div>{selectedPlanet && planet ? <aside id="planet-information" className={styles.planetPanel} aria-live="polite"><button className={styles.panelClose} type="button" onClick={() => setSelectedPlanet(null)} aria-label={english ? "Close planet information" : "행성 정보 닫기"}>×</button><div><span className={styles.panelNumber}>0{selectedPlanet === "terra" ? 1 : selectedPlanet === "luna" ? 2 : 3}</span><span className={styles.status}>{planet.status}</span></div><span className={styles.kicker}>{planet.kicker}</span><h2>{planet.name}</h2><p>{planet.summary}</p>{selectedPlanet === "luna" ? <div className={styles.unlockProgress}><span><strong>{english ? "ROUTE RESTORATION" : "공동 항로 복구"}</strong><b>{progress}%</b></span><i><b style={{ width: `${progress}%` }} /></i><small>{english ? "Wood · Iron · Signal Remnants · Reclaimed Parts" : "목재 · 철 · 시그널 잔해 · 재활용 부품"}</small></div> : null}<div className={styles.panelDivider} />{selectedPlanet === "terra" ? <button className={styles.enterButton} type="button" onClick={onEnterTerra}>{english ? "ENTER TERRA" : LEGACY_TERRA_ENTRY_LABEL}<span>→</span></button> : <button className={styles.lockedButton} type="button" disabled>{english ? "TRAVEL UNAVAILABLE" : "현재 이동할 수 없습니다"}</button>}<small className={styles.panelHint}>{english ? "Other routes unlock through shared restoration progress." : "다른 행성은 공동 복구율에 따라 열립니다."}</small></aside> : null}</section>
}

function PlazaMiniGame({ kind, phaseLabel, onClose }: { readonly kind: PlazaGame; readonly phaseLabel: string; readonly onClose: () => void }) {
  const [timingPosition, setTimingPosition] = useState(0)
  const [timingResult, setTimingResult] = useState<"idle" | "success" | "miss">("idle")
  const [patternPhase, setPatternPhase] = useState<"showing" | "input" | "success" | "miss">("showing")
  const [patternStep, setPatternStep] = useState(0)
  const [activeNode, setActiveNode] = useState<number | null>(null)

  useEffect(() => {
    if (kind !== "timing" || timingResult !== "idle") return
    const timer = window.setInterval(() => setTimingPosition((position) => position >= 100 ? 0 : position + 2), 32)
    return () => window.clearInterval(timer)
  }, [kind, timingResult])

  useEffect(() => {
    if (kind !== "pattern" || patternPhase !== "showing") return
    let cursor = 0
    const timer = window.setInterval(() => {
      if (cursor >= PATTERN_SEQUENCE.length) {
        window.clearInterval(timer)
        setActiveNode(null)
        setPatternPhase("input")
        return
      }
      setActiveNode(PATTERN_SEQUENCE[cursor])
      cursor += 1
    }, 520)
    return () => window.clearInterval(timer)
  }, [kind, patternPhase])

  const resetTiming = () => { setTimingPosition(0); setTimingResult("idle") }
  const resetPattern = () => { setPatternStep(0); setActiveNode(null); setPatternPhase("showing") }
  const pressTiming = () => {
    if (timingResult !== "idle") { resetTiming(); return }
    setTimingResult(timingPosition >= 42 && timingPosition <= 58 ? "success" : "miss")
  }
  const pressNode = (node: number) => {
    if (patternPhase !== "input") return
    if (node !== PATTERN_SEQUENCE[patternStep]) { setPatternPhase("miss"); return }
    if (patternStep === PATTERN_SEQUENCE.length - 1) { setPatternPhase("success"); return }
    setPatternStep((step) => step + 1)
  }

  return <div className={styles.plazaGameBackdrop}><section className={styles.plazaMiniGame} role="dialog" aria-modal="true" aria-labelledby="plaza-game-title">
    <header><div><span className={styles.plazaGameKicker}>UNKNOWN SIGNAL / {phaseLabel}</span><h2 id="plaza-game-title">{kind === "timing" ? "신호 타이밍 정렬" : "신호 패턴 해독"}</h2></div><button type="button" onClick={onClose} aria-label="미니게임 닫기">×</button></header>
    {kind === "timing" ? <div className={styles.plazaGameBody}><p>움직이는 포인터가 목표 구간에 들어오면 신호를 고정하세요.</p><div className={styles.plazaSignalTrack} aria-label="신호 포인터"><span /><b style={{ left: `${timingPosition}%` }} /></div><div className={styles.plazaGameStatus} role="status">{timingResult === "success" ? "정렬 완료 · 미확인 신호가 안정화되었습니다." : timingResult === "miss" ? "동기화 실패 · 다시 타이밍을 맞추세요." : "목표 구간 42–58%"}</div><button className={styles.plazaGameAction} type="button" onClick={pressTiming}>{timingResult === "idle" ? "신호 고정" : "다시 시도"}</button></div> : <div className={styles.plazaGameBody}><p>노드가 빛난 순서를 기억한 뒤 같은 순서로 클릭하세요.</p><div className={styles.plazaSignalNodes}>{[0, 1, 2, 3].map((node) => <button type="button" key={node} className={activeNode === node ? styles.plazaSignalNodeActive : ""} onClick={() => pressNode(node)} disabled={patternPhase !== "input"} aria-label={`신호 노드 ${node + 1}`}>{node + 1}</button>)}</div><div className={styles.plazaGameStatus} role="status">{patternPhase === "showing" ? "신호 패턴을 수신 중입니다…" : patternPhase === "success" ? "해독 완료 · 신호 출처 좌표를 확보했습니다." : patternPhase === "miss" ? "순서 불일치 · 패턴을 다시 수신하세요." : `${patternStep} / ${PATTERN_SEQUENCE.length} 노드 입력`}</div><button className={styles.plazaGameAction} type="button" disabled={patternPhase === "showing"} onClick={resetPattern}>{patternPhase === "showing" ? "패턴 수신 중" : "다시 패턴 수신"}</button></div>}
  </section></div>
}

export function PlazaNewsPanel({ headingId = "plaza-news-title", className }: { readonly headingId?: string; readonly className?: string }) {
  const { language } = useLanguage()
  const [news, setNews] = useState<readonly PlazaNewsItem[]>(() => PLAZA_NEWS_LINES.slice(0, 3).map((item, index) => ({ ...item, englishCategory: PLAZA_NEWS_EN[index].category, englishBody: PLAZA_NEWS_EN[index].body, id: `seed-news-${index}`, time: index === 0 ? "방금" : `${index * 2}분 전` })))
  useEffect(() => {
    let sequence = 3
    const timer = window.setInterval(() => {
      const itemIndex = sequence++ % PLAZA_NEWS_LINES.length
      const item = PLAZA_NEWS_LINES[itemIndex]
      setNews((current) => [{ ...item, englishCategory: PLAZA_NEWS_EN[itemIndex].category, englishBody: PLAZA_NEWS_EN[itemIndex].body, id: `live-news-${Date.now()}-${sequence}`, time: "방금" }, ...current].slice(0, 5))
    }, 5_600)
    return () => window.clearInterval(timer)
  }, [])
  return <section className={className ? `${styles.plazaNews} ${className}` : styles.plazaNews} aria-labelledby={headingId}><header><div><span className={styles.liveDot} /><h2 id={headingId}>{language === "en" ? "PLAZA NEWS" : "광장 뉴스"}</h2></div><small>LIVE</small></header><ul aria-live="polite">{news.map((item) => <li key={item.id}><span>{language === "en" ? item.englishCategory ?? "PLAZA UPDATE" : item.category}</span><p>{language === "en" ? item.englishBody ?? "A new plaza update has arrived." : item.body}</p><time>{language === "en" ? (item.time === "방금" ? "NOW" : item.time.replace("분 전", "MIN AGO")) : item.time}</time></li>)}</ul></section>
}

function PlazaView({ nickname, messages, onSend }: { readonly nickname: string; readonly messages: readonly ChatMessage[]; readonly onSend: (body: string, channel: Exclude<ChatChannel, "system">) => void }) {
  const { language } = useLanguage()
  const english = language === "en"
  const [simulationSecond, setSimulationSecond] = useState(() => Math.floor(Date.now() / 1000) % 24)
  const [testPhase, setTestPhase] = useState<PlazaPhase | null>(null)
  const [activeGame, setActiveGame] = useState<PlazaGame | null>(null)
  const [activeSignals, setActiveSignals] = useState<readonly ActivePlazaSignal[]>([])
  useEffect(() => { const timer = window.setInterval(() => setSimulationSecond((second) => (second + 1) % 24), 1_000); return () => window.clearInterval(timer) }, [])
  useEffect(() => {
    const spawnWave = () => {
      if (Math.random() > 0.62) return
      const now = Date.now()
      const positions = [...SIGNAL_POSITIONS].sort(() => Math.random() - 0.5).slice(0, 3)
      setActiveSignals(positions.map((position, index) => ({ id: `signal-${now}-${index}`, kind: Math.random() > 0.5 ? "timing" : "pattern", ...position, expiresAt: now + 60_000 })))
    }
    const spawner = window.setInterval(spawnWave, 30_000)
    const cleaner = window.setInterval(() => setActiveSignals((signals) => signals.filter((signal) => signal.expiresAt > Date.now())), 1_000)
    return () => { window.clearInterval(spawner); window.clearInterval(cleaner) }
  }, [])
  const phaseId = testPhase ?? PLAZA_PHASE_ORDER[Math.floor(simulationSecond / 6)]
  const [displayedPhase, setDisplayedPhase] = useState<PlazaPhase>(() => getPlazaPhase(new Date()))
  const [previousPhase, setPreviousPhase] = useState<PlazaPhase | null>(null)
  useEffect(() => {
    if (phaseId === displayedPhase) return
    setPreviousPhase(displayedPhase)
    setDisplayedPhase(phaseId)
    const timer = window.setTimeout(() => setPreviousPhase(null), 780)
    return () => window.clearTimeout(timer)
  }, [displayedPhase, phaseId])
  const phase = english ? PLAZA_PHASE_EN[phaseId] : PLAZA_PHASES[phaseId]
  const clock = `${String(simulationSecond).padStart(2, "0")}:00`
  const phaseAsset = (id: PlazaPhase) => id === "dawn" ? "day" : id
  const phaseBackdropClass = (id: PlazaPhase) => id === "dawn" ? styles.plazaBackdropDawn : id === "day" ? styles.plazaBackdropDay : id === "evening" ? styles.plazaBackdropEvening : styles.plazaBackdropNight
  return <section className={`${styles.contentView} ${styles.plazaView}`} aria-label={english ? "Plaza" : "광장"}>
      <div className={styles.plazaScene} aria-hidden="true">
        {previousPhase ? <div key={`leave-${previousPhase}`} className={`${styles.plazaBackdrop} ${styles.plazaBackdropLeaving} ${phaseBackdropClass(previousPhase)}`} style={{ backgroundImage: `url('/assets/backgrounds/terra-plaza/time-of-day/terra-plaza-${phaseAsset(previousPhase)}.png')` }} /> : null}
        <div key={`enter-${displayedPhase}`} className={`${styles.plazaBackdrop} ${styles.plazaBackdropEntering} ${phaseBackdropClass(displayedPhase)}`} style={{ backgroundImage: `url('/assets/backgrounds/terra-plaza/time-of-day/terra-plaza-${phaseAsset(displayedPhase)}.png')` }} />
      </div>
      <div className={styles.plazaInteractionLayer} aria-label={english ? "Plaza signal interactions" : "광장 신호 상호작용"}>
        {activeSignals.map((signal) => { const signalTitle = signal.kind === "timing" ? (english ? "SIGNAL TIMING ALIGNMENT" : "신호 타이밍 정렬") : (english ? "SIGNAL PATTERN DECODING" : "신호 패턴 해독"); return <button key={signal.id} className={`${styles.plazaInteraction} ${signal.kind === "timing" ? styles.plazaTimingSpot : styles.plazaPatternSpot}`} style={{ left: `${signal.left}%`, top: `${signal.top}%` }} type="button" onClick={() => setActiveGame(signal.kind)} aria-haspopup="dialog"><span>{english ? "UNKNOWN SIGNAL" : "미확인 신호"}</span><strong>{signalTitle}</strong><small>{phase.label} {english ? "ACTIVE" : "활성"}</small></button> })}
      </div>
      {activeGame ? <PlazaMiniGame kind={activeGame} phaseLabel={phase.label} onClose={() => setActiveGame(null)} /> : null}
      <div className={styles.plazaHud}>
      <section className={styles.plazaTimeCard} aria-labelledby="plaza-time-title">
        <header><strong id="plaza-time-title">TERRA</strong><span>{testPhase ? (english ? "TEST" : "테스트") : (english ? "LIVE" : "실시간")}</span></header>
        <div className={styles.plazaClock}><strong>{clock}</strong><span>· {phase.label}</span></div>
        <p>{english ? "PLAZA BACKDROP CHANGES WITH THE TIME OF DAY" : "시간대에 따라 바뀌는 광장 배경"}</p>
        <div className={styles.plazaPhaseMeta}><span>{phase.time}</span><span>{phase.source} · {phase.treatment}</span></div>
        <div className={styles.plazaTestControls} role="group" aria-label={english ? "Time of day test" : "시간대 테스트"}>
          <button type="button" className={testPhase === null ? styles.plazaPhaseActive : ""} onClick={() => setTestPhase(null)} aria-pressed={testPhase === null}>{english ? "LIVE" : "실시간"}</button>
          {(Object.keys(PLAZA_PHASES) as PlazaPhase[]).map((item) => <button type="button" key={item} className={testPhase === item ? styles.plazaPhaseActive : ""} onClick={() => setTestPhase(item)} aria-pressed={testPhase === item}>{english ? PLAZA_PHASE_EN[item].label : PLAZA_PHASES[item].label}</button>)}
        </div>
      </section>
      <PlazaNewsPanel />
      <div className={styles.plazaChatSlot}><ChatWindow nickname={nickname} messages={messages} onSend={onSend} /></div>
    </div>
  </section>
}

function BuildView({ nickname, inventory, contributed, progress, resourceCount, onDeposit, feedback }: { readonly nickname: string; readonly inventory: ResourceInventory; readonly contributed: ResourceInventory; readonly progress: number; readonly resourceCount: number; readonly onDeposit: (resource: ResourceKey, amount: number) => void; readonly feedback: string }) {
  const { language } = useLanguage()
  const english = language === "en"
  const stage = progress >= 100 ? 100 : progress >= 75 ? 75 : progress >= 50 ? 50 : progress >= 25 ? 25 : 0
  const totalContributed = Object.values(contributed).reduce((sum, value) => sum + value, 0)
  return <section className={`${styles.contentView} ${styles.buildView}`} aria-labelledby="build-title"><div key={stage} className={styles.buildBackground} style={{ backgroundImage: `url(/assets/backgrounds/terra-construction/terra-construction-${stage}.png)` }} aria-hidden="true" /><div className={styles.buildOverlay} /><div className={styles.buildEffects} aria-hidden="true" /><header className={styles.sectionHeading}><span>03 / JOINT CONSTRUCTION</span><h1 id="build-title">TERRA <em>{english ? "PROJECT BASE" : "공동기지"}</em></h1><p>{english ? "A shared base grows through the resources contributed by every explorer." : "녹슬고 낡은 지구 기지가 공동 기여에 따라 거대한 탐사 거점으로 다시 살아납니다."}</p></header><div className={styles.buildGrid}><CommunityBuildPanel inventory={inventory} contributed={contributed} progress={progress} onDeposit={onDeposit} /><aside className={styles.contribution}><span>COLLECTIVE SIGNAL</span><strong>{progress}%</strong><p>{english ? <>Resources contributed by <b className={styles.contributorName}>{nickname}</b> are helping restore the TERRA base.</> : <><b className={styles.contributorName}>{nickname}</b>님이 기여한 자원 평균으로 계산한 TERRA 기지 복구율입니다.</>}</p><div /><h2>{english ? "THIS SESSION" : "이번 세션 기여"}</h2><p>{english ? <>Resources collected <b>{resourceCount.toLocaleString("en-US")}</b><br />Resources deposited <b>{totalContributed.toLocaleString("en-US")}</b></> : <>탐사 중 확보한 자원 <b>{resourceCount.toLocaleString("ko-KR")}</b><br />공동 창고로 보낸 자원 <b>{totalContributed.toLocaleString("ko-KR")}</b></>}</p><p className={styles.buildFeedback} role="status" aria-live="polite">{feedback || (english ? "Contribute resources to record your signal at the TERRA base." : "자원을 넣으면 TERRA 기지에 기록됩니다.")}</p>{progress >= 100 ? <strong className={styles.unlockBadge}>{english ? "TERRA BASE ACTIVATED" : "TERRA 기지 활성화"}</strong> : null}</aside></div></section>
}

const MISSION_KIND_LABELS: Readonly<Record<MissionKind, string>> = { real: "현실 미션", ingame: "인게임 미션" }
const RESOURCE_LABELS: Readonly<Record<ResourceKey, string>> = { wood: "목재", iron: "철", signal: "시그널", reclaimed: "재활용 부품" }

const MISSION_KIND_SUBTITLES: Readonly<Record<MissionKind, string>> = {
  real: "집에서 가볍게, 밖에서 주변과 연결하는 현실 행동을 골라보세요.",
  ingame: "게임 안에서 따뜻한 말로 서로의 신호를 이어보세요.",
}

const MISSION_DIFFICULTY_LABELS: Readonly<Record<MissionDifficulty, { readonly label: string; readonly detail: string }>> = {
  easy: { label: "쉬움", detail: "집에서 가볍게" },
  normal: { label: "보통", detail: "밖에서 주변과" },
  hard: { label: "어려움", detail: "사진으로 남기기" },
}

function MissionsView({ missions, posts, onStartMission, onCompleteMission, onPraise, onRerollMission }: { readonly missions: readonly DailyMission[]; readonly posts: readonly SignalPost[]; readonly onStartMission: (missionId: string) => void; readonly onCompleteMission: (completion: MissionCompletion) => void; readonly onPraise: (postId: string) => void; readonly onRerollMission: (missionId: string, kind: MissionKind, difficulty: MissionDifficulty) => void }) {
  const [activeMission, setActiveMission] = useState<DailyMission | null>(null)
  const [note, setNote] = useState("")
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoError, setPhotoError] = useState("")
  const [kind, setKind] = useState<MissionKind>("real")
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("easy")
  const [collapsed, setCollapsed] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const completed = missions.filter((mission) => mission.status === "complete").length
  const visibleMissions = missions.filter((mission) => mission.kind === kind).sort((left, right) => Number(left.difficulty !== difficulty) - Number(right.difficulty !== difficulty)).slice(0, 3)
  const openMissionLog = (mission: DailyMission) => { setActiveMission(mission); setNote(""); setPhoto(undefined); setPhotoError("") }
  const startMission = (mission: DailyMission) => { if (mission.status === "complete") return; if (mission.status === "not-started") { onStartMission(mission.id); return } openMissionLog(mission) }
  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const validType = ["image/jpeg", "image/png", "image/webp"].includes(file.type); if (!validType) { setPhotoError("JPG, PNG, WebP 이미지만 선택할 수 있습니다."); return } if (file.size > 5 * 1024 * 1024) { setPhotoError("사진은 5MB 이하만 등록할 수 있습니다."); return } const reader = new FileReader(); reader.onload = () => { setPhoto(typeof reader.result === "string" ? reader.result : undefined); setPhotoError("") }; reader.readAsDataURL(file) }
  const submit = () => { if (!activeMission || photoError) return; onCompleteMission({ missionId: activeMission.id, note: note.trim(), photo }); setActiveMission(null) }
  return <section className={styles.contentView + " " + styles.missionView} aria-labelledby="mission-picker-title"><div className={styles.missionBackground} style={{ backgroundImage: "url(/assets/backgrounds/terra-missions/terra-missions-hub.png)" }} aria-hidden="true" /><div className={styles.missionOverlay} aria-hidden="true" /><div className={styles.missionEffects} aria-hidden="true" /><button className={styles.missionFoldTag} type="button" onClick={() => setCollapsed((current) => !current)} aria-expanded={!collapsed}>{collapsed ? "미션 열기" : "미션 접기"} <span>{collapsed ? "→" : "←"}</span></button><div className={styles.missionSplit + " " + (collapsed ? styles.missionSplitCollapsed : "")}><section className={styles.missionPanel + " " + (collapsed ? styles.missionPanelCollapsed : "")} aria-labelledby="mission-picker-title"><header className={styles.missionPanelHeader}><div><span>MISSION SELECT</span><h1 id="mission-picker-title">오늘의 미션</h1><p className={styles.missionPanelSubtitle}>{MISSION_KIND_SUBTITLES[kind]}</p></div><div className={styles.missionPanelMeta}><div className={styles.completedSignal}><span>완료된 신호</span><b>{completed} / {MISSION_DAILY_LIMIT}</b></div></div></header><div className={styles.missionSelectControls}><div className={styles.missionKindTabs} role="tablist" aria-label="미션 종류">{(Object.keys(MISSION_KIND_LABELS) as MissionKind[]).map((item) => <button type="button" key={item} className={kind === item ? styles.missionKindActive : ""} onClick={() => setKind(item)} aria-pressed={kind === item}>{MISSION_KIND_LABELS[item]}</button>)}</div><button className={styles.missionReceive} type="button" onClick={() => onRequestMission(kind)} disabled={completed >= MISSION_DAILY_LIMIT}>미션 받기 <span>+</span></button></div><div className={styles.missionOfferList}>{visibleMissions.length ? visibleMissions.map((mission) => <article className={styles.missionOffer + " " + (mission.status === "complete" ? styles.missionOfferComplete : "")} key={mission.id}><header><span>{mission.code} · {mission.category}</span><b>{mission.status === "complete" ? "기록됨" : mission.status === "in-progress" ? "진행 중" : "대기 중"}</b></header><h3>{mission.title}</h3><p>{mission.detail}</p><footer><span>{mission.duration}</span><strong>+{mission.rewardXp} XP · {RESOURCE_LABELS[mission.rewardResource]} +{mission.rewardAmount}</strong><button type="button" onClick={() => startMission(mission)} disabled={mission.status === "complete"}>{mission.status === "complete" ? "완료" : mission.status === "in-progress" ? "완료 기록" : "미션 시작"}</button></footer></article>) : <div className={styles.missionEmpty}>아직 받은 {MISSION_KIND_LABELS[kind]}이 없습니다.<br />미션 받기를 눌러 새로운 신호를 받아보세요.</div>}</div></section><aside className={styles.missionSignals + " " + (collapsed ? styles.missionSignalsExpanded : "")} aria-labelledby="mission-signals-title"><header className={styles.missionSignalHeader}><div><span>SIGNAL ARCHIVE</span><h2 id="mission-signals-title">사람들의 신호 보관소</h2><p>완료된 미션은 이곳에 실시간으로 도착합니다.</p></div><div className={styles.missionSignalMeta}><strong>{posts.length}<small>기록</small></strong></div></header>{posts.length ? <div className={styles.missionSignalList} aria-live="polite">{posts.slice(0, 8).map((post) => <article className={styles.missionSignalItem} key={post.id}><header><div><strong>{post.author}</strong><small>{post.missionTitle}</small></div><time>{post.createdAt}</time></header>{post.photo ? <img src={post.photo} alt="탐사대원이 공유한 미션 사진" /> : null}<p>{post.note || "소감 없이도 오늘의 행동을 기록했습니다."}</p><footer><span>작은 신호가 도착했습니다.</span><button type="button" className={post.praised ? styles.praiseActive : ""} onClick={() => onPraise(post.id)} disabled={post.praised} aria-pressed={post.praised}>♡ 응원 {post.praiseCount}</button></footer></article>)}</div> : <div className={styles.missionSignalEmpty}><span>✦</span><h3>아직 도착한 신호가 없습니다.</h3><p>첫 미션을 완료하면 사진과 소감이 이곳에 보관됩니다.</p></div>}</aside></div>{activeMission ? <div className={styles.dialogBackdrop} role="presentation"><section className={styles.missionDialog} role="dialog" aria-modal="true" aria-labelledby="mission-dialog-title"><header><div><span>MISSION LOG</span><h2 id="mission-dialog-title">{activeMission.title}</h2></div><button className={styles.dialogClose} type="button" onClick={() => setActiveMission(null)} aria-label="미션 기록 닫기">×</button></header><p>{activeMission.detail}</p><label htmlFor="mission-note">짧은 소감 <small>선택 사항</small></label><textarea id="mission-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="오늘의 작은 신호를 남겨보세요." /><div className={styles.photoPicker}><div><strong>사진 한 장</strong><small>하늘, 별, 식물, 동네의 순간 · 선택 사항</small></div><button type="button" onClick={() => fileInput.current?.click()}>사진 선택</button><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} /></div>{photo ? <img className={styles.missionPhotoPreview} src={photo} alt="선택한 미션 사진 미리보기" /> : null}{photoError ? <p className={styles.photoError} role="alert">{photoError}</p> : null}<footer><button type="button" className={styles.secondaryAction} onClick={() => setActiveMission(null)}>나중에</button><button type="button" className={styles.primaryAction} onClick={submit} disabled={Boolean(photoError)}>완료 등록 <span>→</span></button></footer></section></div> : null}</section>
}

export function TerraCommandCenter({ profile, inventory, progress, resourceCount, messages, onSendMessage, onEnterTerra, musicEnabled, onToggleMusic, onTabChange }: TerraCommandCenterProps) {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState<TerminalTab>("community")
  useEffect(() => { onTabChange(activeTab) }, [activeTab, onTabChange])
  const [localInventory, setLocalInventory] = useState<ResourceInventory>(inventory)
  const [contributed, setContributed] = useState<ResourceInventory>(ZERO_RESOURCES)
  const [missions, setMissions] = useState<readonly DailyMission[]>(INITIAL_MISSIONS)
  const [posts, setPosts] = useState<readonly SignalPost[]>(SEED_SIGNAL_POSTS)
  const [buildFeedback, setBuildFeedback] = useState("")
  const depositResource = (resource: ResourceKey, amount: number) => {
    const safeAmount = Math.min(Math.max(0, amount), localInventory[resource])
    if (!safeAmount) { setBuildFeedback("보유 자원이 부족합니다."); return }
    const nextContributed = { ...contributed, [resource]: contributed[resource] + safeAmount }
    setLocalInventory((current) => ({ ...current, [resource]: current[resource] - safeAmount }))
    setContributed(nextContributed)
    setBuildFeedback("공동 항로에 기여했습니다.")
  }
  const completeMission = ({ missionId, note, photo }: MissionCompletion) => {
    const mission = missions.find((item) => item.id === missionId)
    if (!mission || mission.status === "complete" || missions.filter((item) => item.status === "complete").length >= MISSION_DAILY_LIMIT) return
    setMissions((current) => current.map((item) => item.id === missionId ? { ...item, status: "complete" } : item))
    setPosts((current) => [{ id: `${Date.now()}-${missionId}`, author: profile.nickname, missionTitle: mission.title, note, photo, createdAt: formatTime(), praiseCount: 0, praised: false }, ...current])
    setLocalInventory((current) => ({ ...current, [mission.rewardResource]: current[mission.rewardResource] + mission.rewardAmount }))
    setBuildFeedback(`미션 완료 · +${mission.rewardXp} XP · ${mission.rewardResource} +${mission.rewardAmount}`)
  }
  const startMission = (missionId: string) => setMissions((current) => current.map((mission) => mission.id === missionId && mission.status === "not-started" ? { ...mission, status: "in-progress" } : mission))
  const praisePost = (postId: string) => setPosts((current) => current.map((post) => post.id === postId && !post.praised ? { ...post, praised: true, praiseCount: post.praiseCount + 1 } : post))
  const requestMission = (kind: MissionKind) => {
    if (missions.filter((mission) => mission.status === "complete").length >= MISSION_DAILY_LIMIT) { setBuildFeedback(`오늘의 미션 ${MISSION_DAILY_LIMIT}개를 모두 기록했습니다.`); return }
    const candidate = MISSION_POOL.find((mission) => mission.kind === kind && !missions.some((current) => current.id === mission.id))
    if (!candidate) { setBuildFeedback("이 종류의 새로운 미션이 없습니다. 다른 종류를 선택해보세요."); return }
    setMissions((current) => [...current, candidate])
    setBuildFeedback("새로운 미션 신호를 받았습니다.")
  }
  const rerollMission = (missionId: string, kind: MissionKind, difficulty: MissionDifficulty) => {
    const candidate = MISSION_POOL.find((mission) => mission.kind === kind && mission.difficulty === difficulty && mission.id !== missionId && !missions.some((current) => current.id === mission.id))
    if (!candidate) { setBuildFeedback("같은 난이도의 새로운 미션이 없습니다."); return }
    setMissions((current) => current.map((mission) => mission.id === missionId ? { ...candidate, status: "not-started" } : mission))
    setBuildFeedback("새로운 미션으로 교체했습니다.")
  }
  const currentProgress = calculateBuildProgress(contributed)
  const progression = calculatePlayerProgression(contributed, missions)
  const navItems = language === "en" ? NAV_ITEMS_EN : NAV_ITEMS
  return <main className={styles.commandCenter}><header className={styles.header}><nav aria-label={language === "en" ? "Main command navigation" : "관제실 주 메뉴"}>{navItems.map((item) => <button type="button" key={item.id} className={activeTab === item.id ? styles.navActive : ""} onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? "page" : undefined}><strong>{item.label}</strong></button>)}</nav><div className={styles.headerStatus}><LanguageToggle /><TerraMusicToggle enabled={musicEnabled} onToggle={onToggleMusic} /><ResourceHud inventory={localInventory} /><PlayerProfile nickname={profile.nickname} progression={progression} /></div></header><div className={styles.screen}>{activeTab === "map" ? <RouteMap progress={currentProgress} nickname={profile.nickname} messages={messages} onSend={onSendMessage} onEnterTerra={onEnterTerra} /> : activeTab === "community" ? <PlazaView nickname={profile.nickname} messages={messages} onSend={onSendMessage} /> : activeTab === "build" ? <BuildView nickname={profile.nickname} inventory={localInventory} contributed={contributed} progress={currentProgress} resourceCount={resourceCount} onDeposit={depositResource} feedback={buildFeedback} /> : activeTab === "missions" ? <DailyMissionWorkspace missions={missions} posts={posts} onStartMission={startMission} onCompleteMission={completeMission} onPraise={praisePost} onRerollMission={rerollMission} /> : null}</div></main>
}
