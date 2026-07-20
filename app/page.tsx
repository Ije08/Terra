"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { TerraCanvas } from "./components/TerraCanvas"
import { TerraCommandCenter } from "./components/TerraCommandCenter"
import { ResourceHud, type ResourceInventory, type ResourceKey } from "./components/TerraCommandUi"
import { TerraStartScreen } from "./components/TerraStartScreen"
import { getCharacterAtlasPath } from "./game/characters"
import type { AppScreen, BodyType, CharacterGender, CharacterProfile, HeadVariant } from "./game/types"

const OUTFIT_COLORS = ["#78c9d6", "#d79a73", "#a68cda"] as const
const HEAD_LABELS: Readonly<Record<HeadVariant, string>> = { cute: "귀여움", composed: "도도" }
const CHARACTER_PRESETS = [
  { id: "male-cute", gender: "male", headVariant: "cute", label: "남성 · 귀여움", detail: "밝은 표정 · 탐사 재킷" },
  { id: "male-composed", gender: "male", headVariant: "composed", label: "남성 · 도도", detail: "차분한 표정 · 조사 코트" },
  { id: "female-cute", gender: "female", headVariant: "cute", label: "여성 · 귀여움", detail: "트윈 브레이드 · 탐사 재킷" },
  { id: "female-composed", gender: "female", headVariant: "composed", label: "여성 · 도도", detail: "은빛 라일락 · 조사 코트" },
] as const
const PROFILE_STORAGE_KEY = "terra.character-profile"
const LOADING_DURATION_MS = 1600
type LoadingDestination = "login" | "create-account" | "plaza"

const LOADING_COPY: Record<LoadingDestination, { readonly eyebrow: string; readonly title: string; readonly description: string }> = {
  login: { eyebrow: "ACCOUNT SIGNAL", title: "로그인하는 중", description: "탐사대원 신호를 확인하고 있습니다." },
  "create-account": { eyebrow: "NEW SIGNAL", title: "캐릭터 생성으로 이동 중", description: "새 탐사대원의 신호를 준비하고 있습니다." },
  plaza: { eyebrow: "TERRA ACCESS", title: "TERRA에 진입하는 중", description: "광장 좌표와 탐사대 신호를 연결하고 있습니다." },
}

const DEFAULT_PROFILE: CharacterProfile = {
  nickname: "별바람",
  gender: "male",
  bodyType: "terra",
  headVariant: "cute",
  hairVariant: "orbit",
  outfitVariant: "field",
  outfitColor: OUTFIT_COLORS[0],
  createdAt: "",
}

const INITIAL_RESOURCE_INVENTORY: ResourceInventory = { wood: 0, iron: 0, signal: 0, reclaimed: 0 }
const RESOURCE_KEY_BY_LABEL: Readonly<Record<string, ResourceKey>> = { "시그널 잔해": "signal", "재활용 부품": "reclaimed" }

function isValidNickname(nickname: string): boolean {
  return /^[가-힣A-Za-z0-9_ ]{2,12}$/.test(nickname.trim())
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readStoredProfile(rawProfile: string | null): CharacterProfile | null {
  if (!rawProfile) return null
  try {
    const value: unknown = JSON.parse(rawProfile)
    if (!isRecord(value)) return null
    const nickname = value.nickname
    const gender = value.gender === "female" ? "female" : "male"
    const bodyType = value.bodyType
    const headVariant = value.headVariant === "cute" ? "cute" : "composed"
    const hairVariant = value.hairVariant === "comet" || value.hairVariant === "tide" ? value.hairVariant : "orbit"
    const outfitVariant = value.outfitVariant === "survey" || value.outfitVariant === "signal" ? value.outfitVariant : "field"
    const outfitColor = value.outfitColor
    const createdAt = value.createdAt
    if (typeof nickname !== "string" || typeof bodyType !== "string" || typeof hairVariant !== "string" || typeof outfitColor !== "string" || typeof createdAt !== "string") return null
    if (bodyType !== "terra" && bodyType !== "luna") return null
    if (hairVariant !== "orbit" && hairVariant !== "comet" && hairVariant !== "tide") return null
    return { nickname, gender, bodyType, headVariant, hairVariant, outfitVariant, outfitColor, createdAt }
  } catch {
    return null
  }
}

function previewSuitFilter(outfitColor: string): string | undefined {
  if (outfitColor === "#d79a73") return "hue-rotate(-18deg) saturate(1.12)"
  if (outfitColor === "#a68cda") return "hue-rotate(32deg) saturate(1.08)"
  return undefined
}

function CharacterPreview({ gender, bodyType, headVariant, nickname, outfitColor }: { readonly gender: CharacterGender; readonly bodyType: BodyType; readonly headVariant: HeadVariant; readonly nickname: string; readonly outfitColor: string }) {
  const suitFilter = previewSuitFilter(outfitColor)
  return <div className="character-preview" data-body-type={bodyType} data-head-variant={headVariant} style={{ "--signal-color": outfitColor } as CSSProperties}>
    <div className="preview-stars" aria-hidden="true" /><div className="preview-orb" aria-hidden="true" />
    <div className="character-preview-sprite" role="img" aria-label={`${gender === "male" ? "남성" : "여성"} ${HEAD_LABELS[headVariant]} 탐사대원`} style={{ backgroundImage: `url(${getCharacterAtlasPath(gender, headVariant)})`, filter: suitFilter }} />
    <span className="preview-name">{nickname.trim() || "탐사대원"}</span><span className="preview-badge">{bodyType === "terra" ? "TERRA" : "LUNA"} · {gender === "male" ? "남성" : "여성"} · {HEAD_LABELS[headVariant]}</span>
  </div>
}

function CharacterCreate({ initialProfile, onComplete, onBack }: { readonly initialProfile: CharacterProfile | null; readonly onComplete: (profile: CharacterProfile) => void; readonly onBack: () => void }) {
  const seedProfile = initialProfile ?? DEFAULT_PROFILE
  const isReturning = Boolean(initialProfile)
  const [nickname, setNickname] = useState(seedProfile.nickname)
  const [gender, setGender] = useState<CharacterGender>(seedProfile.gender)
  const [bodyType, setBodyType] = useState<BodyType>(seedProfile.bodyType)
  const [headVariant, setHeadVariant] = useState<HeadVariant>(seedProfile.headVariant)
  const [outfitColor, setOutfitColor] = useState<string>(seedProfile.outfitColor)
  const [error, setError] = useState("")

  const submit = () => {
    const cleanNickname = nickname.trim()
    if (!isValidNickname(cleanNickname)) {
      setError("닉네임은 한글·영문·숫자·공백으로 2~12자까지 입력할 수 있습니다.")
      return
    }
    onComplete({ nickname: cleanNickname, gender, bodyType, headVariant, hairVariant: "orbit", outfitVariant: "field", outfitColor, createdAt: new Date().toISOString() })
  }

  return <main className="flow-screen"><div className="flow-backdrop" aria-hidden="true" /><section className="create-layout" aria-labelledby="character-create-title">
    <div className="create-copy"><span className="eyebrow">{isReturning ? "PROFILE LINK" : "01 · YOUR SIGNAL"}</span><h1 id="character-create-title">{isReturning ? <>탐사대원 신호를<br /><em>다시 조정</em>하세요.</> : <>여정을 시작할<br /><em>탐사대원</em>을 만드세요.</>}</h1><p>{isReturning ? "저장된 탐사대원 정보를 확인하고 닉네임과 모습을 수정할 수 있습니다." : "이름과 빛의 색을 고르면 개인 홈에서 첫 번째 신호를 만날 수 있습니다."}</p><button className="text-button" type="button" onClick={onBack}>← 시작 화면으로</button></div>
    <div className={`create-card${isReturning ? " create-card--edit" : ""}`}>
      <div className="create-card-header"><span className="create-mode">{isReturning ? "PROFILE EDITOR" : "NEW EXPLORER"}</span><span className="create-status"><i />{isReturning ? "저장된 신호" : "로컬 개발 모드"}</span></div>
      <CharacterPreview gender={gender} bodyType={bodyType} headVariant={headVariant} nickname={nickname} outfitColor={outfitColor} />
      <div className="form-section"><label htmlFor="nickname">탐사대원 이름</label><input id="nickname" value={nickname} onChange={(event) => { setNickname(event.target.value); setError("") }} maxLength={12} autoComplete="nickname" autoFocus aria-invalid={Boolean(error)} aria-describedby="nickname-help" /><small id="nickname-help">2~12자 · 다른 사람에게 보이는 이름입니다.</small>{error ? <p className="form-error" role="alert">{error}</p> : null}</div>
      <div className="form-section"><span className="form-label" id="gender-label">탐사대원</span><div className="choice-row" aria-labelledby="gender-label">{(["male", "female"] as const).map((choice) => <button aria-pressed={gender === choice} className={gender === choice ? "choice-button selected" : "choice-button"} type="button" key={choice} onClick={() => setGender(choice)}>{choice === "male" ? "남성 탐사대원" : "여성 탐사대원"}</button>)}</div></div>
      <div className="form-section"><span className="form-label" id="body-type-label">형태</span><div className="choice-row" aria-labelledby="body-type-label">{(["terra", "luna"] as const).map((choice) => <button aria-pressed={bodyType === choice} className={bodyType === choice ? "choice-button selected" : "choice-button"} type="button" key={choice} onClick={() => setBodyType(choice)}>{choice === "terra" ? "TERRA형" : "LUNA형"}</button>)}</div></div>
      <div className="form-section"><span className="form-label" id="character-preset-label">캐릭터 프리셋</span><div className="character-preset-grid" role="group" aria-labelledby="character-preset-label">{CHARACTER_PRESETS.map((preset) => { const selected = gender === preset.gender && headVariant === preset.headVariant; return <button aria-pressed={selected} className={selected ? "character-preset selected" : "character-preset"} type="button" key={preset.id} onClick={() => { setGender(preset.gender); setHeadVariant(preset.headVariant) }}><span className="character-preset-sprite" aria-hidden="true" style={{ backgroundImage: `url(${getCharacterAtlasPath(preset.gender, preset.headVariant)})` }} /><span className="character-preset-copy"><strong>{preset.label}</strong><small>{preset.detail}</small><em>8방향 아틀라스</em></span></button> })}</div></div>
      <div className="form-section"><span className="form-label" id="outfit-color-label">수트 신호 색</span><div className="color-row" aria-labelledby="outfit-color-label">{OUTFIT_COLORS.map((color) => <button aria-pressed={outfitColor === color} className={outfitColor === color ? "color-choice selected" : "color-choice"} style={{ backgroundColor: color }} type="button" key={color} onClick={() => setOutfitColor(color)} aria-label={`수트 색 ${color}`} />)}</div></div>
      <button className="primary-button full" type="button" onClick={submit}>{isReturning ? "변경 사항 저장하기" : "이 모습으로 시작하기"} <span>→</span></button>
    </div>
  </section></main>
}

function LoadingSpinner() {
  return <div className="loading-spinner" aria-hidden="true"><div className="configure-border-1"><div className="configure-core" /></div><div className="configure-border-2"><div className="configure-core" /></div></div>
}

function LoadingScreen({ destination }: { readonly destination: LoadingDestination }) {
  const copy = LOADING_COPY[destination]
  return <main className="loading-screen" role="status" aria-live="polite"><LoadingSpinner /><span className="eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.description}</p></main>
}

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("START")
  const [profile, setProfile] = useState<CharacterProfile | null>(null)
  const [loadingDestination, setLoadingDestination] = useState<LoadingDestination | null>(null)
  const [resourceCount, setResourceCount] = useState(0)
  const [resourceInventory, setResourceInventory] = useState<ResourceInventory>(INITIAL_RESOURCE_INVENTORY)
  const [communityProgress, setCommunityProgress] = useState(12)
  const [toast, setToast] = useState("")

  useEffect(() => {
    if (screen !== "LOADING" || !loadingDestination) return
    const timeout = window.setTimeout(() => {
      if (loadingDestination === "plaza") {
        setLoadingDestination(null)
        setScreen("PLAZA")
        return
      }

      const storedProfile = readStoredProfile(window.localStorage.getItem(PROFILE_STORAGE_KEY))
      if (loadingDestination === "login") {
        setProfile(storedProfile)
        setScreen(storedProfile ? "COMMAND" : "CHARACTER_CREATE")
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

  const completeCharacterCreate = (nextProfile: CharacterProfile) => {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile))
    setProfile(nextProfile)
    setScreen("COMMAND")
  }

  if (screen === "START") return <TerraStartScreen onLogin={() => beginLoading("login")} />
  if (screen === "CHARACTER_CREATE") return <CharacterCreate initialProfile={profile} onBack={() => setScreen("START")} onComplete={completeCharacterCreate} />
  if (screen === "LOADING") return <LoadingScreen destination={loadingDestination ?? "plaza"} />
  if (!profile) return <TerraStartScreen onLogin={() => beginLoading("login")} />
  if (screen === "COMMAND") return <TerraCommandCenter profile={profile} inventory={resourceInventory} progress={communityProgress} resourceCount={resourceCount} onEnterTerra={() => beginLoading("plaza")} onEditProfile={() => setScreen("CHARACTER_CREATE")} />

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
