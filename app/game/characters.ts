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

const atlasPath = (gender: CharacterGender, style: HeadVariant): string =>
  `/assets/sprites/terra-explorer-v3/direction-atlas/processed/${gender}-${style}-atlas-3x3-768.png`

const femaleCuteSheetPath = (action: "walk-4x4" | "interaction-4x4"): string =>
  `/assets/sprites/terra-explorer-v4/female-cute/${action}/sheet-transparent.png`

export const CHARACTER_DIRECTION_ATLASES: Readonly<Record<CharacterGender, Readonly<Record<HeadVariant, string>>>> = {
  male: { cute: atlasPath("male", "cute"), composed: atlasPath("male", "composed") },
  female: { cute: atlasPath("female", "cute"), composed: atlasPath("female", "composed") },
}

export function getCharacterAtlasPath(gender: CharacterGender, style: HeadVariant): string {
  return CHARACTER_DIRECTION_ATLASES[gender][style]
}

export function getCharacterWalkSheetPath(gender: CharacterGender, style: HeadVariant): string | null {
  return gender === "female" && style === "cute" ? femaleCuteSheetPath("walk-4x4") : null
}

export function getCharacterInteractionSheetPath(gender: CharacterGender, style: HeadVariant): string | null {
  return gender === "female" && style === "cute" ? femaleCuteSheetPath("interaction-4x4") : null
}

export function getDirectionAtlasCell(direction: SpriteDirection): DirectionAtlasCell {
  return DIRECTION_ATLAS_CELLS[direction]
}
