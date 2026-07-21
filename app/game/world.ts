import type { Point, Rect, ResourceNode, WorldScene } from "./types"

export const WORLD_SIZE: Point = { x: 960, y: 560 }

const HOME_OBSTACLES: readonly Rect[] = [
  { x: 98, y: 112, width: 236, height: 64 },
  { x: 610, y: 110, width: 214, height: 64 },
  { x: 126, y: 344, width: 170, height: 72 },
  { x: 646, y: 330, width: 164, height: 86 },
]

const PLAZA_OBSTACLES: readonly Rect[] = [
  { x: 360, y: 88, width: 226, height: 108 },
  { x: 92, y: 152, width: 176, height: 94 },
  { x: 704, y: 152, width: 172, height: 94 },
  { x: 108, y: 358, width: 182, height: 92 },
  { x: 690, y: 352, width: 178, height: 98 },
]

export const PLAZA_RESOURCES: readonly ResourceNode[] = [
  {
    id: "signal-fragment-east",
    label: "시그널 잔해",
    position: { x: 624, y: 300 },
    accent: "#86e9ff",
  },
  {
    id: "signal-fragment-west",
    label: "시그널 잔해",
    position: { x: 346, y: 382 },
    accent: "#c4a7ff",
  },
  {
    id: "reclaimed-metal",
    label: "재활용 부품",
    position: { x: 548, y: 454 },
    accent: "#ffd27d",
  },
]

export const HOME_DOOR: Rect = { x: 450, y: 424, width: 92, height: 76 }

export function getObstacles(scene: WorldScene): readonly Rect[] {
  return scene === "home" ? HOME_OBSTACLES : PLAZA_OBSTACLES
}

export function clampPoint(point: Point, radius = 18): Point {
  return {
    x: Math.max(radius, Math.min(WORLD_SIZE.x - radius, point.x)),
    y: Math.max(radius, Math.min(WORLD_SIZE.y - radius, point.y)),
  }
}

function overlapsCircle(rect: Rect, point: Point, radius: number): boolean {
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width))
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height))
  const dx = point.x - closestX
  const dy = point.y - closestY
  return dx * dx + dy * dy < radius * radius
}

function isWalkable(scene: WorldScene, point: Point, radius = 18): boolean {
  return !getObstacles(scene).some((obstacle) =>
    overlapsCircle(obstacle, point, radius),
  )
}

export function movePoint(
  scene: WorldScene,
  current: Point,
  direction: Point,
  deltaSeconds: number,
  running = false,
): Point {
  const speed = scene === "home" ? (running ? 230 : 154) : (running ? 264 : 176)
  const next = clampPoint({
    x: current.x + direction.x * speed * deltaSeconds,
    y: current.y + direction.y * speed * deltaSeconds,
  })

  if (isWalkable(scene, next)) {
    return next
  }

  const horizontal = clampPoint({ x: next.x, y: current.y })
  if (isWalkable(scene, horizontal)) {
    return horizontal
  }

  const vertical = clampPoint({ x: current.x, y: next.y })
  return isWalkable(scene, vertical) ? vertical : current
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function findNearestResource(
  position: Point,
  collectedIds: ReadonlySet<string>,
  maxDistance = 68,
): ResourceNode | null {
  let nearest: ResourceNode | null = null
  let nearestDistance = maxDistance

  for (const resource of PLAZA_RESOURCES) {
    if (collectedIds.has(resource.id)) {
      continue
    }

    const distance = distanceBetween(position, resource.position)
    if (distance < nearestDistance) {
      nearest = resource
      nearestDistance = distance
    }
  }

  return nearest
}
