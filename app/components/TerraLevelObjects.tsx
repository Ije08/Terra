"use client"

import { useLayoutEffect, useMemo, useState } from "react"
import { useLoader } from "@react-three/fiber"
import { BufferGeometry, Color, Float32BufferAttribute, Mesh } from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import forestSource from "../game/levels/terra-forest.json"
import plazaSource from "../game/levels/terra-plaza.json"
import { readLevelDocument, type LevelDocument, type LevelObject } from "../game/level"
import { isBuiltinPropAsset } from "../game/level"
import { BuiltinProp } from "./TerraBuiltinProps"

const forest = readLevelDocument(forestSource, "terra-forest")
const plaza = readLevelDocument(plazaSource, "terra-plaza")
if (!forest || !plaza) throw new Error("TERRA 레벨 데이터가 올바르지 않습니다.")
const LEVELS: Readonly<Record<string, LevelDocument>> = { "terra-forest": forest, "terra-plaza": plaza }

export function getLevelDocument(id: string): LevelDocument { return LEVELS[id] ?? LEVELS["terra-forest"] }

function GLBModel({ object }: { readonly object: LevelObject }) {
  const model = useLoader(GLTFLoader, object.asset)
  const [scene] = useState(() => model.scene.clone(true))
  useLayoutEffect(() => { scene.traverse((child) => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true } }) }, [scene])
  return <group position={[object.position.x, object.position.y, object.position.z]} rotation={[object.rotation.x, object.rotation.y, object.rotation.z]} scale={[object.scale.x, object.scale.y, object.scale.z]}><primitive object={scene} /></group>
}

function LevelModel({ object, collectedIds, interaction }: { readonly object: LevelObject; readonly collectedIds: ReadonlySet<string>; readonly interaction: { readonly id: string; readonly startedAt: number } | null }) {
  if (isBuiltinPropAsset(object.asset)) return collectedIds.has(object.id) ? null : <group position={[object.position.x, object.position.y, object.position.z]} rotation={[object.rotation.x, object.rotation.y, object.rotation.z]} scale={[object.scale.x, object.scale.y, object.scale.z]}><BuiltinProp asset={object.asset} objectId={object.id} interaction={interaction} /></group>
  return <group position={[object.position.x, object.position.y, object.position.z]} rotation={[object.rotation.x, object.rotation.y, object.rotation.z]} scale={[object.scale.x, object.scale.y, object.scale.z]}><GLBModel object={object} /></group>
}

function TerrainMesh({ level }: { readonly level: LevelDocument }) {
  const geometry = useMemo(() => buildTerrainGeometry(level), [level])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors /></mesh>
}

function RampVisual({ wall }: { readonly wall: LevelWall }) {
  const geometry = useMemo(() => {
    const geometry = new BufferGeometry()
    const [x, y, z] = [wall.size.x / 2, wall.size.y / 2, wall.size.z / 2]
    const positions = [-x, -y, -z, x, -y, -z, -x, -y, z, x, -y, z, -x, y, z, x, y, z]
    const indices = [0, 4, 5, 0, 5, 1, 0, 2, 4, 1, 3, 5, 2, 3, 5, 2, 5, 4, 0, 1, 3, 0, 3, 2]
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.addGroup(0, 6, 0); geometry.addGroup(6, indices.length - 6, 1); geometry.computeVertexNormals(); return geometry
  }, [wall.size.x, wall.size.y, wall.size.z])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} castShadow><meshStandardMaterial attach="material-0" color={wall.topColor} /><meshStandardMaterial attach="material-1" color={wall.color} /></mesh>
}

function LevelWallMesh({ wall }: { readonly wall: LevelWall }) {
  return <group position={[wall.position.x, wall.position.y, wall.position.z]} rotation={[0, wall.rotationY, 0]}>
    {wall.kind === "ramp" ? <RampVisual wall={wall} /> : <><mesh castShadow><boxGeometry args={[wall.size.x, wall.size.y, wall.size.z]} /><meshStandardMaterial color={wall.color} /></mesh>{wall.kind === "block" && <mesh position={[0, wall.size.y / 2 + .01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[wall.size.x, wall.size.z]} /><meshStandardMaterial color={wall.topColor} /></mesh>}</>}
  </group>
}

function buildTerrainGeometry(level: LevelDocument) {
  const { terrain } = level
  const geometry = new BufferGeometry(); const positions: number[] = []; const colors: number[] = []; const indices: number[] = []
  const cellWidth = terrain.width / terrain.columns; const cellDepth = terrain.depth / terrain.rows; const materials = new Map(terrain.materials.map((material) => [material.id, material])); const cell = (column: number, row: number) => terrain.cells[row * terrain.columns + column] ?? terrain.cells[0]
  const cornerHeight = (column: number, row: number) => { let total = 0; let count = 0; for (const [dx, dz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]] as const) { const x = column + dx; const z = row + dz; if (x >= 0 && x < terrain.columns && z >= 0 && z < terrain.rows) { total += cell(x, z).height; count += 1 } } return terrain.baseHeight + total / Math.max(count, 1) }
  const addVertex = (x: number, y: number, z: number, color: string) => { positions.push(x, y, z); const parsed = new Color(color); colors.push(parsed.r, parsed.g, parsed.b); return positions.length / 3 - 1 }
  const addQuad = (vertices: readonly number[]) => indices.push(vertices[0], vertices[1], vertices[2], vertices[0], vertices[2], vertices[3])
  for (let row = 0; row < terrain.rows; row += 1) for (let column = 0; column < terrain.columns; column += 1) {
    const item = cell(column, row); const material = materials.get(item.material) ?? terrain.materials[0]; const x0 = -terrain.width / 2 + column * cellWidth; const x1 = x0 + cellWidth; const z0 = -terrain.depth / 2 + row * cellDepth; const z1 = z0 + cellDepth
    const top = [addVertex(x0, cornerHeight(column, row), z0, material.topColor), addVertex(x1, cornerHeight(column + 1, row), z0, material.topColor), addVertex(x1, cornerHeight(column + 1, row + 1), z1, material.topColor), addVertex(x0, cornerHeight(column, row + 1), z1, material.topColor)]; addQuad([top[0], top[3], top[2], top[1]])
    const edges = [[top[0], top[1], column, row - 1], [top[1], top[2], column + 1, row], [top[2], top[3], column, row + 1], [top[3], top[0], column - 1, row]] as const
    for (const [a, b, neighborColumn, neighborRow] of edges) { const neighborHeight = neighborColumn >= 0 && neighborColumn < terrain.columns && neighborRow >= 0 && neighborRow < terrain.rows ? cell(neighborColumn, neighborRow).height : 0; if (item.height > neighborHeight + .02 || neighborColumn < 0 || neighborColumn >= terrain.columns || neighborRow < 0 || neighborRow >= terrain.rows) { const pa = positions.slice(a * 3, a * 3 + 3); const pb = positions.slice(b * 3, b * 3 + 3); const bottomA = addVertex(pa[0], terrain.baseHeight, pa[2], material.sideColor); const bottomB = addVertex(pb[0], terrain.baseHeight, pb[2], material.sideColor); addQuad([a, b, bottomB, bottomA]) } }
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setAttribute("color", new Float32BufferAttribute(colors, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry
}

export function TerraLevelObjects({ levelId = "terra-forest", collectedIds = new Set<string>(), interaction = null }: { readonly levelId?: string; readonly collectedIds?: ReadonlySet<string>; readonly interaction?: { readonly id: string; readonly startedAt: number } | null }) {
  const level = getLevelDocument(levelId)
  return <><TerrainMesh level={level} />{level.walls.map((wall) => <LevelWallMesh key={wall.id} wall={wall} />)}{level.objects.map((object) => <LevelModel key={`${object.id}-${object.asset}`} object={object} collectedIds={collectedIds} interaction={interaction} />)}</>
}
