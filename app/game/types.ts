export type AppScreen =
  | "START"
  | "CHARACTER_CREATE"
  | "COMMAND"
  | "HOME"
  | "LOADING"
  | "PLAZA"
  | "FOREST"

export type BodyType = "terra" | "luna"
export type CharacterGender = "male" | "female"
export type HeadVariant = "cute" | "composed" | "silver-braid"
export type HairVariant = "orbit" | "comet" | "tide"
export type OutfitVariant = "field" | "survey" | "signal"
export type WorldScene = "home" | "plaza"

export interface CharacterProfile {
  readonly nickname: string
  readonly gender: CharacterGender
  readonly bodyType: BodyType
  readonly headVariant: HeadVariant
  readonly hairVariant: HairVariant
  readonly outfitVariant: OutfitVariant
  readonly outfitColor: string
  readonly createdAt: string
}

export interface Point {
  readonly x: number
  readonly y: number
}

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface ResourceNode {
  readonly id: string
  readonly label: string
  readonly position: Point
  readonly accent: string
}

export interface Structure {
  readonly id: string
  readonly label: string
  readonly position: Point
  readonly size: Point
  readonly accent: string
}

export type TerminalTab =
  | "map"
  | "build"
  | "missions"
  | "comms"
  | "news"
  | "community"
  | "chat"
