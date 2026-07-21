"use client"

import { Canvas, type ThreeEvent, useFrame, useLoader, useThree } from "@react-three/fiber"
import { useEffect, useEffectEvent, useMemo, useRef, useState, useLayoutEffect, type MutableRefObject } from "react"
import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, MOUSE } from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { TransformControls } from "three/addons/controls/TransformControls.js"
import { isBuiltinPropAsset, type LevelObject, type LevelVector3, type LevelWall, type LevelWallKind, type TerrainSettings } from "../../game/level"
import { BuiltinProp } from "../../components/TerraBuiltinProps"

export type TransformMode = "translate" | "rotate" | "scale"
export type TerrainTool = "select" | "paint" | "raise" | "lower"

interface ViewportProps {
  readonly terrain: TerrainSettings
  readonly spawn: LevelVector3
  readonly walls: readonly LevelWall[]
  readonly objects: readonly LevelObject[]
  readonly selectedId: string | null
  readonly selectedWallId: string | null
  readonly placementAsset: string | null
  readonly scatterPlacement: boolean
  readonly placementKind: LevelWallKind | null
  readonly pieceSize: LevelVector3
  readonly spawnPlacement: boolean
  readonly mode: TransformMode
  readonly terrainTool: TerrainTool
  readonly brushSize: number
  readonly materialId: string
  readonly onTerrainBrush: (x: number, z: number, tool: TerrainTool, materialId: string, brushSize: number) => void
  readonly onPlace: (position: LevelVector3) => void
  readonly onScatter: (position: LevelVector3) => void
  readonly onPlaceWall: (position: LevelVector3, kind: LevelWallKind, size: LevelVector3) => void
  readonly onSetSpawn: (position: LevelVector3) => void
  readonly onSelect: (id: string | null) => void
  readonly onSelectWall: (id: string | null) => void
  readonly onTransform: (id: string, object: LevelObject) => void
  readonly onDuplicateTransform: (id: string, object: LevelObject) => void
  readonly onWallTransform: (id: string, wall: LevelWall) => void
  readonly onDuplicateWallTransform: (id: string, wall: LevelWall) => void
}

function EditorCamera({ orbitRef }: { readonly orbitRef: MutableRefObject<OrbitControls | null> }) {
  const { camera, gl } = useThree()
  const [controls] = useState(() => new OrbitControls(camera, gl.domElement))
  useEffect(() => {
    controls.target.set(0, 0, 0)
    controls.enableDamping = true
    controls.enableRotate = true
    controls.enablePan = true
    controls.enableZoom = true
    controls.maxPolarAngle = Math.PI * .48
    controls.minDistance = 5
    controls.maxDistance = 100
    // 좌클릭은 지형 브러시/오브젝트 선택에 사용하고, 카메라 조작은 보조 버튼으로 고정한다.
    controls.mouseButtons.LEFT = null as unknown as MOUSE
    controls.mouseButtons.RIGHT = MOUSE.ROTATE
    controls.mouseButtons.MIDDLE = MOUSE.PAN
    const preventContextMenu = (event: MouseEvent) => event.preventDefault()
    gl.domElement.addEventListener("contextmenu", preventContextMenu)
    controls.update()
    orbitRef.current = controls
    return () => { gl.domElement.removeEventListener("contextmenu", preventContextMenu); orbitRef.current = null; controls.dispose() }
  }, [controls, gl.domElement, orbitRef])
  useFrame(() => controls.update())
  return null
}

function GLBModel({ asset }: { readonly asset: string }) {
  const model = useLoader(GLTFLoader, asset)
  const [scene] = useState(() => model.scene.clone(true))
  useLayoutEffect(() => { scene.traverse((child) => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true } }) }, [scene])
  return <primitive object={scene} />
}

function AssetModel({ asset, objectId }: { readonly asset: string; readonly objectId: string }) {
  if (isBuiltinPropAsset(asset)) return <BuiltinProp asset={asset} objectId={objectId} />
  return <GLBModel asset={asset} />
}

function TerrainSurface({ terrain, placementAsset, scatterPlacement, placementKind, pieceSize, spawnPlacement, tool, materialId, brushSize, onBrush, onPlace, onScatter, onPlaceWall, onSetSpawn }: Pick<ViewportProps, "terrain" | "placementAsset" | "scatterPlacement" | "placementKind" | "pieceSize" | "spawnPlacement" | "onTerrainBrush" | "onPlace" | "onScatter" | "onPlaceWall" | "onSetSpawn"> & { readonly tool: TerrainTool; readonly materialId: string; readonly brushSize: number }) {
  const geometry = useMemo(() => buildTerrainGeometry(terrain), [terrain])
  const [brushPoint, setBrushPoint] = useState<{ x: number; z: number } | null>(null)
  const cellSize = Math.max(terrain.width / terrain.columns, terrain.depth / terrain.rows)
  useEffect(() => () => geometry.dispose(), [geometry])
  const paint = (event: ThreeEvent<PointerEvent>, dragging = false) => {
    if (!dragging && event.button !== 0) return
    event.stopPropagation()
    setBrushPoint({ x: event.point.x, z: event.point.z })
    if (placementAsset) { (scatterPlacement ? onScatter : onPlace)({ x: round(event.point.x), y: 0, z: round(event.point.z) }); return }
    const position = { x: round(event.point.x), y: 0, z: round(event.point.z) }
    if (placementKind) { onPlaceWall(position, placementKind, pieceSize); return }
    if (spawnPlacement) { onSetSpawn(position); return }
    onBrush(event.point.x, event.point.z, event.shiftKey ? "lower" : tool, materialId, brushSize)
  }
  const move = (event: ThreeEvent<PointerEvent>) => {
    setBrushPoint({ x: event.point.x, z: event.point.z })
    if (event.buttons === 1 && !placementAsset) paint(event, true)
  }
  const radius = Math.max(cellSize * .45, brushSize * cellSize / 2)
  return <group>
    <mesh geometry={geometry} receiveShadow onPointerDown={paint} onPointerMove={move} onPointerOut={() => setBrushPoint(null)}>
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
    {brushPoint && !placementAsset && <mesh position={[brushPoint.x, terrain.baseHeight + terrain.maxHeight + .05, brushPoint.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[radius * .82, radius, 32]} />
      <meshBasicMaterial color={tool === "paint" ? "#8be7dc" : "#f0cf76"} transparent opacity={.9} />
    </mesh>}
  </group>
}

function buildTerrainGeometry(terrain: TerrainSettings) {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []
  const cellWidth = terrain.width / terrain.columns
  const cellDepth = terrain.depth / terrain.rows
  const materials = new Map(terrain.materials.map((material) => [material.id, material]))
  const cell = (column: number, row: number) => terrain.cells[row * terrain.columns + column] ?? terrain.cells[0]
  const cornerHeight = (column: number, row: number) => {
    let total = 0; let count = 0
    for (const [dx, dz] of [[-1, -1], [0, -1], [-1, 0], [0, 0]] as const) { const x = column + dx; const z = row + dz; if (x >= 0 && x < terrain.columns && z >= 0 && z < terrain.rows) { total += cell(x, z).height; count += 1 } }
    return terrain.baseHeight + total / Math.max(count, 1)
  }
  const addVertex = (x: number, y: number, z: number, color: string) => { positions.push(x, y, z); const parsed = new Color(color); colors.push(parsed.r, parsed.g, parsed.b); return positions.length / 3 - 1 }
  const addQuad = (vertices: readonly number[]) => { indices.push(vertices[0], vertices[1], vertices[2], vertices[0], vertices[2], vertices[3]) }
  for (let row = 0; row < terrain.rows; row += 1) for (let column = 0; column < terrain.columns; column += 1) {
    const item = cell(column, row); const material = materials.get(item.material) ?? terrain.materials[0]
    const x0 = -terrain.width / 2 + column * cellWidth; const x1 = x0 + cellWidth; const z0 = -terrain.depth / 2 + row * cellDepth; const z1 = z0 + cellDepth
    const top = [addVertex(x0, cornerHeight(column, row), z0, material.topColor), addVertex(x1, cornerHeight(column + 1, row), z0, material.topColor), addVertex(x1, cornerHeight(column + 1, row + 1), z1, material.topColor), addVertex(x0, cornerHeight(column, row + 1), z1, material.topColor)]
    addQuad([top[0], top[3], top[2], top[1]])
    const edges = [[top[0], top[1], column, row - 1], [top[1], top[2], column + 1, row], [top[2], top[3], column, row + 1], [top[3], top[0], column - 1, row]] as const
    for (const [a, b, neighborColumn, neighborRow] of edges) { const neighborHeight = neighborColumn >= 0 && neighborColumn < terrain.columns && neighborRow >= 0 && neighborRow < terrain.rows ? cell(neighborColumn, neighborRow).height : 0; if (item.height > neighborHeight + .02 || neighborColumn < 0 || neighborColumn >= terrain.columns || neighborRow < 0 || neighborRow >= terrain.rows) { const pa = positions.slice(a * 3, a * 3 + 3); const pb = positions.slice(b * 3, b * 3 + 3); const bottomA = addVertex(pa[0], terrain.baseHeight, pa[2], material.sideColor); const bottomB = addVertex(pb[0], terrain.baseHeight, pb[2], material.sideColor); addQuad([a, b, bottomB, bottomA]) } }
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setAttribute("color", new Float32BufferAttribute(colors, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry
}

function EditableObject({ object, selected, mode, orbitRef, onSelect, onTransform, onDuplicateTransform }: { readonly object: LevelObject; readonly selected: boolean; readonly mode: TransformMode; readonly orbitRef: MutableRefObject<OrbitControls | null>; readonly onSelect: (id: string) => void; readonly onTransform: (id: string, object: LevelObject) => void; readonly onDuplicateTransform: (id: string, object: LevelObject) => void }) {
  const group = useRef<Group>(null); const { camera, gl, scene } = useThree()
  const commitTransform = useEffectEvent((duplicate = false) => { const current = group.current; if (!current) return; const next = { ...object, position: { x: current.position.x, y: current.position.y, z: current.position.z }, rotation: { x: current.rotation.x, y: current.rotation.y, z: current.rotation.z }, scale: { x: current.scale.x, y: current.scale.y, z: current.scale.z } }; current.scale.set(1, 1, 1); duplicate ? onDuplicateTransform(object.id, next) : onTransform(object.id, next) })
  useEffect(() => { if (!selected || !group.current) return; const controls = new TransformControls(camera, gl.domElement); controls.setMode(mode); controls.showY = true; controls.attach(group.current); let duplicate = false; const stopOrbit = () => { if (orbitRef.current) orbitRef.current.enabled = false }; const startOrbit = () => { if (orbitRef.current) orbitRef.current.enabled = true; commitTransform(duplicate); duplicate = false }; const detectDuplicate = (event: PointerEvent) => { duplicate = event.button === 0 && event.altKey && Boolean(controls.axis) }; controls.addEventListener("mouseDown", stopOrbit); controls.addEventListener("mouseUp", startOrbit); gl.domElement.addEventListener("pointerdown", detectDuplicate); scene.add(controls.getHelper()); return () => { controls.removeEventListener("mouseDown", stopOrbit); controls.removeEventListener("mouseUp", startOrbit); gl.domElement.removeEventListener("pointerdown", detectDuplicate); controls.detach(); controls.dispose(); scene.remove(controls.getHelper()) } }, [camera, commitTransform, gl.domElement, mode, orbitRef, scene, selected])
  return <group ref={group} position={[object.position.x, object.position.y, object.position.z]} rotation={[object.rotation.x, object.rotation.y, object.rotation.z]} scale={[object.scale.x, object.scale.y, object.scale.z]} onPointerDown={(event) => { if (event.button !== 0) return; event.stopPropagation(); onSelect(object.id) }}><AssetModel asset={object.asset} objectId={object.id} /></group>
}

function EditableWall({ wall, selected, mode, orbitRef, onSelect, onTransform, onDuplicateWallTransform }: { readonly wall: LevelWall; readonly selected: boolean; readonly mode: TransformMode; readonly orbitRef: MutableRefObject<OrbitControls | null>; readonly onSelect: (id: string) => void; readonly onTransform: (id: string, wall: LevelWall) => void; readonly onDuplicateWallTransform: (id: string, wall: LevelWall) => void }) {
  const group = useRef<Group>(null); const { camera, gl, scene } = useThree()
  const commitTransform = useEffectEvent((duplicate = false) => { const current = group.current; if (!current) return; const next = { ...wall, position: { x: current.position.x, y: wall.kind === "wall" ? wall.position.y : current.position.y, z: current.position.z }, size: { x: wall.size.x * current.scale.x, y: wall.size.y * current.scale.y, z: wall.size.z * current.scale.z }, rotationY: current.rotation.y }; current.scale.set(1, 1, 1); duplicate ? onDuplicateWallTransform(wall.id, next) : onTransform(wall.id, next) })
  useEffect(() => { if (!selected || !group.current) return; const controls = new TransformControls(camera, gl.domElement); controls.setMode(mode); controls.showY = wall.kind !== "wall"; controls.attach(group.current); let duplicate = false; const stopOrbit = () => { if (orbitRef.current) orbitRef.current.enabled = false }; const startOrbit = () => { if (orbitRef.current) orbitRef.current.enabled = true; commitTransform(duplicate); duplicate = false }; const detectDuplicate = (event: PointerEvent) => { duplicate = event.button === 0 && event.altKey && Boolean(controls.axis) }; controls.addEventListener("mouseDown", stopOrbit); controls.addEventListener("mouseUp", startOrbit); gl.domElement.addEventListener("pointerdown", detectDuplicate); scene.add(controls.getHelper()); return () => { controls.removeEventListener("mouseDown", stopOrbit); controls.removeEventListener("mouseUp", startOrbit); gl.domElement.removeEventListener("pointerdown", detectDuplicate); controls.detach(); controls.dispose(); scene.remove(controls.getHelper()) } }, [camera, commitTransform, gl.domElement, mode, orbitRef, scene, selected, wall.kind])
  return <group ref={group} position={[wall.position.x, wall.position.y, wall.position.z]} rotation={[0, wall.rotationY, 0]} scale={[1, 1, 1]} onPointerDown={(event) => { if (event.button !== 0) return; event.stopPropagation(); onSelect(wall.id) }}><WallVisual wall={wall} selected={selected} /></group>
}

function WallVisual({ wall, selected }: { readonly wall: LevelWall; readonly selected: boolean }) {
  const sideColor = selected ? wall.color : wall.color
  if (wall.kind === "ramp") return <RampVisual size={wall.size} topColor={wall.topColor} sideColor={sideColor} />
  if (wall.kind === "block") return <><mesh castShadow><boxGeometry args={[wall.size.x, wall.size.y, wall.size.z]} /><meshStandardMaterial color={sideColor} emissive={selected ? wall.color : "#000000"} emissiveIntensity={selected ? .12 : 0} /></mesh><mesh position={[0, wall.size.y / 2 + .01, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[wall.size.x, wall.size.z]} /><meshStandardMaterial color={wall.topColor} /></mesh></>
  return <mesh castShadow><boxGeometry args={[wall.size.x, wall.size.y, wall.size.z]} /><meshStandardMaterial color={sideColor} emissive={selected ? wall.color : "#000000"} emissiveIntensity={selected ? .12 : 0} /></mesh>
}

function RampVisual({ size, topColor, sideColor }: { readonly size: LevelVector3; readonly topColor: string; readonly sideColor: string }) {
  const geometry = useMemo(() => {
    const geometry = new BufferGeometry()
    const [x, y, z] = [size.x / 2, size.y / 2, size.z / 2]
    const positions = [-x, -y, -z, x, -y, -z, -x, -y, z, x, -y, z, -x, y, z, x, y, z]
    const indices = [0, 4, 5, 0, 5, 1, 0, 2, 4, 1, 3, 5, 2, 3, 5, 2, 5, 4, 0, 1, 3, 0, 3, 2]
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.addGroup(0, 6, 0); geometry.addGroup(6, indices.length - 6, 1); geometry.computeVertexNormals(); return geometry
  }, [size.x, size.y, size.z])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} castShadow><meshStandardMaterial attach="material-0" color={topColor} /><meshStandardMaterial attach="material-1" color={sideColor} /></mesh>
}

function EditorWorld(props: ViewportProps) {
  const orbitRef = useRef<OrbitControls | null>(null)
  const place = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return
    event.stopPropagation()
    const position = { x: round(event.point.x), y: 0, z: round(event.point.z) }
    if (props.placementAsset) { props.onPlace(position); return }
    if (props.placementKind) { props.onPlaceWall(position, props.placementKind, props.pieceSize); return }
        if (props.spawnPlacement) { props.onSetSpawn(position); return }
    props.onSelect(null); props.onSelectWall(null)
  }
  return <>
    <color attach="background" args={["#101817"]} /><ambientLight intensity={1.4} /><directionalLight castShadow intensity={2.2} position={[12, 18, 10]} />
    <EditorCamera orbitRef={orbitRef} />
    <gridHelper args={[Math.max(props.terrain.width, props.terrain.depth), 56, "#6fd5c8", "#304844"]} position={[0, .02, 0]} />
    <TerrainSurface terrain={props.terrain} placementAsset={props.placementAsset} scatterPlacement={props.scatterPlacement} placementKind={props.placementKind} pieceSize={props.pieceSize} spawnPlacement={props.spawnPlacement} tool={props.terrainTool} materialId={props.materialId} brushSize={props.brushSize} onBrush={props.onTerrainBrush} onPlace={props.onPlace} onScatter={props.onScatter} onPlaceWall={props.onPlaceWall} onSetSpawn={props.onSetSpawn} />
    <mesh position={[props.spawn.x, props.spawn.y + .05, props.spawn.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}><ringGeometry args={[.45, .58, 24]} /><meshBasicMaterial color={props.spawnPlacement ? "#f0cf76" : "#8be7dc"} transparent opacity={.9} /></mesh>
    {props.walls.map((wall) => <EditableWall key={wall.id} wall={wall} selected={wall.id === props.selectedWallId} mode={props.mode} orbitRef={orbitRef} onSelect={(id) => { props.onSelect(null); props.onSelectWall(id) }} onTransform={props.onWallTransform} onDuplicateWallTransform={props.onDuplicateWallTransform} />)}
    {props.objects.map((object) => <EditableObject key={`${object.id}-${object.asset}`} object={object} selected={object.id === props.selectedId} mode={props.mode} orbitRef={orbitRef} onSelect={(id) => { props.onSelectWall(null); props.onSelect(id) }} onTransform={props.onTransform} onDuplicateTransform={props.onDuplicateTransform} />)}
    <mesh position={[0, props.terrain.baseHeight - .08, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={place}><planeGeometry args={[props.terrain.width, props.terrain.depth]} /><meshBasicMaterial transparent opacity={0} /></mesh>
  </>
}

export function EditorViewport(props: ViewportProps) {
  return <Canvas shadows camera={{ position: [14, 16, 14], fov: 42, near: .1, far: 240 }} onPointerMissed={(event) => { if (event.button !== 0) return; props.onSelect(null); props.onSelectWall(null) }}><EditorWorld {...props} /></Canvas>
}

function round(value: number) { return Math.round(value * 10) / 10 }
