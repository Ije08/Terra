"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { TerraCanvas } from "./components/TerraCanvas"
import { formatTime, TerraCommandCenter, type ChatMessage, type ChatSendHandler } from "./components/TerraCommandCenter"
import { ResourceHud, type ResourceInventory, type ResourceKey } from "./components/TerraCommandUi"
import { TerraAudioManager, type TerraMusicTrack } from "./components/TerraAudioManager"
import { TerraStartScreen } from "./components/TerraStartScreen"
import { TerraForestPrototype } from "./components/TerraForestPrototype"
import { useLanguage } from "./components/LanguageProvider"
import { getCharacterIdleSheetPath } from "./game/characters"
import type { AppScreen, CharacterGender, CharacterProfile, TerminalTab } from "./game/types"

const OUTFIT_COLORS = ["#78c9d6", "#d79a73", "#a68cda"] as const
const PROFILE_STORAGE_KEY = "terra.character-profile"
const LOADING_DURATION_MS = 1600
type LoadingDestination = "login" | "create-account" | "plaza"
const CHARACTER_VARIANT_FOR_GENDER = { male: "composed", female: "silver-braid" } as const

const LOADING_COPY: Record<LoadingDestination, { readonly eyebrow: string; readonly title: string; readonly description: string }> = {
  login: { eyebrow: "ACCOUNT SIGNAL", title: "로그인하는 중", description: "탐사대원 신호를 확인하고 있습니다." },
  "create-account": { eyebrow: "NEW SIGNAL", title: "캐릭터 생성으로 이동 중", description: "새 탐사대원의 신호를 준비하고 있습니다." },
  plaza: { eyebrow: "TERRA ACCESS · FOREST 01", title: "바람이 머무는 숲", description: "수채화 생태지대의 탐사 신호를 연결하고 있습니다." },
}
const LOADING_COPY_EN: Record<LoadingDestination, { readonly eyebrow: string; readonly title: string; readonly description: string }> = {
  login: { eyebrow: "ACCOUNT SIGNAL", title: "Signing in", description: "Verifying your explorer signal." },
  "create-account": { eyebrow: "NEW SIGNAL", title: "Opening explorer creation", description: "Preparing a new explorer signal." },
  plaza: { eyebrow: "TERRA ACCESS · FOREST 01", title: "Where the wind rests", description: "Connecting the watercolor ecology zone." },
}

const DEFAULT_PROFILE: CharacterProfile = {
  nickname: "탐사대원",
  gender: "female",
  bodyType: "terra",
  headVariant: CHARACTER_VARIANT_FOR_GENDER.female,
  hairVariant: "orbit",
  outfitVariant: "field",
  outfitColor: OUTFIT_COLORS[0],
  createdAt: "",
}

const INITIAL_RESOURCE_INVENTORY: ResourceInventory = { wood: 30, iron: 12, signal: 2, reclaimed: 8 }
const RESOURCE_KEY_BY_LABEL: Readonly<Record<string, ResourceKey>> = { "시그널 잔해": "signal", "재활용 부품": "reclaimed" }

function isValidNickname(nickname: string): boolean {
  return /^[가-힣A-Za-z0-9_ ]{2,12}$/.test(nickname.trim())
}

function previewSuitFilter(outfitColor: string): string | undefined {
  if (outfitColor === "#d79a73") return "hue-rotate(-18deg) saturate(1.12)"
  if (outfitColor === "#a68cda") return "hue-rotate(32deg) saturate(1.08)"
  return undefined
}

function CharacterPreview({ gender, nickname, outfitColor }: { readonly gender: CharacterGender; readonly nickname: string; readonly outfitColor: string }) {
  const headVariant = CHARACTER_VARIANT_FOR_GENDER[gender]
  const suitFilter = previewSuitFilter(outfitColor)
  return <div className="character-preview" data-gender={gender} style={{ "--signal-color": outfitColor } as CSSProperties}>
    <div className="preview-stars" aria-hidden="true" /><div className="preview-orb" aria-hidden="true" />
    <div className="character-preview-sprite" role="img" aria-label={`${gender === "male" ? "남성" : "은발 여성"} 탐사대원`} style={{ backgroundImage: `url(${getCharacterIdleSheetPath(gender, headVariant)})`, backgroundSize: "400% 400%", filter: suitFilter }} />
    <span className="preview-name">{nickname.trim() || "탐사대원"}</span><span className="preview-badge">TERRA · {gender === "male" ? "남성" : "은발 여성"} 탐사대원</span>
  </div>
}

function CharacterCreate({ initialProfile, onComplete, onBack }: { readonly initialProfile: CharacterProfile | null; readonly onComplete: (profile: CharacterProfile) => void; readonly onBack: () => void }) {
  const seedProfile = initialProfile ?? DEFAULT_PROFILE
  const isReturning = Boolean(initialProfile)
  const [nickname, setNickname] = useState(seedProfile.nickname)
  const [gender, setGender] = useState<CharacterGender>(seedProfile.gender)
  const [outfitColor, setOutfitColor] = useState<string>(seedProfile.outfitColor)
  const [error, setError] = useState("")
  const { language } = useLanguage()
  const copy = language === "en" ? {
    editLead: "Adjust your explorer",
    editAccent: "signal",
    editTail: "again.",
    createLead: "Create your",
    createAccent: "explorer",
    createTail: "for the journey.",
    editDescription: "Review your saved explorer and update the nickname or appearance.",
    createDescription: "Choose a gender and suit color, then set your personal signal.",
    backHome: "← Start screen",
    back: "← Back",
    statusSaved: "Saved signal",
    statusLocal: "Local dev mode",
    explorer: "Explorer",
    male: "Male explorer",
    female: "Silver-haired explorer",
    name: "Explorer name",
    nameHelp: "2–12 characters · visible to other explorers.",
    suit: "Suit color",
    save: "Save changes",
    start: "Start with this look",
  } : {
    editLead: "탐사대원 신호를",
    editAccent: "다시 조정",
    editTail: "하세요.",
    createLead: "여정을 시작할",
    createAccent: "탐사대원",
    createTail: "을 만드세요.",
    editDescription: "저장된 탐사대원 정보를 확인하고 닉네임과 모습을 수정할 수 있습니다.",
    createDescription: "성별과 슈트 색상을 고르고, 나만의 신호를 정해보세요.",
    backHome: "← 시작 화면으로",
    back: "← 뒤로",
    statusSaved: "저장된 신호",
    statusLocal: "로컬 개발 모드",
    explorer: "탐사대원",
    male: "남성 탐사대원",
    female: "은발 여성 탐사대원",
    name: "탐사대원 이름",
    nameHelp: "2~12자 · 다른 사람에게 보이는 이름입니다.",
    suit: "슈트 색상",
    save: "변경 사항 저장하기",
    start: "이 모습으로 시작하기",
  }

  const submit = () => {
    const cleanNickname = nickname.trim()
    if (!isValidNickname(cleanNickname)) {
      setError(language === "en" ? "Use 2–12 Korean, English, number, or underscore characters." : "닉네임은 한글·영문·숫자·공백으로 2~12자까지 입력할 수 있습니다.")
      return
    }
    onComplete({ nickname: cleanNickname, gender, headVariant: CHARACTER_VARIANT_FOR_GENDER[gender], bodyType: "terra", hairVariant: "orbit", outfitVariant: "field", outfitColor, createdAt: new Date().toISOString() })
  }

  return <main className="flow-screen"><div className="flow-particle-field flow-particle-field--small" aria-hidden="true" /><div className="flow-particle-field flow-particle-field--medium" aria-hidden="true" /><div className="flow-particle-field flow-particle-field--large" aria-hidden="true" /><div className="flow-backdrop" aria-hidden="true" /><section className="create-layout" aria-labelledby="character-create-title">
    <div className="create-copy"><span className="eyebrow">{isReturning ? "PROFILE LINK" : "01 · YOUR SIGNAL"}</span><h1 id="character-create-title">{isReturning ? <>{copy.editLead}<br /><em>{copy.editAccent}</em>{copy.editTail}</> : <>{copy.createLead}<br /><em>{copy.createAccent}</em>{copy.createTail}</>}</h1><p>{isReturning ? copy.editDescription : copy.createDescription}</p><button className="text-button" type="button" onClick={onBack}>{copy.backHome}</button></div>
    <button className="create-back text-button" type="button" onClick={onBack}>{copy.back}</button>
    <div className="create-stage"><CharacterPreview gender={gender} nickname={nickname} outfitColor={outfitColor} /></div>
    <div className={`create-card${isReturning ? " create-card--edit" : ""}`}>
      <div className="create-card-header"><span className="create-mode">{isReturning ? "PROFILE EDITOR" : "NEW EXPLORER"}</span><span className="create-status"><i />{isReturning ? copy.statusSaved : copy.statusLocal}</span></div>
    <CharacterPreview gender={gender} nickname={nickname} outfitColor={outfitColor} />
      <div className="form-section"><span className="form-label" id="gender-label">{copy.explorer}</span><div className="choice-row" aria-labelledby="gender-label">{(["male", "female"] as const).map((choice) => <button aria-pressed={gender === choice} className={gender === choice ? "choice-button selected" : "choice-button"} type="button" key={choice} onClick={() => setGender(choice)}>{choice === "male" ? copy.male : copy.female}</button>)}</div></div>
      <div className="form-section"><label htmlFor="nickname">{copy.name}</label><input id="nickname" value={nickname} onChange={(event) => { setNickname(event.target.value); setError("") }} maxLength={12} autoComplete="nickname" autoFocus aria-invalid={Boolean(error)} aria-describedby="nickname-help" /><small id="nickname-help">{copy.nameHelp}</small>{error ? <p className="form-error" role="alert">{language === "en" ? "Use 2–12 Korean, English, number, or underscore characters." : error}</p> : null}</div>
      <div className="form-section"><span className="form-label" id="outfit-color-label">{copy.suit}</span><div className="color-row" aria-labelledby="outfit-color-label">{OUTFIT_COLORS.map((color) => <button aria-pressed={outfitColor === color} className={outfitColor === color ? "color-choice selected" : "color-choice"} style={{ backgroundColor: color }} type="button" key={color} onClick={() => setOutfitColor(color)} aria-label={`${copy.suit} ${color}`} />)}</div></div>
      <button className="primary-button full" type="button" onClick={submit}>{isReturning ? copy.save : copy.start} <span>→</span></button>
    </div>
  </section></main>
}

function LoadingSpinner() {
  return <div className="loading-spinner" aria-hidden="true"><div className="configure-border-1"><div className="configure-core" /></div><div className="configure-border-2"><div className="configure-core" /></div></div>
}

function LoadingScreen({ destination }: { readonly destination: LoadingDestination }) {
  const { language } = useLanguage()
  const copy = (language === "en" ? LOADING_COPY_EN : LOADING_COPY)[destination]
  return <main className={`loading-screen${destination === "plaza" ? " loading-screen--forest" : ""}`} role="status" aria-live="polite"><LoadingSpinner /><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.description}</p></main>
}

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("START")
  const [commandTab, setCommandTab] = useState<TerminalTab>("community")
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [profile, setProfile] = useState<CharacterProfile | null>(null)
  const [loadingDestination, setLoadingDestination] = useState<LoadingDestination | null>(null)
  const [resourceCount, setResourceCount] = useState(0)
  const [resourceInventory, setResourceInventory] = useState<ResourceInventory>(INITIAL_RESOURCE_INVENTORY)
  const [communityProgress, setCommunityProgress] = useState(12)
  const [toast, setToast] = useState("")
  const [chatMessages, setChatMessages] = useState<readonly ChatMessage[]>([
    { id: "system-arrival", channel: "system", author: "관제사", body: "TERRA 광장에 새로운 탐사 신호가 감지되었습니다.", time: "20:14" },
{ id: "local-iron", channel: "local", author: "대원_01", body: "LUNA 복구에 철이 더 필요해요.", englishBody: "LUNA needs more iron for restoration.", time: "20:16" },
{ id: "local-welcome", channel: "local", author: "대원_02", body: "신입대원 환영해요. 광장에서 만나요.", englishBody: "Welcome, new explorer. See you in the plaza.", time: "20:18" },
  ])

  useEffect(() => {
    if (screen !== "LOADING" || !loadingDestination) return
    const timeout = window.setTimeout(() => {
      if (loadingDestination === "plaza") {
        setLoadingDestination(null)
        setScreen("FOREST")
        return
      }

      if (loadingDestination === "login") {
        setProfile(null)
        setScreen("CHARACTER_CREATE")
      } else {
        setProfile(null)
        setScreen("CHARACTER_CREATE")
      }
      setLoadingDestination(null)
    }, LOADING_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [loadingDestination, screen])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(""), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const beginLoading = (destination: LoadingDestination) => {
    setLoadingDestination(destination)
    setScreen("LOADING")
  }

  const sendChatMessage: ChatSendHandler = (body, channel) => {
    setChatMessages((current) => [...current, { id: `${Date.now()}-${current.length}`, channel: channel === "all" ? "local" : channel, author: profile?.nickname ?? "탐사대원", body, time: formatTime() }])
  }

  const completeCharacterCreate = (nextProfile: CharacterProfile) => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile))
    setProfile(nextProfile)
    setCommandTab("community")
    setScreen("COMMAND")
  }

  const musicTrack: TerraMusicTrack = screen === "FOREST" || (screen === "LOADING" && loadingDestination === "plaza") ? "terra" : screen === "COMMAND" ? commandTab === "map" ? "route" : "social" : "start"
  const audioManager = <TerraAudioManager track={musicTrack} enabled={musicEnabled} />

  if (screen === "START") return <>{audioManager}<TerraStartScreen onLogin={() => beginLoading("login")} musicEnabled={musicEnabled} onToggleMusic={() => setMusicEnabled((enabled) => !enabled)} /></>
  if (screen === "CHARACTER_CREATE") return <>{audioManager}<CharacterCreate initialProfile={profile} onBack={() => setScreen("START")} onComplete={completeCharacterCreate} /></>
  if (screen === "LOADING") return <>{audioManager}<LoadingScreen destination={loadingDestination ?? "plaza"} /></>
  if (!profile) return <>{audioManager}<TerraStartScreen onLogin={() => beginLoading("login")} musicEnabled={musicEnabled} onToggleMusic={() => setMusicEnabled((enabled) => !enabled)} /></>
  if (screen === "COMMAND") return <>{audioManager}<TerraCommandCenter profile={profile} inventory={resourceInventory} progress={communityProgress} resourceCount={resourceCount} messages={chatMessages} onSendMessage={sendChatMessage} onEnterTerra={() => beginLoading("plaza")} musicEnabled={musicEnabled} onToggleMusic={() => setMusicEnabled((enabled) => !enabled)} onTabChange={setCommandTab} /></>
  if (screen === "FOREST") return <>{audioManager}<TerraForestPrototype character={profile} inventory={resourceInventory} messages={chatMessages} onSendMessage={sendChatMessage} onCollect={(label) => { const resourceKey: ResourceKey = label === "목재" ? "wood" : label === "철" ? "iron" : "reclaimed"; setResourceInventory((inventory) => ({ ...inventory, [resourceKey]: inventory[resourceKey] + 1 })); setResourceCount((count) => count + 1); setToast(`${label}을 확보했습니다.`) }} onReturn={() => { setCommandTab("community"); setScreen("COMMAND") }} /></>

  const scene = screen === "HOME" ? "home" : "plaza"
  const collectResource = (label: string) => {
    const resourceKey = RESOURCE_KEY_BY_LABEL[label]
    if (resourceKey) setResourceInventory((inventory) => ({ ...inventory, [resourceKey]: inventory[resourceKey] + 1 }))
    setResourceCount((count) => count + 1)
    setCommunityProgress((progress) => Math.min(100, progress + 8))
    setToast(`${label}를 확보했습니다 · 공동 건설에 기록되었습니다`)
  }

  return <main className="game-screen">
    <header className="play-header"><div className="game-brand"><span className="brand-star">✦</span><span><strong>FIRST LIGHT</strong><small>TERRA 광장</small></span></div><div className="play-header-side"><ResourceHud inventory={resourceInventory} /><div className="game-profile"><span className="profile-orb" style={{ backgroundColor: profile.outfitColor }} />{profile.nickname}</div><button className="play-return" type="button" onClick={() => setScreen("COMMAND")}>관제실로</button></div></header>
    <section className="play-stage"><TerraCanvas character={profile} scene={scene} onCollectResource={collectResource} onLeaveHome={() => beginLoading("plaza")} /></section>
    <footer className="game-footer"><span>자원을 수집해 공동 항로 복구에 기여하세요.</span><span>WASD / 방향키 이동 · F 상호작용 · 관제실에서 항로 확인</span></footer>
    {toast ? <div className="toast" role="status">✦ {toast}</div> : null}
  </main>

}
