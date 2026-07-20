"use client"

import { useEffect, useRef, useState } from "react"
import type { CharacterProfile, Point, Structure, WorldScene } from "../game/types"
import {
  findNearestResource,
  HOME_DOOR,
  movePoint,
  PLAZA_RESOURCES,
  WORLD_SIZE,
} from "../game/world"

interface TerraCanvasProps {
  readonly character: CharacterProfile
  readonly scene: WorldScene
  readonly onCollectResource: (label: string) => void
  readonly onLeaveHome: () => void
  readonly onOpenTerminal: () => void
}

const PLAZA_STRUCTURES: readonly Structure[] = [
  { id: "build-site", label: "공동 건설소", position: { x: 360, y: 88 }, size: { x: 226, y: 108 }, accent: "#e1ae65" },
  { id: "observatory", label: "우주 관측소", position: { x: 92, y: 152 }, size: { x: 176, y: 94 }, accent: "#75c9e8" },
  { id: "news-board", label: "뉴스 전광판", position: { x: 704, y: 152 }, size: { x: 172, y: 94 }, accent: "#d487cc" },
  { id: "gallery", label: "탐사 갤러리", position: { x: 108, y: 358 }, size: { x: 182, y: 92 }, accent: "#82bf9a" },
  { id: "community-terminal", label: "탐사 단말기", position: { x: 690, y: 352 }, size: { x: 178, y: 98 }, accent: "#8c9fea" },
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

function drawDiamond(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke?: string,
): void {
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

  context.fillStyle = scene === "home" ? "#27304b" : "#224451"
  context.fillRect(0, 252, WORLD_SIZE.x, 72)
  context.fillStyle = "#3f6b70"
  context.fillRect(0, 284, WORLD_SIZE.x, 8)
}

function drawPath(context: CanvasRenderingContext2D, scene: WorldScene): void {
  context.save()
  context.globalAlpha = 0.84
  context.fillStyle = scene === "home" ? "#313d5d" : "#315760"
  context.fillRect(0, 258, WORLD_SIZE.x, 60)
  context.restore()
}

function drawStructure(context: CanvasRenderingContext2D, structure: Structure, highlighted: boolean): void {
  const { position, size } = structure
  context.save()
  context.shadowColor = structure.accent
  context.shadowBlur = highlighted ? 24 : 10
  context.fillStyle = highlighted ? "#334f66" : "#203848"
  context.fillRect(position.x, position.y, size.x, size.y)
  context.shadowBlur = 0
  context.strokeStyle = structure.accent
  context.lineWidth = highlighted ? 3 : 1
  context.strokeRect(position.x, position.y, size.x, size.y)
  context.fillStyle = `${structure.accent}22`
  context.fillRect(position.x + 10, position.y + 10, size.x - 20, 18)
  context.fillStyle = "#d7eef0"
  context.font = "600 14px Arial"
  context.fillText(structure.label, position.x + 14, position.y + 31)
  context.fillStyle = `${structure.accent}66`
  context.fillRect(position.x + 16, position.y + 48, size.x - 32, size.y - 62)
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

function drawCharacter(context: CanvasRenderingContext2D, position: Point, character: CharacterProfile): void {
  context.save()
  context.translate(position.x, position.y)
  context.shadowColor = "#5be4ed"
  context.shadowBlur = 16
  context.fillStyle = "#0b111c"
  context.beginPath()
  context.ellipse(0, 18, 25, 10, 0, 0, Math.PI * 2)
  context.fill()
  context.shadowBlur = 0
  context.fillStyle = character.outfitColor
  context.beginPath()
  context.moveTo(-16, 4)
  context.lineTo(16, 4)
  context.lineTo(22, 33)
  context.lineTo(-22, 33)
  context.closePath()
  context.fill()
  context.fillStyle = "#f1c8a8"
  context.beginPath()
  context.arc(0, -12, 15, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = character.hairVariant === "orbit" ? "#243a5d" : "#a86171"
  context.beginPath()
  context.arc(0, -17, 16, Math.PI, Math.PI * 2)
  context.fill()
  context.fillStyle = "#dffbff"
  context.fillRect(-13, 0, 26, 4)
  context.restore()
}

function drawForeground(context: CanvasRenderingContext2D): void {
  const gradient = context.createRadialGradient(WORLD_SIZE.x / 2, WORLD_SIZE.y / 2, 120, WORLD_SIZE.x / 2, WORLD_SIZE.y / 2, 620)
  gradient.addColorStop(0, "transparent")
  gradient.addColorStop(1, "rgba(3, 8, 16, 0.76)")
  context.fillStyle = gradient
  context.fillRect(0, 0, WORLD_SIZE.x, WORLD_SIZE.y)
}

export function TerraCanvas({ character, scene, onCollectResource, onLeaveHome, onOpenTerminal }: TerraCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const positionRef = useRef<Point>(INITIAL_POSITIONS[scene])
  const keysRef = useRef<ReadonlySet<string>>(new Set())
  const [position, setPosition] = useState<Point>(INITIAL_POSITIONS[scene])
  const [collectedIds, setCollectedIds] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    const nextPosition = INITIAL_POSITIONS[scene]
    positionRef.current = nextPosition
    setPosition(nextPosition)
    setCollectedIds(new Set())
  }, [scene])

  useEffect(() => {
    const pressedKeys = new Set<string>()
    keysRef.current = pressedKeys

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault()
        pressedKeys.add(key)
      }
      if (key === "e" && scene === "home") onLeaveHome()
      if (key === "e" && scene === "plaza") {
        const nearest = findNearestResource(positionRef.current, collectedIds)
        if (nearest) {
          setCollectedIds((previous) => new Set(previous).add(nearest.id))
          onCollectResource(nearest.label)
        } else {
          onOpenTerminal()
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
  }, [collectedIds, onCollectResource, onLeaveHome, onOpenTerminal, scene])

  useEffect(() => {
    let frameId = 0
    let lastTime = performance.now()
    const tick = (time: number) => {
      const deltaSeconds = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      const keys = keysRef.current
      const direction = {
        x: (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
        y: (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0),
      }
      const length = Math.hypot(direction.x, direction.y)
      const normalized = length > 0 ? { x: direction.x / length, y: direction.y / length } : direction
      const nextPosition = movePoint(scene, positionRef.current, normalized, deltaSeconds)
      if (nextPosition.x !== positionRef.current.x || nextPosition.y !== positionRef.current.y) {
        positionRef.current = nextPosition
        setPosition(nextPosition)
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [scene])

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
    const structures = scene === "home" ? HOME_STRUCTURES : PLAZA_STRUCTURES
    for (const structure of structures) drawStructure(context, structure, false)
    drawProps(context, scene)
    if (scene === "plaza") {
      for (const resource of PLAZA_RESOURCES) drawResource(context, resource, collectedIds.has(resource.id))
    }
    drawCharacter(context, position, character)
    drawForeground(context)
  }, [character, collectedIds, position, scene])

  return (
    <div className="terra-canvas-wrap">
      <canvas ref={canvasRef} className="terra-canvas" aria-label={`${scene === "home" ? "개인 홈" : "TERRA 광장"} 탐사 화면`} />
      <div className="canvas-hud" aria-live="polite"><span>{scene === "home" ? "개인 홈" : "TERRA 광장 · terra-plaza-01"}</span><span className="canvas-hud-dot" /><span>{character.nickname}</span></div>
      <div className="canvas-actions">
        {scene === "home" ? <button className="ghost-button" type="button" onClick={onLeaveHome}>문 열고 광장으로 <span>F</span></button> : <button className="ghost-button" type="button" onClick={onOpenTerminal}>탐사 단말기 <span>F</span></button>}
        <span className="movement-hint">WASD / 방향키로 이동 · F 상호작용</span>
      </div>
    </div>
  )
}
