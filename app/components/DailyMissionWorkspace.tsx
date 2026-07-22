"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { useLanguage } from "./LanguageProvider"
import type { ResourceKey } from "./TerraCommandUi"
import styles from "./TerraCommandCenter.module.css"

type MissionKind = "real" | "ingame"
type MissionDifficulty = "easy" | "normal" | "hard"
type MissionStatus = "not-started" | "in-progress" | "complete"

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

interface MissionTranslation {
  readonly category: string
  readonly title: string
  readonly detail: string
  readonly duration: string
}

const MISSION_DAILY_LIMIT = 5
const KIND_LABELS: Readonly<Record<MissionKind, string>> = { real: "현실 미션", ingame: "인게임 미션" }
const KIND_LABELS_EN: Readonly<Record<MissionKind, string>> = { real: "REAL MISSIONS", ingame: "IN-GAME MISSIONS" }
const RESOURCE_LABELS: Readonly<Record<ResourceKey, string>> = { wood: "목재", iron: "철", signal: "시그널", reclaimed: "재활용 부품" }
const RESOURCE_LABELS_EN: Readonly<Record<ResourceKey, string>> = { wood: "Wood", iron: "Iron", signal: "Signal Remnants", reclaimed: "Reclaimed Parts" }
const KIND_SUBTITLES: Readonly<Record<MissionKind, string>> = { real: "집에서 가볍게, 밖에서 주변과 연결하는 현실 행동을 골라보세요.", ingame: "게임 안에서 따뜻한 말로 서로의 신호를 이어보세요." }
const KIND_SUBTITLES_EN: Readonly<Record<MissionKind, string>> = { real: "Choose a gentle action at home or around your neighborhood.", ingame: "Leave a kind signal for another explorer in the game." }
const DIFFICULTIES: Readonly<Record<MissionDifficulty, { readonly label: string; readonly detail: string }>> = { easy: { label: "쉬움", detail: "집에서 가볍게" }, normal: { label: "보통", detail: "밖에서 주변과" }, hard: { label: "어려움", detail: "사진으로 남기기" } }
const DIFFICULTIES_EN: Readonly<Record<MissionDifficulty, { readonly label: string; readonly detail: string }>> = { easy: { label: "EASY", detail: "A gentle start" }, normal: { label: "NORMAL", detail: "Connect nearby" }, hard: { label: "HARD", detail: "Leave a photo" } }

const MISSION_TRANSLATIONS: Readonly<Record<string, MissionTranslation>> = {
  "self-care": { category: "Self-care", title: "A short reset", detail: "Take 10 minutes to rest or do something you enjoy today.", duration: "About 10 min" },
  "home-thanks": { category: "Self-care", title: "A grateful object", detail: "Find one object at home you feel grateful for and record why.", duration: "About 5 min" },
  neighborhood: { category: "Care nearby", title: "A small neighborhood signal", detail: "Look at a plant or the sky and record the scene that stayed with you.", duration: "About 15 min" },
  "kind-neighborhood": { category: "Care nearby", title: "A warm trace", detail: "Choose one small action that makes someone nearby feel cared for.", duration: "About 20 min" },
  "photo-sky": { category: "Beautiful moments", title: "Today's sky signal", detail: "Take a photo of a sky, star, plant, or neighborhood scene that stays with you.", duration: "About 20 min" },
  "photo-neighborhood": { category: "Beautiful moments", title: "Where light lingered", detail: "Share one photo and a short note about a beautiful moment you found today.", duration: "About 25 min" },
  "window-breath": { category: "Self-care", title: "A breath by the window", detail: "Take three slow breaths by a window and notice one sound around you.", duration: "About 3 min" },
  "kind-note": { category: "Care nearby", title: "Leave a small thanks", detail: "Write a short thank-you for a person or object that helped you today.", duration: "About 5 min" },
  greeting: { category: "Connect", title: "Say hello first", detail: "Greet one explorer warmly in the plaza or chat.", duration: "About 3 min" },
  encourage: { category: "Connect", title: "Answer a signal", detail: "Read another explorer's record and leave a specific word of encouragement.", duration: "About 5 min" },
  welcome: { category: "Connect", title: "Welcome a new explorer", detail: "Tell a first-time explorer one thing they can do here.", duration: "About 7 min" },
  "community-signal": { category: "Care together", title: "Gather small signals", detail: "Read three signals in today's chat and encourage one of them.", duration: "About 10 min" },
  "signal-trail": { category: "Connect", title: "Follow a trace of light", detail: "Choose one plaza signal and follow the story where it began.", duration: "About 4 min" },
  "signal-share": { category: "Care together", title: "Share today's signal", detail: "Write one short sentence about a moment that stayed with you and share it.", duration: "About 8 min" },
}

const SEED_POST_TRANSLATIONS: Readonly<Record<string, { readonly author: string; readonly missionTitle: string; readonly note: string }>> = {
  "seed-beach": { author: "Evening Walker", missionTitle: "Today's sky signal", note: "I paused to listen to the waves. My heart feels a little lighter today." },
  "seed-sunset-forest": { author: "Sunset Collector", missionTitle: "A small neighborhood signal", note: "This is the sunset I saw near the forest path. Someone else may be looking at the same sky." },
  "seed-tropical-coast": { author: "Slow Traveler", missionTitle: "A short reset", note: "I gave myself time to do nothing but look at the sea." },
  "seed-mountain-lake": { author: "First Light Recorder", missionTitle: "Today's sky signal", note: "I found a mountain and a bird reflected in the water. Leaving this beautiful moment here." },
  "seed-short-note": { author: "Small Encouragement", missionTitle: "A short reset", note: "I opened the window and took a deep breath today." },
  "seed-long-note": { author: "Roadside Observer", missionTitle: "A small neighborhood signal", note: "A small flower beneath a wall caught my eye on a familiar path. I want to walk a little more slowly tomorrow." },
}

function translateMission(mission: DailyMission, english: boolean): MissionTranslation {
  if (!english) return { category: mission.category, title: mission.title, detail: mission.detail, duration: mission.duration }
  return MISSION_TRANSLATIONS[mission.id] ?? { category: mission.category, title: mission.title, detail: mission.detail, duration: mission.duration }
}

export function DailyMissionWorkspace({ missions, posts, onStartMission, onCompleteMission, onPraise, onRerollMission }: { readonly missions: readonly DailyMission[]; readonly posts: readonly SignalPost[]; readonly onStartMission: (missionId: string) => void; readonly onCompleteMission: (completion: MissionCompletion) => void; readonly onPraise: (postId: string) => void; readonly onRerollMission: (missionId: string, kind: MissionKind, difficulty: MissionDifficulty) => void }) {
  const { language } = useLanguage()
  const english = language === "en"
  const [kind, setKind] = useState<MissionKind>("real")
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("easy")
  const [collapsed, setCollapsed] = useState(false)
  const [activeMission, setActiveMission] = useState<DailyMission | null>(null)
  const [note, setNote] = useState("")
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoError, setPhotoError] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)
  const completed = missions.filter((mission) => mission.status === "complete").length
  const visibleMissions = missions.filter((mission) => mission.kind === kind).sort((left, right) => Number(left.difficulty !== difficulty) - Number(right.difficulty !== difficulty)).slice(0, 3)
  const currentDifficulties = english ? DIFFICULTIES_EN : DIFFICULTIES
  const openMissionLog = (mission: DailyMission) => { setActiveMission(mission); setNote(""); setPhoto(undefined); setPhotoError("") }
  const startMission = (mission: DailyMission) => { if (mission.status === "not-started") onStartMission(mission.id); else if (mission.status === "in-progress") openMissionLog(mission) }
  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setPhotoError(english ? "Choose a JPG, PNG, or WebP image." : "JPG, PNG, WebP 이미지만 등록할 수 있습니다."); return } if (file.size > 5 * 1024 * 1024) { setPhotoError(english ? "The image must be 5MB or smaller." : "사진은 5MB 이하만 등록할 수 있습니다."); return } const reader = new FileReader(); reader.onload = () => { setPhoto(typeof reader.result === "string" ? reader.result : undefined); setPhotoError("") }; reader.readAsDataURL(file) }
  const submit = () => { if (!activeMission || photoError) return; onCompleteMission({ missionId: activeMission.id, note: note.trim(), photo }); setActiveMission(null) }
  const statusLabel = (status: MissionStatus) => english ? ({ complete: "RECORDED", "in-progress": "IN PROGRESS", "not-started": "AVAILABLE" }[status]) : ({ complete: "기록됨", "in-progress": "진행 중", "not-started": "대기 중" }[status])
  const startLabel = (status: MissionStatus) => status === "complete" ? (english ? "DONE" : "완료") : status === "in-progress" ? (english ? "LOG COMPLETION" : "완료 기록") : (english ? "START MISSION" : "미션 시작")
  const renderPost = (post: SignalPost) => { const translation = english ? SEED_POST_TRANSLATIONS[post.id] : undefined; return { ...post, author: translation?.author ?? post.author, missionTitle: translation?.missionTitle ?? post.missionTitle, note: translation?.note ?? post.note } }
  const activeCopy = activeMission ? translateMission(activeMission, english) : null
  return <section className={styles.contentView + " " + styles.missionView} aria-labelledby="mission-picker-title"><div className={styles.missionBackground} style={{ backgroundImage: "url(/assets/backgrounds/terra-missions/terra-missions-hub.png)" }} aria-hidden="true" /><div className={styles.missionOverlay} aria-hidden="true" /><div className={styles.missionEffects} aria-hidden="true" /><button className={styles.missionFoldTag} type="button" onClick={() => setCollapsed((current) => !current)} aria-expanded={!collapsed}>{collapsed ? (english ? "OPEN MISSIONS" : "미션 열기") : (english ? "CLOSE MISSIONS" : "미션 접기")}<span>{collapsed ? "→" : "←"}</span></button><div className={styles.missionSplit + " " + (collapsed ? styles.missionSplitCollapsed : "")}><section className={styles.missionPanel + " " + (collapsed ? styles.missionPanelCollapsed : styles.missionPanelExpanded)} aria-labelledby="mission-picker-title"><header className={styles.missionPanelHeader}><div><span>MISSION SELECT</span><h1 id="mission-picker-title">{english ? "TODAY'S MISSIONS" : "오늘의 미션"}</h1><p className={styles.missionPanelSubtitle}>{english ? KIND_SUBTITLES_EN[kind] : KIND_SUBTITLES[kind]}</p></div><div className={styles.missionPanelMeta}><div className={styles.completedSignal}><span>{english ? "COMPLETED SIGNALS" : "완료된 신호"}</span><b>{completed} / {MISSION_DAILY_LIMIT}</b></div></div></header><div className={styles.missionKindTabs} role="tablist" aria-label={english ? "Mission type" : "미션 종류"}>{(Object.keys(KIND_LABELS) as MissionKind[]).map((item) => <button type="button" key={item} className={kind === item ? styles.missionKindActive : ""} onClick={() => setKind(item)} aria-pressed={kind === item}>{english ? KIND_LABELS_EN[item] : KIND_LABELS[item]}</button>)}</div><div className={styles.missionDifficultyBar} role="group" aria-label={english ? "Mission difficulty" : "미션 난이도"}>{(Object.keys(currentDifficulties) as MissionDifficulty[]).map((item) => <button type="button" key={item} className={difficulty === item ? styles.missionDifficultyActive : ""} onClick={() => setDifficulty(item)} aria-pressed={difficulty === item}><strong>{currentDifficulties[item].label}</strong><small>{currentDifficulties[item].detail}</small></button>)}</div><div className={styles.missionOfferList}>{visibleMissions.length ? visibleMissions.map((mission) => { const copy = translateMission(mission, english); return <article className={styles.missionOffer + " " + (mission.difficulty === difficulty ? styles.missionOfferRecommended : "") + " " + (mission.status === "complete" ? styles.missionOfferComplete : "")} key={mission.id}><header><span>{mission.code} · {copy.category}</span><b>{currentDifficulties[mission.difficulty].label} · {statusLabel(mission.status)}</b></header><h3>{copy.title}</h3><p>{copy.detail}</p><footer><span>{copy.duration} · +{mission.rewardXp} XP · {(english ? RESOURCE_LABELS_EN : RESOURCE_LABELS)[mission.rewardResource]} +{mission.rewardAmount}</span><div className={styles.missionOfferActions}><button className={styles.missionStartButton} type="button" onClick={() => startMission(mission)} disabled={mission.status === "complete"}>{startLabel(mission.status)}</button><button className={styles.missionReroll} type="button" onClick={() => onRerollMission(mission.id, mission.kind, mission.difficulty)} disabled={mission.status !== "not-started"}>{english ? "REROLL ↻" : "리롤 ↻"}</button></div></footer></article> }) : <div className={styles.missionEmpty}>{english ? "No missions match the selected filters." : "선택한 조건의 미션이 없습니다."}</div>}</div></section><aside className={styles.missionSignals + " " + (collapsed ? styles.missionSignalsExpanded : "")} aria-labelledby="mission-signals-title"><header className={styles.missionSignalHeader}><div><span>SIGNAL ARCHIVE</span><h2 id="mission-signals-title">{english ? "SIGNAL ARCHIVE" : "사람들의 신호 보관소"}</h2><p>{english ? "Completed missions arrive here as living records." : "완료된 미션은 이곳에 실시간으로 도착합니다."}</p></div><div className={styles.missionSignalMeta}><strong>{posts.length}<small>{english ? "RECORDS" : "기록"}</small></strong></div></header>{posts.length ? <div className={styles.missionSignalList} aria-live="polite">{posts.slice(0, 12).map((rawPost) => { const post = renderPost(rawPost); return <article className={styles.missionSignalItem} key={post.id}><header><div><strong>{post.author}</strong><small>{post.missionTitle}</small></div><time>{post.createdAt}</time></header>{post.photo ? <img src={post.photo} alt={english ? "Photo shared by an explorer" : "탐사대원이 공유한 미션 사진"} /> : null}<p>{post.note || (english ? "This action was recorded without a note." : "소감 없이도 오늘의 행동을 기록했습니다.")}</p><footer><span>{english ? "A small signal has arrived." : "작은 신호가 도착했습니다."}</span><button type="button" onClick={() => onPraise(post.id)} disabled={post.praised} aria-pressed={post.praised}>♡ {english ? "ENCOURAGE" : "응원"} {post.praiseCount}</button></footer></article> })}</div> : <div className={styles.missionSignalEmpty}><span>✦</span><h3>{english ? "No signals have arrived yet." : "아직 도착한 신호가 없습니다."}</h3><p>{english ? "Complete your first mission to leave a record here." : "첫 미션을 완료하면 사진과 소감이 이곳에 보관됩니다."}</p></div>}</aside></div>{activeMission && activeCopy ? <div className={styles.dialogBackdrop} role="presentation"><section className={styles.missionDialog} role="dialog" aria-modal="true" aria-labelledby="mission-dialog-title"><header><div><span>MISSION LOG</span><h2 id="mission-dialog-title">{activeCopy.title}</h2></div><button className={styles.dialogClose} type="button" onClick={() => setActiveMission(null)} aria-label={english ? "Close mission log" : "미션 기록 닫기"}>×</button></header><p>{activeCopy.detail}</p><label htmlFor="mission-note">{english ? "Short note" : "짧은 소감"} <small>{english ? "Optional" : "선택 사항"}</small></label><textarea id="mission-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder={english ? "Leave a small signal from today." : "오늘의 작은 신호를 남겨보세요."} /><div className={styles.photoPicker}><div><strong>{english ? "One photo" : "사진 한 장"}</strong><small>{english ? "Sky, stars, plants, or a neighborhood moment · optional" : "하늘, 별, 식물, 동네의 순간 · 선택 사항"}</small></div><button type="button" onClick={() => fileInput.current?.click()}>{english ? "CHOOSE PHOTO" : "사진 선택"}</button><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} /></div>{photo ? <img className={styles.missionPhotoPreview} src={photo} alt={english ? "Selected mission photo preview" : "선택한 미션 사진 미리보기"} /> : null}{photoError ? <p className={styles.photoError} role="alert">{photoError}</p> : null}<footer><button type="button" className={styles.secondaryAction} onClick={() => setActiveMission(null)}>{english ? "LATER" : "나중에"}</button><button type="button" className={styles.primaryAction} onClick={submit} disabled={Boolean(photoError)}>{english ? "RECORD COMPLETION" : "완료 등록"} <span>→</span></button></footer></section></div> : null}</section>
}
