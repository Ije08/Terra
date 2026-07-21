"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { getCharacterAtlasPath, getCharacterIdleSheetPath, getCharacterInteractionSheetPath, getCharacterRunSheetPath, getCharacterSheetFrame, getCharacterWalkSheetPath, getDirectionAtlasCell, type SpriteDirection } from "../game/characters"
import type { CharacterProfile, Point, Structure, WorldScene } from "../game/types"
import { findNearestResource, HOME_DOOR, movePoint, PLAZA_RESOURCES, WORLD_SIZE } from "../game/world"

interface TerraCanvasProps {
  readonly character: CharacterProfile
  readonly scene: WorldScene
  readonly onCollectResource: (label: string) => void
  readonly onLeaveHome: () => void
}

const PLAZA_STRUCTURES: readonly Structure[] = [
  { id: "build-site", label: "공동 건설소", position: { x: 360, y: 88 }, size: { x: 226, y: 108 }, accent: "#e1ae65" },
  { id: "observatory", label: "우주 관측소", position: { x: 92, y: 152 }, size: { x: 176, y: 94 }, accent: "#75c9e8" },
  { id: "news-board", label: "뉴스 전광판", position: { x: 704, y: 152 }, size: { x: 172, y: 94 }, accent: "#d487cc" },
]

const HOME_STRUCTURES: readonly Structure[] = [
  { id: "mission-terminal", label: "오늘의 미션 단말기", position: { x: 98, y: 112 }, size: { x: 236, y: 64 }, accent: "#e1ae65" },
  { id: "star-map", label: "개인 별자리", position: { x: 610, y: 110 }, size: { x: 214, y: 64 }, accent: "#75c9e8" },
  { id: "bed", label: "휴식 공간", position: { x: 126, y: 344 }, size: { x: 170, y: 72 }, accent: "#7e87b6" },
  { id: "signal-egg", label: "신호 생명체 알", position: { x: 646, y: 330 }, size: { x: 164, y: 86 }, accent: "#b887d8" },
]

const INITIAL_POSITIONS: Record<WorldScene, Point> = {
  home: { x: 496, y: 386 },
  plaza: { x: 480, y: 282 },
}

function drawDiamond(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string, stroke?: string): void {
  context.beginPath()
  context.moveTo(x, y - height / 2)
  context.lineTo(x + width / 2, y)
  context.lineTo(x, y + height / 2)
  context.lineTo(x - width / 2, y)
  context.closePath()
  context.fillStyle = fill
  context.fill()
  if (stroke) {
    context.strokeStyle = stroke
    context.stroke()
  }
}

function drawGround(context: CanvasRenderingContext2D, scene: WorldScene): void {
  const gradient = context.createLinearGradient(0, 0, 0, WORLD_SIZE.y)
  gradient.addColorStop(0, scene === "home" ? "#171d38" : "#11283a")
  gradient.addColorStop(1, scene === "home" ? "#080b18" : "#081923")
  context.fillStyle = gradient
  context.fillRect(0, 0, WORLD_SIZE.x, WORLD_SIZE.y)
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 14; column += 1) {
      const x = 38 + column * 72 + (row % 2 === 0 ? 0 : 36)
      const y = 46 + row * 66
      drawDiamond(context, x, y, 68, 34, (row + column) % 3 === 0 ? "#173849" : "#142f3e", "#1e4a5a")
    }
  }
}

function drawPath(context: CanvasRenderingContext2D, scene: WorldScene): void {
  context.save()
  context.globalAlpha = 0.84
  context.fillStyle = scene === "home" ? "#313d5d" : "#315760"
  context.fillRect(0, 258, WORLD_SIZE.x, 60)
  context.fillStyle = scene === "home" ? "#5f7590" : "#6a9a94"
  context.fillRect(0, 284, WORLD_SIZE.x, 8)
  context.restore()
}

function drawStructure(context: CanvasRenderingContext2D, structure: Structure): void {
  const { position, size } = structure
  context.save()
  context.shadowColor = structure.accent
  context.shadowBlur = 10
  context.fillStyle = "#203848"
  context.fillRect(position.x, position.y, size.x, size.y)
  context.shadowBlur = 0
  context.strokeStyle = structure.accent
  context.lineWidth = 1
  context.strokeRect(position.x, position.y, size.x, size.y)
  context.fillStyle = `${structure.accent}22`
  context.fillRect(position.x + 10, position.y + 10, size.x - 20, 18)
  context.fillStyle = "#d7eef0"
  context.font = "600 14px Arial"
  context.fillText(structure.label, position.x + 14, position.y + 31)
  context.fillStyle = `${structure.accent}66`
  context.fillRect(position.x + 16, position.y + 48, size.x - 32, Math.max(8, size.y - 62))
  context.restore()
}

function drawProps(context: CanvasRenderingContext2D, scene: WorldScene): void {
  if (scene === "home") {
    context.fillStyle = "#66799e"
    context.fillRect(HOME_DOOR.x, HOME_DOOR.y, HOME_DOOR.width, HOME_DOOR.height)
    context.fillStyle = "#8fe8ee"
    context.fillRect(HOME_DOOR.x + 12, HOME_DOOR.y + 12, HOME_DOOR.width - 24, 5)
    context.fillStyle = "#0b1726"
    context.fillRect(HOME_DOOR.x + 14, HOME_DOOR.y + 27, HOME_DOOR.width - 28, 42)
    return
  }
  context.save()
  context.strokeStyle = "#78d0d8"
  context.lineWidth = 3
  context.beginPath()
  context.arc(480, 280, 118, Math.PI, Math.PI * 2)
  context.stroke()
  context.strokeStyle = "#e3ba73"
  context.beginPath()
  context.arc(480, 280, 94, Math.PI, Math.PI * 2)
  context.stroke()
  context.restore()
}

function drawResource(context: CanvasRenderingContext2D, resource: (typeof PLAZA_RESOURCES)[number], collected: boolean): void {
  if (collected) return
  const { x, y } = resource.position
  context.save()
  context.shadowColor = resource.accent
  context.shadowBlur = 18
  drawDiamond(context, x, y - 8, 24, 32, resource.accent, "#e9fcff")
  context.shadowBlur = 0
  context.fillStyle = "#c5f4f4"
  context.font = "600 11px Arial"
  context.textAlign = "center"
  context.fillText(resource.label, x, y + 34)
  context.restore()
}

function drawForeground(context: CanvasRenderingContext2D): void {
  const gradient = context.createRadialGradient(WORLD_SIZE.x / 2, WORLD_SIZE.y / 2, 120, WORLD_SIZE.x / 2, WORLD_SIZE.y / 2, 620)
  gradient.addColorStop(0, "transparent")
  gradient.addColorStop(1, "rgba(3, 8, 16, 0.76)")
  context.fillStyle = gradient
  context.fillRect(0, 0, WORLD_SIZE.x, WORLD_SIZE.y)
}

type CardinalSpriteDirection = "down" | "left" | "right" | "up"

function toCardinalSpriteDirection(direction: SpriteDirection): CardinalSpriteDirection {
  switch (direction) {
    case "up":
    case "up-left":
    case "up-right":
      return "up"
    case "down":
    case "down-left":
    case "down-right":
      return "down"
    case "left":
      return "left"
    case "right":
      return "right"
  }
}

function PaperDollSprite({ character, position, direction, frame, interactionFrame, interacting, moving, running }: { readonly character: CharacterProfile; readonly position: Point; readonly direction: SpriteDirection; readonly frame: number; readonly interactionFrame: number; readonly interacting: boolean; readonly moving: boolean; readonly running: boolean }) {
  const walkSheetPath = getCharacterWalkSheetPath(character.gender, character.headVariant)
  const idleSheetPath = getCharacterIdleSheetPath(character.gender, character.headVariant)
  const runSheetPath = getCharacterRunSheetPath(character.gender, character.headVariant)
  const interactionSheetPath = getCharacterInteractionSheetPath(character.gender, character.headVariant)
  const usesGeneratedSheets = walkSheetPath !== null
  const action = interacting && interactionSheetPath !== null ? "interaction" : running && runSheetPath !== null ? "run" : !moving && idleSheetPath !== null ? "idle" : "walk"
  const sheetPath = action === "interaction" ? interactionSheetPath : action === "idle" ? idleSheetPath : action === "run" ? runSheetPath : walkSheetPath
  const cardinalDirection = toCardinalSpriteDirection(direction)
  const requestedRow = { down: 0, left: 1, right: 2, up: 3 }[cardinalDirection]
  const requestedFrame = action === "interaction" ? interactionFrame : frame
  const sheetFrame = getCharacterSheetFrame(character.gender, character.headVariant, action, requestedRow, requestedFrame)
  const cell = getDirectionAtlasCell(direction)
  const spriteStyle: CSSProperties = {
    backgroundImage: `url(${sheetPath ?? getCharacterAtlasPath(character.gender, character.headVariant)})`,
    backgroundPosition: usesGeneratedSheets ? `${(sheetFrame.frame / 3) * 100}% ${(sheetFrame.row / 3) * 100}%` : `${cell.column * 50}% ${cell.row * 50}%`,
    backgroundSize: usesGeneratedSheets ? "400% 400%" : "300% 300%",
    transform: sheetFrame.flipX ? "scaleX(-1)" : undefined,
  }
  const verticalOffset = action === "walk" && requestedFrame === 1 ? "calc(-86% - 2px)" : "-86%"
  return <div className={`player-sprite-anchor${interacting ? " is-interacting" : ""}`} data-sprite-action={action} data-sprite-direction={direction} data-sprite-frame={sheetFrame.frame} style={{ left: `${(position.x / WORLD_SIZE.x) * 100}%`, top: `${(position.y / WORLD_SIZE.y) * 100}%`, transform: `translate(calc(-50% + ${sheetFrame.offsetX * .5}px), ${verticalOffset})` }} aria-hidden="true">
    <div className="player-sprite" style={spriteStyle} />
    {!usesGeneratedSheets && <span className="interaction-hand" />}
  </div>
}

function directionFromVector(x: number, y: number): SpriteDirection {
  if (x === 0) return y < 0 ? "up" : "down"
  if (y === 0) return x < 0 ? "left" : "right"
  return `${y < 0 ? "up" : "down"}-${x < 0 ? "left" : "right"}` as SpriteDirection
}

export function TerraCanvas({ character, scene, onCollectResource, onLeaveHome }: TerraCanvasProps) {
  const idleSheetPath = getCharacterIdleSheetPath(character.gender, character.headVariant)
  const runSheetPath = getCharacterRunSheetPath(character.gender, character.headVariant)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const positionRef = useRef<Point>(INITIAL_POSITIONS[scene])
  const keysRef = useRef<ReadonlySet<string>>(new Set())
  const reducedMotionRef = useRef(false)
  const animationClockRef = useRef(0)
  const animationStateRef = useRef<{ direction: SpriteDirection; frame: number; moving: boolean; running: boolean }>({ direction: "down", frame: 0, moving: false, running: false })
  const interactionTimeoutRef = useRef<number | null>(null)
  const [position, setPosition] = useState<Point>(INITIAL_POSITIONS[scene])
  const [spriteDirection, setSpriteDirection] = useState<SpriteDirection>("down")
  const [spriteFrame, setSpriteFrame] = useState(0)
  const [moving, setMoving] = useState(false)
  const [running, setRunning] = useState(false)
  const [interactionFrame, setInteractionFrame] = useState(0)
  const [interacting, setInteracting] = useState(false)
  const [collectedIds, setCollectedIds] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    const nextPosition = INITIAL_POSITIONS[scene]
    positionRef.current = nextPosition
    setPosition(nextPosition)
    animationStateRef.current = { direction: "down", frame: 0, moving: false, running: false }
    animationClockRef.current = 0
    setSpriteDirection("down")
    setSpriteFrame(0)
    setMoving(false)
    setRunning(false)
    setInteractionFrame(0)
    setInteracting(false)
    setCollectedIds(new Set())
  }, [scene])

  useEffect(() => () => {
    if (interactionTimeoutRef.current !== null) window.clearTimeout(interactionTimeoutRef.current)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateReducedMotion = () => { reducedMotionRef.current = mediaQuery.matches }
    updateReducedMotion()
    mediaQuery.addEventListener("change", updateReducedMotion)
    return () => mediaQuery.removeEventListener("change", updateReducedMotion)
  }, [])

  useEffect(() => {
    const pressedKeys = new Set<string>()
    keysRef.current = pressedKeys
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (["w", "a", "s", "d", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault()
        pressedKeys.add(key)
      }
      if (key === "f" && !event.repeat && scene === "home") onLeaveHome()
      if (key === "f" && !event.repeat && scene === "plaza") {
        setInteracting(true)
        setInteractionFrame(0)
        if (interactionTimeoutRef.current !== null) window.clearTimeout(interactionTimeoutRef.current)
        interactionTimeoutRef.current = window.setTimeout(() => {
          setInteractionFrame(1)
          interactionTimeoutRef.current = window.setTimeout(() => {
            setInteractionFrame(3)
            interactionTimeoutRef.current = window.setTimeout(() => {
              setInteractionFrame(0)
              setInteracting(false)
            }, 140)
          }, 140)
        }, 140)
        const nearest = findNearestResource(positionRef.current, collectedIds)
        if (nearest) {
          setCollectedIds((previous) => new Set(previous).add(nearest.id))
          onCollectResource(nearest.label)
        }
      }
    }
    const onKeyUp = (event: KeyboardEvent) => pressedKeys.delete(event.key.toLowerCase())
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [collectedIds, onCollectResource, onLeaveHome, scene])

  useEffect(() => {
    let frameId = 0
    let lastTime = performance.now()
    const tick = (time: number) => {
      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      const keys = keysRef.current
      const direction = { x: (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0), y: (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0) }
      const length = Math.hypot(direction.x, direction.y)
      const normalized = length > 0 ? { x: direction.x / length, y: direction.y / length } : direction
      const animationState = animationStateRef.current
      const isMoving = length > 0
      const isRunning = isMoving && keys.has("shift") && runSheetPath !== null
      if (animationState.moving !== isMoving || animationState.running !== isRunning) {
        animationState.moving = isMoving
        animationState.running = isRunning
        animationState.frame = 0
        animationClockRef.current = 0
        setMoving(isMoving)
        setRunning(isRunning)
        setSpriteFrame(0)
      }
      const nextDirection = length > 0 ? directionFromVector(direction.x, direction.y) : animationState.direction
      if (animationState.direction !== nextDirection) {
        animationState.direction = nextDirection
        animationState.frame = 0
        animationClockRef.current = 0
        setSpriteDirection(nextDirection)
        setSpriteFrame(0)
      }
      const frameDuration = isRunning ? 0.09 : 0.12
      if (length === 0 && idleSheetPath !== null && !reducedMotionRef.current) {
        animationClockRef.current += deltaSeconds
        if (animationClockRef.current >= 0.34) {
          animationClockRef.current %= 0.34
          animationState.frame = (animationState.frame + 1) % 4
          setSpriteFrame(animationState.frame)
        }
      } else if (length === 0 || reducedMotionRef.current) {
        animationClockRef.current = 0
        if (animationState.frame !== 0) {
          animationState.frame = 0
          setSpriteFrame(0)
        }
      } else {
        animationClockRef.current += deltaSeconds
        if (animationClockRef.current >= frameDuration) {
          const steps = Math.floor(animationClockRef.current / frameDuration)
          animationClockRef.current %= frameDuration
          animationState.frame = (animationState.frame + steps) % 4
          setSpriteFrame(animationState.frame)
        }
      }
      const nextPosition = movePoint(scene, positionRef.current, normalized, deltaSeconds, isRunning)
      if (nextPosition.x !== positionRef.current.x || nextPosition.y !== positionRef.current.y) {
        positionRef.current = nextPosition
        setPosition(nextPosition)
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [idleSheetPath, runSheetPath, scene])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = WORLD_SIZE.x * ratio
    canvas.height = WORLD_SIZE.y * ratio
    const context = canvas.getContext("2d")
    if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, WORLD_SIZE.x, WORLD_SIZE.y)
    drawGround(context, scene)
    drawPath(context, scene)
    for (const structure of scene === "home" ? HOME_STRUCTURES : PLAZA_STRUCTURES) drawStructure(context, structure)
    drawProps(context, scene)
    if (scene === "plaza") for (const resource of PLAZA_RESOURCES) drawResource(context, resource, collectedIds.has(resource.id))
    drawForeground(context)
  }, [collectedIds, position, scene])

  return <div className="terra-canvas-wrap">
    <canvas ref={canvasRef} className="terra-canvas" aria-label={`${scene === "home" ? "개인 홈" : "TERRA 광장"} 탐사 화면`} />
    <PaperDollSprite character={character} position={position} direction={spriteDirection} frame={spriteFrame} interactionFrame={interactionFrame} interacting={interacting} moving={moving} running={running} />
    <div className="canvas-hud" aria-live="polite"><span>{scene === "home" ? "개인 홈" : "TERRA 광장 · terra-plaza-01"}</span><span className="canvas-hud-dot" /><span>{character.nickname}</span></div>
    <div className="canvas-actions">{scene === "home" && <button className="ghost-button" type="button" onClick={onLeaveHome}>문 열고 광장으로 <span>F</span></button>}<span className="movement-hint">WASD / 방향키로 이동 · F 상호작용</span></div>
  </div>
}
