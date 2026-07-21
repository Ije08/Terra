"use client"

import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react"
import { Color, Matrix4, SRGBColorSpace, TextureLoader, Vector3, type InstancedMesh, type Sprite, type SpriteMaterial, type Texture } from "three"
import { getCharacterAtlasPath, getCharacterIdleSheetPath, getCharacterInteractionSheetPath, getCharacterRunSheetPath, getCharacterSheetFrame, getCharacterWalkSheetPath } from "../game/characters"
import type { CharacterProfile } from "../game/types"
import { getLevelDocument, TerraLevelObjects } from "./TerraLevelObjects"
import { canTraverseLevelStep, findNearestCollectible, getTerrainHeight, isLevelPositionBlocked } from "../game/level"

interface InteractionState { readonly startedAt: number; readonly targetId: string | null }
interface SceneProps { readonly character: CharacterProfile; readonly collectedIds: ReadonlySet<string>; readonly inputRef: MutableRefObject<Set<string>>; readonly interactionRef: MutableRefObject<InteractionState>; readonly playerPositionRef: MutableRefObject<Vector3>; readonly onCollect: (id: string, label: string) => void; readonly levelId?: string }
const FLOWERS = Array.from({ length: 90 }, (_, index) => ({ x: Math.sin(index * 12.31) * 20, z: Math.cos(index * 7.17) * 21, scale: .7 + (index % 5) * .08 }))
const MOVE: Readonly<Record<string, readonly [number, number]>> = { w:[0,-1],arrowup:[0,-1],up:[0,-1],s:[0,1],arrowdown:[0,1],down:[0,1],a:[-1,0],arrowleft:[-1,0],left:[-1,0],d:[1,0],arrowright:[1,0],right:[1,0],"up-left":[-1,-1],"up-right":[1,-1],"down-left":[-1,1],"down-right":[1,1] }

function FlowerField() {
  const stems = useRef<InstancedMesh>(null)
  const petals = useRef<InstancedMesh>(null)
  useLayoutEffect(() => { const matrix = new Matrix4(); FLOWERS.forEach((flower,index) => { matrix.makeScale(.04,.22,.04); matrix.setPosition(flower.x,.11,flower.z); stems.current?.setMatrixAt(index,matrix); matrix.makeScale(.12*flower.scale,.08,.12*flower.scale); matrix.setPosition(flower.x,.29,flower.z); petals.current?.setMatrixAt(index,matrix) }); if(stems.current) stems.current.instanceMatrix.needsUpdate=true; if(petals.current) petals.current.instanceMatrix.needsUpdate=true }, [])
  return <><instancedMesh ref={stems} args={[undefined,undefined,FLOWERS.length]}><cylinderGeometry args={[1,1,1,4]} /><meshStandardMaterial color="#315e4d" /></instancedMesh><instancedMesh ref={petals} args={[undefined,undefined,FLOWERS.length]} castShadow><dodecahedronGeometry args={[1,0]} /><meshStandardMaterial color="#f4e9c6" flatShading /></instancedMesh></>
}

function Player({ character, collectedIds, inputRef, interactionRef, playerPositionRef, level }: Pick<SceneProps,"character"|"collectedIds"|"inputRef"|"interactionRef"|"playerPositionRef"> & { readonly level: ReturnType<typeof getLevelDocument> }) {
  const player = useRef<Sprite>(null)
  const material = useRef<SpriteMaterial>(null)
  const spriteTexture = useRef<Texture | null>(null)
  const textures = useRef<{ idle: Texture; walk: Texture; run: Texture; interaction: Texture } | null>(null)
  const position = useRef(new Vector3(level.spawn.x, level.spawn.y, level.spawn.z))
  const cameraForward = useRef(new Vector3())
  const cameraRight = useRef(new Vector3())
  const worldMove = useRef(new Vector3())
  const cameraTarget = useRef(new Vector3())
  const frameClock = useRef(0)
  const frame = useRef(0)
  const directionRow = useRef(0)
  const action = useRef<"idle" | "walk" | "run" | "interaction">("idle")
  const feetOffset = 1.08
  const walkPath = getCharacterWalkSheetPath(character.gender,character.headVariant) ?? getCharacterAtlasPath(character.gender,character.headVariant)
  const idlePath = getCharacterIdleSheetPath(character.gender,character.headVariant) ?? walkPath
  const runPath = getCharacterRunSheetPath(character.gender,character.headVariant) ?? walkPath
  const interactionPath = getCharacterInteractionSheetPath(character.gender,character.headVariant) ?? walkPath
  const loadedWalkTexture = useLoader(TextureLoader,walkPath)
  const loadedIdleTexture = useLoader(TextureLoader,idlePath)
  const loadedRunTexture = useLoader(TextureLoader,runPath)
  const loadedInteractionTexture = useLoader(TextureLoader,interactionPath)
  useEffect(() => {
    const clone = (texture: Texture) => { const next = texture.clone(); next.colorSpace = SRGBColorSpace; next.repeat.set(.25,.25); next.needsUpdate = true; return next }
    const nextTextures = { idle: clone(loadedIdleTexture), walk: clone(loadedWalkTexture), run: clone(loadedRunTexture), interaction: clone(loadedInteractionTexture) }
    textures.current = nextTextures
    spriteTexture.current = nextTextures.idle
    if (material.current) { material.current.map = nextTextures.idle; material.current.needsUpdate = true }
    return () => { Object.values(nextTextures).forEach((texture) => texture.dispose()) }
  }, [loadedIdleTexture, loadedWalkTexture, loadedRunTexture, loadedInteractionTexture])
  useFrame(({ camera }, delta) => {
    const now = performance.now()
    const interactionElapsed = interactionRef.current.startedAt > 0 ? now - interactionRef.current.startedAt : Infinity
    const interacting = interactionElapsed < 560
    if (!interacting) interactionRef.current = { startedAt: 0, targetId: null }
    let x = 0
    let z = 0
    if (!interacting) inputRef.current.forEach((key) => { const move = MOVE[key]; if (move) { x += move[0]; z += move[1] } })
    const length = Math.hypot(x, z)
    const moving = length > 0 && !interacting
    const running = moving && inputRef.current.has("shift")
    const nextAction = interacting ? "interaction" : running ? "run" : moving ? "walk" : "idle"
    if (action.current !== nextAction) { action.current = nextAction; frame.current = 0; frameClock.current = 0 }
    const activeTexture = textures.current?.[nextAction]
    if (activeTexture && spriteTexture.current !== activeTexture) { spriteTexture.current = activeTexture; if (material.current) { material.current.map = activeTexture; material.current.needsUpdate = true } }
    if (length && !interacting) {
      x /= length
      z /= length
      camera.getWorldDirection(cameraForward.current).setY(0).normalize()
      cameraRight.current.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize()
      worldMove.current.copy(cameraRight.current).multiplyScalar(x).addScaledVector(cameraForward.current, -z).normalize()

      const distance = delta * (running ? 8.2 : 5.2)
      const tryMove = (dx: number, dz: number) => {
        const next = { x: position.current.x + dx, y: position.current.y, z: position.current.z + dz }
        const surface = getTerrainHeight(level, position.current.x, position.current.z)
        if (isLevelPositionBlocked(level, next.x, next.z, .45, surface, collectedIds)) return false
        if (!canTraverseLevelStep(level, { x: position.current.x, y: position.current.y, z: position.current.z }, next)) return false
        position.current.x = next.x
        position.current.z = next.z
        return true
      }

      // Try the intended diagonal first. If a ramp edge rejects one component,
      // fall back to the free axis so the player can climb without slipping off.
      if (!tryMove(worldMove.current.x * distance, worldMove.current.z * distance)) {
        tryMove(worldMove.current.x * distance, 0)
        tryMove(0, worldMove.current.z * distance)
      }
      directionRow.current = Math.abs(z) > Math.abs(x) ? (z > 0 ? 0 : 3) : (x < 0 ? 1 : 2)
    }
    if (interacting) {
      frame.current = Math.min(3, Math.floor(interactionElapsed / 140))
    } else if (moving) {
      frameClock.current += delta
      if (frameClock.current > (running ? .09 : .13)) { frameClock.current = 0; frame.current = (frame.current + 1) % 4 }
    } else {
      frameClock.current += delta
      if (frameClock.current > .34) { frameClock.current = 0; frame.current = (frame.current + 1) % 4 }
    }
    const sheetFrame = getCharacterSheetFrame(character.gender, character.headVariant, nextAction, directionRow.current, frame.current)
    if (spriteTexture.current) {
      spriteTexture.current.repeat.x = sheetFrame.flipX ? -.25 : .25
      spriteTexture.current.offset.set((sheetFrame.frame + (sheetFrame.flipX ? 1 : 0)) * .25, 1 - (sheetFrame.row + 1) * .25)
    }
    // The sprite is a visual billboard, so its 2D image origin must be lifted
    // by half its rendered height to keep the feet on the calculated surface.
    position.current.y = getTerrainHeight(level, position.current.x, position.current.z) + feetOffset
    playerPositionRef.current.copy(position.current)
    cameraRight.current.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize()
    if (player.current) {
      player.current.position.copy(position.current).addScaledVector(cameraRight.current, sheetFrame.offsetX * (1.7 / 256))
      player.current.scale.x = 1.7
    }
    cameraTarget.current.set(position.current.x + 9, position.current.y + 13, position.current.z + 10)
    camera.position.copy(cameraTarget.current)
    camera.lookAt(position.current)
  })
  return <sprite ref={player} position={[level.spawn.x, level.spawn.y + feetOffset, level.spawn.z]} scale={[1.7,2.15,1]}><spriteMaterial ref={material} transparent alphaTest={.08} depthWrite={false} /></sprite>
}

function ForestWorld({ character, collectedIds, inputRef, interactionRef, playerPositionRef, onCollect, levelId = "terra-forest" }: SceneProps) {
  const level = getLevelDocument(levelId)
  const interactionTimer = useRef<number | null>(null)
  const [activeInteraction, setActiveInteraction] = useState<{ readonly id: string; readonly startedAt: number } | null>(null)
  const interact = () => {
    if (interactionRef.current.startedAt > 0) return
    const target = findNearestCollectible(level, playerPositionRef.current, collectedIds)
    if (!target) return
    const startedAt = performance.now()
    interactionRef.current = { startedAt, targetId: target.object.id }
    setActiveInteraction({ id: target.object.id, startedAt })
    interactionTimer.current = window.setTimeout(() => { interactionTimer.current = null; interactionRef.current = { startedAt: 0, targetId: null }; setActiveInteraction(null); onCollect(target.object.id, target.meta.resource === "wood" ? "목재" : "철") }, 560)
  }
  useEffect(() => { const down=(event:KeyboardEvent)=>{const key=event.key.toLowerCase();if(key==="shift"||MOVE[key]){inputRef.current.add(key);event.preventDefault()}if(key==="f"&&!event.repeat){interact();event.preventDefault()}};const up=(event:KeyboardEvent)=>inputRef.current.delete(event.key.toLowerCase());const clear=()=>inputRef.current.clear();window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",clear);return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",clear);if(interactionTimer.current!==null)window.clearTimeout(interactionTimer.current)}},[collectedIds, inputRef, interactionRef, onCollect])
  return <><color attach="background" args={[new Color("#b8c8ad")]} /><fog attach="fog" args={["#b8c8ad",24,48]} /><ambientLight intensity={1.5} /><directionalLight position={[10,18,8]} intensity={2.2} color="#fff0c7" castShadow shadow-mapSize={[1024,1024]} /><TerraLevelObjects levelId={level.id} collectedIds={collectedIds} interaction={activeInteraction} /><FlowerField /><Player character={character} collectedIds={collectedIds} inputRef={inputRef} interactionRef={interactionRef} playerPositionRef={playerPositionRef} level={level} /></>
}

export function TerraForestScene(props: SceneProps) { return <Canvas shadows orthographic camera={{ position:[9,13.95,10],zoom:64,near:.1,far:100 }} gl={{ antialias:true }}><ForestWorld {...props} /></Canvas> }
