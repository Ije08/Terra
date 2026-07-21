"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Group } from "three"
import { BUILTIN_PROP_ASSETS, type BuiltinPropAsset } from "../game/level"

interface BuiltinPropProps {
  readonly asset: BuiltinPropAsset
  readonly objectId: string
  readonly interaction?: { readonly id: string; readonly startedAt: number } | null
}

function TreeProp({ collectible, objectId, interaction }: Omit<BuiltinPropProps, "asset"> & { readonly collectible: boolean }) {
  const group = useRef<Group>(null)
  const seed = objectId.split("").reduce((total, char) => total + char.charCodeAt(0), 0) / 17
  useFrame(() => {
    if (!group.current) return
    const progress = interaction?.id === objectId ? Math.min(1, Math.max(0, (performance.now() - interaction.startedAt) / 560)) : -1
    const sway = Math.sin(performance.now() / 1200 + seed) * .035
    group.current.rotation.z = sway + (progress >= 0 ? Math.sin(progress * Math.PI) * .12 : 0)
    group.current.rotation.x = Math.cos(performance.now() / 1500 + seed) * .018
    group.current.scale.setScalar(progress >= 0 ? 1 - Math.sin(progress * Math.PI) * .12 : 1)
  })
  const canopy = collectible ? "#3f7650" : "#547e59"
  return <group ref={group}>
    <mesh position={[0, .85, 0]} castShadow><cylinderGeometry args={[.16, .24, 1.7, 6]} /><meshStandardMaterial color="#604735" flatShading /></mesh>
    <mesh position={[0, 2.05, 0]} castShadow><icosahedronGeometry args={[1.05, 1]} /><meshStandardMaterial color={canopy} flatShading /></mesh>
    <mesh position={[.45, 2.28, .08]} castShadow><dodecahedronGeometry args={[.62, 0]} /><meshStandardMaterial color="#6e9561" flatShading /></mesh>
    {collectible ? <mesh position={[0, .12, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.42, .035, 6, 18]} /><meshBasicMaterial color="#f0d88c" /></mesh> : null}
  </group>
}

function RockProp({ objectId, interaction }: Omit<BuiltinPropProps, "asset">) {
  const group = useRef<Group>(null)
  useFrame(() => {
    if (!group.current) return
    const progress = interaction?.id === objectId ? Math.min(1, Math.max(0, (performance.now() - interaction.startedAt) / 560)) : -1
    group.current.rotation.y += .002
    group.current.scale.setScalar(progress >= 0 ? 1 - Math.sin(progress * Math.PI) * .15 : 1)
  })
  return <group ref={group}>
    <mesh position={[-.28, .28, 0]} castShadow><dodecahedronGeometry args={[.48, 0]} /><meshStandardMaterial color="#777b70" flatShading /></mesh>
    <mesh position={[.3, .24, .08]} castShadow><dodecahedronGeometry args={[.4, 0]} /><meshStandardMaterial color="#9b9b83" flatShading /></mesh>
    <mesh position={[0, .08, -.08]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.55, .03, 6, 18]} /><meshBasicMaterial color="#b7c2b0" /></mesh>
  </group>
}

export function BuiltinProp({ asset, objectId, interaction = null }: BuiltinPropProps) {
  if (asset === BUILTIN_PROP_ASSETS.collectibleRock) return <RockProp objectId={objectId} interaction={interaction} />
  return <TreeProp collectible={asset === BUILTIN_PROP_ASSETS.collectibleTree} objectId={objectId} interaction={interaction} />
}
