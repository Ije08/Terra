export interface LevelVector3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface TerrainMaterial {
  readonly id: string
  readonly label: string
  readonly topColor: string
  readonly sideColor: string
}

export interface TerrainCell {
  readonly height: number
  readonly material: string
}

export interface TerrainSettings {
  readonly width: number
  readonly depth: number
  readonly columns: number
  readonly rows: number
  readonly baseHeight: number
  readonly maxHeight: number
  readonly cells: readonly TerrainCell[]
  readonly materials: readonly TerrainMaterial[]
}

export type LevelWallKind = "wall" | "block" | "ramp"

export interface LevelWall {
  readonly id: string
  readonly kind: LevelWallKind
  readonly position: LevelVector3
  readonly size: LevelVector3
  readonly rotationY: number
  readonly color: string
  readonly topColor: string
  readonly collision: boolean
}

export interface LevelObject {
  readonly id: string
  readonly asset: string
  readonly position: LevelVector3
  readonly rotation: LevelVector3
  readonly scale: LevelVector3
  readonly collision: boolean
}

export const BUILTIN_PROP_ASSETS = {
  backgroundTree: "builtin:tree-background",
  collectibleTree: "builtin:tree-collectible",
  collectibleRock: "builtin:rock-collectible",
} as const

export type BuiltinPropAsset = (typeof BUILTIN_PROP_ASSETS)[keyof typeof BUILTIN_PROP_ASSETS]
export type CollectibleResource = "wood" | "iron"

export interface BuiltinPropMeta {
  readonly asset: BuiltinPropAsset
  readonly label: string
  readonly description: string
  readonly resource: CollectibleResource | null
  readonly collisionRadius: number
}

export const BUILTIN_PROP_META: readonly BuiltinPropMeta[] = [
  { asset: BUILTIN_PROP_ASSETS.backgroundTree, label: "배경 나무", description: "장식용 · 충돌", resource: null, collisionRadius: .7 },
  { asset: BUILTIN_PROP_ASSETS.collectibleTree, label: "수집용 나무", description: "F · 목재", resource: "wood", collisionRadius: .72 },
  { asset: BUILTIN_PROP_ASSETS.collectibleRock, label: "수집용 바위", description: "F · 철", resource: "iron", collisionRadius: .62 },
]

export function isBuiltinPropAsset(asset: string): asset is BuiltinPropAsset {
  return BUILTIN_PROP_META.some((item) => item.asset === asset)
}

export function getBuiltinPropMeta(asset: string): BuiltinPropMeta | null {
  return BUILTIN_PROP_META.find((item) => item.asset === asset) ?? null
}

export interface LevelDocument {
  readonly version: 2
  readonly id: string
  readonly name: string
  readonly spawn: LevelVector3
  readonly terrain: TerrainSettings
  readonly walls: readonly LevelWall[]
  readonly objects: readonly LevelObject[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)
const isColor = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)

const DEFAULT_MATERIALS: readonly TerrainMaterial[] = [
  { id: "grass", label: "잔디", topColor: "#78a879", sideColor: "#477056" },
  { id: "path", label: "길", topColor: "#d8c69c", sideColor: "#9e8761" },
  { id: "soil", label: "흙", topColor: "#9f7352", sideColor: "#694735" },
  { id: "rock", label: "바위", topColor: "#84928b", sideColor: "#4d5c58" },
]

function readVector(value: unknown, fallback: LevelVector3 = { x: 0, y: 0, z: 0 }): LevelVector3 {
  if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.z)) return fallback
  return { x: value.x, y: value.y, z: value.z }
}

function createCells(columns: number, rows: number): readonly TerrainCell[] {
  return Array.from({ length: columns * rows }, () => ({ height: 0, material: "grass" }))
}

export function createDefaultLevel(id: string, name: string): LevelDocument {
  const columns = 32
  const rows = 32
  return {
    version: 2,
    id,
    name,
    spawn: { x: 0, y: 0, z: 0 },
    terrain: { width: 56, depth: 56, columns, rows, baseHeight: 0, maxHeight: 6, cells: createCells(columns, rows), materials: DEFAULT_MATERIALS },
    walls: [],
    objects: [],
  }
}

function readMaterials(value: unknown): readonly TerrainMaterial[] {
  if (!Array.isArray(value)) return DEFAULT_MATERIALS
  const materials = value.filter((item): item is TerrainMaterial => isRecord(item) && typeof item.id === "string" && typeof item.label === "string" && isColor(item.topColor) && isColor(item.sideColor)).map((item) => ({ id: item.id, label: item.label, topColor: item.topColor, sideColor: item.sideColor }))
  return materials.length ? materials.slice(0, 16) : DEFAULT_MATERIALS
}

function readTerrain(value: unknown): TerrainSettings {
  const fallback = createDefaultLevel("fallback", "fallback").terrain
  if (!isRecord(value)) return fallback
  const columns = isFiniteNumber(value.columns) ? Math.min(64, Math.max(2, Math.floor(value.columns))) : fallback.columns
  const rows = isFiniteNumber(value.rows) ? Math.min(64, Math.max(2, Math.floor(value.rows))) : fallback.rows
  const maxHeight = isFiniteNumber(value.maxHeight) ? Math.max(1, Math.min(20, value.maxHeight)) : 6
  const sourceCells = Array.isArray(value.cells) ? value.cells : []
  const materials = readMaterials(value.materials)
  const allowed = new Set(materials.map((material) => material.id))
  const cells = Array.from({ length: columns * rows }, (_, index) => {
    const item = sourceCells[index]
    if (!isRecord(item)) return { height: 0, material: materials[0].id }
    return { height: isFiniteNumber(item.height) ? Math.max(0, Math.min(maxHeight, item.height)) : 0, material: typeof item.material === "string" && allowed.has(item.material) ? item.material : materials[0].id }
  })
  return {
    width: isFiniteNumber(value.width) ? Math.max(4, Math.min(256, value.width)) : fallback.width,
    depth: isFiniteNumber(value.depth) ? Math.max(4, Math.min(256, value.depth)) : fallback.depth,
    columns,
    rows,
    baseHeight: isFiniteNumber(value.baseHeight) ? value.baseHeight : 0,
    maxHeight,
    cells,
    materials,
  }
}

function readWalls(value: unknown): readonly LevelWall[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 300).filter((item): item is LevelWall => isRecord(item) && typeof item.id === "string" && isRecord(item.size) && isFiniteNumber(item.size.x) && isFiniteNumber(item.size.y) && isFiniteNumber(item.size.z) && typeof item.color === "string").map((item) => ({ id: item.id, kind: item.kind === "block" || item.kind === "ramp" ? item.kind : "wall", position: readVector(item.position), size: { x: Math.max(0.1, item.size.x), y: Math.max(0.1, item.size.y), z: Math.max(0.1, item.size.z) }, rotationY: isFiniteNumber(item.rotationY) ? item.rotationY : 0, color: isColor(item.color) ? item.color : "#53635e", topColor: isColor(item.topColor) ? item.topColor : "#78a879", collision: item.collision !== false }))
}

function readObjects(value: unknown): readonly LevelObject[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 500).filter((item): item is LevelObject => isRecord(item) && typeof item.id === "string" && typeof item.asset === "string" && (isBuiltinPropAsset(item.asset) || (item.asset.startsWith("/assets/models/") && item.asset.toLowerCase().endsWith(".glb"))) && typeof item.collision === "boolean").map((item) => ({ id: item.id, asset: item.asset, position: readVector(item.position), rotation: readVector(item.rotation), scale: readVector(item.scale, { x: 1, y: 1, z: 1 }), collision: item.collision }))
}

export function readLevelDocument(value: unknown, fallbackId = "terra-forest"): LevelDocument | null {
  if (!isRecord(value) || typeof value.name !== "string" || !Array.isArray(value.objects)) return null
  const id = typeof value.id === "string" && /^[a-z0-9-]{2,40}$/.test(value.id) ? value.id : fallbackId
  return { version: 2, id, name: value.name.slice(0, 80), spawn: readVector(value.spawn), terrain: readTerrain(value.terrain), walls: readWalls(value.walls), objects: readObjects(value.objects) }
}

export const DEFAULT_TERRAIN_MATERIALS = DEFAULT_MATERIALS

const QUARTER_TURN = Math.PI / 2

function snap(value: number, step: number, origin = 0): number {
  return origin + Math.round((value - origin) / step) * step
}

export function snapWallToLevel(level: LevelDocument, source: LevelWall): LevelWall {
  const rotationY = Math.round(source.rotationY / QUARTER_TURN) * QUARTER_TURN
  const cellWidth = level.terrain.width / level.terrain.columns
  const cellDepth = level.terrain.depth / level.terrain.rows
  const originX = -level.terrain.width / 2 + cellWidth / 2
  const originZ = -level.terrain.depth / 2 + cellDepth / 2
  // 오토스냅은 격자 정렬만 담당합니다. 주변 블록·경사로와 자동 결합하거나
  // 크기/높이를 덮어쓰지 않아 사용자가 배치한 값을 그대로 유지합니다.
  return { ...source, rotationY, position: { ...source.position, x: snap(source.position.x, cellWidth, originX), z: snap(source.position.z, cellDepth, originZ) } }
}

export function getTerrainSurfaceHeight(level: LevelDocument, x: number, z: number): number {
  const { terrain } = level
  const column = Math.max(0, Math.min(terrain.columns - 1, Math.floor((x + terrain.width / 2) / terrain.width * terrain.columns)))
  const row = Math.max(0, Math.min(terrain.rows - 1, Math.floor((z + terrain.depth / 2) / terrain.depth * terrain.rows)))
  return terrain.baseHeight + (terrain.cells[row * terrain.columns + column]?.height ?? 0)
}

export function getTerrainHeight(level: LevelDocument, x: number, z: number, ignoreWallId?: string): number {
  let height = getTerrainSurfaceHeight(level, x, z)
  for (const wall of level.walls) {
    if (wall.id === ignoreWallId || !wall.collision || (wall.kind !== "block" && wall.kind !== "ramp")) continue
    const local = getWallLocalPosition(wall, x, z)
    if (Math.abs(local.x) > wall.size.x / 2 || Math.abs(local.z) > wall.size.z / 2) continue
    const wallHeight = wall.kind === "ramp"
      ? wall.position.y - wall.size.y / 2 + ((local.z + wall.size.z / 2) / wall.size.z) * wall.size.y
      : wall.position.y + wall.size.y / 2
    height = Math.max(height, wallHeight)
  }
  return height
}

export interface CollectibleNode {
  readonly object: LevelObject
  readonly meta: BuiltinPropMeta
  readonly distance: number
}

export function findNearestCollectible(level: LevelDocument, position: LevelVector3, collectedIds: ReadonlySet<string>, maxDistance = 2.8): CollectibleNode | null {
  return level.objects.reduce<CollectibleNode | null>((nearest, object) => {
    const meta = getBuiltinPropMeta(object.asset)
    if (!meta?.resource || collectedIds.has(object.id)) return nearest
    const distance = Math.hypot(position.x - object.position.x, position.z - object.position.z)
    if (distance > maxDistance || (nearest && distance >= nearest.distance)) return nearest
    return { object, meta, distance }
  }, null)
}

export function isLevelPositionBlocked(level: LevelDocument, x: number, z: number, radius = .45, currentSurfaceHeight?: number, collectedIds: ReadonlySet<string> = new Set()): boolean {
  if (Math.abs(x) > level.terrain.width / 2 - radius || Math.abs(z) > level.terrain.depth / 2 - radius) return true
  const blockedByWall = level.walls.some((wall) => {
    if (!wall.collision) return false
    const local = getWallLocalPosition(wall, x, z)
    if (wall.kind === "ramp") return false
    if (wall.kind === "block") {
      const overlaps = Math.abs(local.x) <= wall.size.x / 2 + radius && Math.abs(local.z) <= wall.size.z / 2 + radius
      if (!overlaps) return false
      const top = wall.position.y + wall.size.y / 2
      return currentSurfaceHeight === undefined || top > currentSurfaceHeight + .55
    }
    return Math.abs(local.x) <= wall.size.x / 2 + radius && Math.abs(local.z) <= wall.size.z / 2 + radius
  })
  if (blockedByWall) return true
  return level.objects.some((object) => {
    if (!object.collision || collectedIds.has(object.id)) return false
    const meta = getBuiltinPropMeta(object.asset)
    if (!meta) return false
    const objectSurface = getTerrainHeight(level, object.position.x, object.position.z)
    if (currentSurfaceHeight !== undefined && Math.abs(object.position.y - objectSurface) > 1.5) return false
    const scale = Math.max(Math.abs(object.scale.x), Math.abs(object.scale.z))
    return Math.hypot(x - object.position.x, z - object.position.z) <= meta.collisionRadius * scale + radius
  })
}

export function canTraverseLevelStep(level: LevelDocument, from: LevelVector3, to: LevelVector3): boolean {
  for (const wall of level.walls) {
    if (!wall.collision || wall.kind !== "ramp") continue
    const previous = getWallLocalPosition(wall, from.x, from.z)
    const next = getWallLocalPosition(wall, to.x, to.z)
    const previousInside = Math.abs(previous.x) <= wall.size.x / 2 && Math.abs(previous.z) <= wall.size.z / 2
    const nextInside = Math.abs(next.x) <= wall.size.x / 2 && Math.abs(next.z) <= wall.size.z / 2
    if (!previousInside && nextInside) {
      const enteredFromEnd = Math.abs(previous.x) <= wall.size.x / 2 + .45 && Math.abs(previous.z) > wall.size.z / 2
      if (!enteredFromEnd) return false
    }
    if (previousInside && !nextInside) {
      const exitedThroughEnd = Math.abs(next.x) <= wall.size.x / 2 + .45 && Math.abs(next.z) > wall.size.z / 2
      if (!exitedThroughEnd) return false
    }
  }
  const heightDelta = getTerrainHeight(level, to.x, to.z) - getTerrainHeight(level, from.x, from.z)
  return Math.abs(heightDelta) <= .75
}

export function getWallLocalPosition(wall: LevelWall, x: number, z: number): LevelVector3 {
  const cosine = Math.cos(-wall.rotationY)
  const sine = Math.sin(-wall.rotationY)
  return {
    x: (x - wall.position.x) * cosine - (z - wall.position.z) * sine,
    y: 0,
    z: (x - wall.position.x) * sine + (z - wall.position.z) * cosine,
  }
}
