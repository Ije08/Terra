import type { CharacterGender, HeadVariant } from "./types"

export type SpriteDirection = "down" | "down-left" | "left" | "up-left" | "up" | "up-right" | "right" | "down-right"
export const CHARACTER_FRAME_SIZE = 256
export const DIRECTION_ATLAS_COLUMNS = 3
export const DIRECTION_ATLAS_SIZE = CHARACTER_FRAME_SIZE * DIRECTION_ATLAS_COLUMNS

export interface DirectionAtlasCell {
  readonly column: number
  readonly row: number
}

export const DIRECTION_ATLAS_CELLS: Readonly<Record<SpriteDirection, DirectionAtlasCell>> = {
  "down-left": { column: 0, row: 0 },
  down: { column: 1, row: 0 },
  "down-right": { column: 2, row: 0 },
  left: { column: 0, row: 1 },
  right: { column: 2, row: 1 },
  "up-left": { column: 0, row: 2 },
  up: { column: 1, row: 2 },
  "up-right": { column: 2, row: 2 },
}

type CharacterSheetAction =
  | "walk-4x4"
  | "idle-4x4"
  | "run-4x4"
  | "interaction-4x4"

export type CharacterAnimation = "idle" | "walk" | "run" | "interaction"
export interface CharacterSheetFrame {
  readonly row: number
  readonly frame: number
  readonly flipX: boolean
  readonly offsetX: number
}

const SILVER_BRAID_SIDE_FRAME_ORDER: Readonly<Record<CharacterAnimation, readonly number[]>> = {
  idle: [0, 1, 2, 3],
  walk: [0, 1, 2, 3],
  run: [0, 1, 2, 3],
  interaction: [0, 1, 2, 3],
}
const SILVER_BRAID_SIDE_OFFSETS: Readonly<Record<CharacterAnimation, readonly number[]>> = {
  idle: [0, 0, 0, 0],
  walk: [0, -6, -10, -6],
  run: [0, -6, -10, -6],
  interaction: [0, -14, -18, 0],
}

const SILVER_BRAID_SHEET_ACTIONS: ReadonlySet<CharacterSheetAction> = new Set([
  "idle-4x4",
  "walk-4x4",
  "run-4x4",
  "interaction-4x4",
])

const characterSpriteFolder = (gender: CharacterGender): "terra-male" | "TERRA-feamale" =>
  gender === "female" ? "TERRA-feamale" : "terra-male"

const characterSheetPath = (gender: CharacterGender, style: HeadVariant, action: CharacterSheetAction): string => {
  if (gender === "male" && action === "walk-4x4") {
    return "/assets/sprites/terra-explorer-v17/male/walk-4x4/sheet-transparent.png"
  }
  if (gender === "female" && style === "silver-braid" && action === "walk-4x4") {
    return "/assets/sprites/terra-explorer-v17/female-silver-braid/walk-4x4/sheet-transparent.png"
  }
  if (gender === "female" && style === "silver-braid" && SILVER_BRAID_SHEET_ACTIONS.has(action)) {
    return "/assets/sprites/terra-explorer-v15/female-silver-braid/" + action + "/sheet-transparent.png"
  }
  return "/assets/sprites/" + characterSpriteFolder(gender) + "/" + action + "/sheet-transparent.png"
}
const atlasPath = (gender: CharacterGender, style: HeadVariant): string =>
  characterSheetPath(gender, style, "walk-4x4")

export const CHARACTER_DIRECTION_ATLASES: Readonly<Record<CharacterGender, Readonly<Record<HeadVariant, string>>>> = {
  male: { cute: atlasPath("male", "cute"), composed: atlasPath("male", "composed"), "silver-braid": atlasPath("male", "composed") },
  female: { cute: atlasPath("female", "cute"), composed: atlasPath("female", "composed"), "silver-braid": atlasPath("female", "silver-braid") },
}

export function getCharacterAtlasPath(gender: CharacterGender, style: HeadVariant): string {
  return CHARACTER_DIRECTION_ATLASES[gender][style]
}

export function getCharacterWalkSheetPath(gender: CharacterGender, style: HeadVariant): string | null {
  return characterSheetPath(gender, style, "walk-4x4")
}

export function getCharacterInteractionSheetPath(gender: CharacterGender, style: HeadVariant): string | null {
  return characterSheetPath(gender, style, "interaction-4x4")
}

export function getCharacterIdleSheetPath(gender: CharacterGender, style: HeadVariant): string | null {
  return characterSheetPath(gender, style, "idle-4x4")
}

export function getCharacterRunSheetPath(gender: CharacterGender, style: HeadVariant): string | null {
  return gender === "female" && style === "silver-braid" ? characterSheetPath(gender, style, "walk-4x4") : null
}

export function getCharacterSheetFrame(gender: CharacterGender, style: HeadVariant, action: CharacterAnimation, requestedRow: number, requestedFrame: number): CharacterSheetFrame {
  if (gender === "male" && (action === "walk" || action === "run") && requestedRow >= 1 && requestedRow <= 2) {
    return { row: 1, frame: requestedFrame % 4, flipX: requestedRow === 2, offsetX: 0 }
  }
  if (gender !== "female" || style !== "silver-braid" || requestedRow < 1 || requestedRow > 2) {
    return { row: requestedRow, frame: requestedFrame, flipX: false, offsetX: 0 }
  }
  const flipX = requestedRow === 2
  const frame = SILVER_BRAID_SIDE_FRAME_ORDER[action][requestedFrame % 4] ?? requestedFrame
  const offsetX = SILVER_BRAID_SIDE_OFFSETS[action][frame] ?? 0
  return { row: 1, frame, flipX, offsetX: flipX ? -offsetX : offsetX }
}

export function getDirectionAtlasCell(direction: SpriteDirection): DirectionAtlasCell {
  return DIRECTION_ATLAS_CELLS[direction]
}
