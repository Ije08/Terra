"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { BUILTIN_PROP_META, createDefaultLevel, getBuiltinPropMeta, getTerrainHeight, getTerrainSurfaceHeight, readLevelDocument, snapWallToLevel, type LevelDocument, type LevelObject, type LevelVector3, type LevelWall, type LevelWallKind, type TerrainMaterial } from "../../game/level"
import { EditorViewport, type TerrainTool, type TransformMode } from "./EditorViewport"
import styles from "./LevelEditor.module.css"

interface LevelEditorProps { readonly initialLevels: readonly LevelDocument[] }
const EDITOR_SERVER = "http://localhost:3001"
function assetName(asset: string) { return getBuiltinPropMeta(asset)?.label ?? decodeURIComponent(asset.split("/").at(-1) ?? asset) }
function replaceObject(level: LevelDocument, id: string, next: LevelObject): LevelDocument { return { ...level, objects: level.objects.map((object) => object.id === id ? next : object) } }
function replaceWall(level: LevelDocument, id: string, next: LevelWall): LevelDocument { return { ...level, walls: level.walls.map((wall) => wall.id === id ? next : wall) } }
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(maximum, value)) }

export function LevelEditor({ initialLevels }: LevelEditorProps) {
  const fallbackLevel = initialLevels?.[0] ?? createDefaultLevel("terra-forest", "테라 숲")
  const initialLevelList = initialLevels?.length ? initialLevels : [fallbackLevel]
  const [levels, setLevels] = useState(initialLevelList)
  const [levelState, setLevel] = useState<LevelDocument | undefined>(fallbackLevel)
  const level = levelState ?? fallbackLevel
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null)
  const [placementAsset, setPlacementAsset] = useState<string | null>(null)
  const [scatterPlacement, setScatterPlacement] = useState(false)
  const [scatterCount, setScatterCount] = useState(8)
  const [placementKind, setPlacementKind] = useState<LevelWallKind | null>(null)
  const [pieceSize, setPieceSize] = useState<LevelVector3>({ x: 4, y: 1, z: 4 })
  const [spawnPlacement, setSpawnPlacement] = useState(false)
  const [mode, setMode] = useState<TransformMode>("translate")
  const [terrainTool, setTerrainTool] = useState<TerrainTool>("select")
  const [brushSize, setBrushSize] = useState(1)
  const [materialId, setMaterialId] = useState(level.terrain.materials[0]?.id ?? "grass")
  const [past, setPast] = useState<readonly LevelDocument[]>([])
  const [future, setFuture] = useState<readonly LevelDocument[]>([])
  const [status, setStatus] = useState("에디터 준비 완료")
  const importInput = useRef<HTMLInputElement>(null)
  const selected = level.objects.find((object) => object.id === selectedId) ?? null
  const selectedWall = level.walls.find((wall) => wall.id === selectedWallId) ?? null

  const commit = (next: LevelDocument, message: string) => { setPast((items) => [...items.slice(-49), level]); setFuture([]); setLevel(next); setStatus(message) }
  const clearPlacement = () => { setPlacementAsset(null); setScatterPlacement(false); setPlacementKind(null); setSpawnPlacement(false) }
  const beginPlacement = (kind: LevelWallKind) => { clearPlacement(); setPlacementKind(kind) }
  const beginBuiltinPlacement = (asset: string, scatter = false) => { clearPlacement(); setPlacementAsset(asset); setScatterPlacement(scatter) }
  const selectMap = (id: string) => { const next = levels.find((item) => item.id === id); if (!next) return; setLevel(next); setSelectedId(null); setSelectedWallId(null); setMaterialId(next.terrain.materials[0]?.id ?? "grass"); setPast([]); setFuture([]); setStatus(`${next.name} 맵을 열었습니다.`) }
  const createMap = () => { const name = window.prompt("새 맵 이름", "테라 거주 광장"); if (!name?.trim()) return; const idInput = window.prompt("맵 ID (영문 소문자, 숫자, 하이픈)", `terra-${Date.now().toString(36)}`); if (!idInput) return; const id = idInput.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40); if (levels.some((item) => item.id === id)) { setStatus("같은 맵 ID가 이미 있습니다."); return } const next = createDefaultLevel(id, name.trim()); setLevels((items) => [...items, next]); setLevel(next); setSelectedId(null); setSelectedWallId(null); setMaterialId("grass"); setPast([]); setFuture([]); setStatus("새 맵을 만들었습니다. 저장하면 프로젝트에 추가됩니다.") }
  const place = (position: LevelVector3) => { if (!placementAsset) return; const object: LevelObject = { id: crypto.randomUUID(), asset: placementAsset, position: { ...position, y: getTerrainHeight(level, position.x, position.z) }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, collision: true }; commit({ ...level, objects: [...level.objects, object] }, `${assetName(placementAsset)} 배치`); setSelectedId(object.id); setSelectedWallId(null); clearPlacement() }
  const scatter = (position: LevelVector3) => { if (!placementAsset) return; const objects = Array.from({ length: scatterCount }, (_, index) => { const angle = index * 2.39996; const radius = 1.5 + (index % 4) * 1.25; const x = clamp(position.x + Math.cos(angle) * radius, -level.terrain.width / 2 + 1, level.terrain.width / 2 - 1); const z = clamp(position.z + Math.sin(angle) * radius, -level.terrain.depth / 2 + 1, level.terrain.depth / 2 - 1); return { id: crypto.randomUUID(), asset: placementAsset, position: { x, y: getTerrainHeight(level, x, z), z }, rotation: { x: 0, y: angle, z: 0 }, scale: { x: .9 + (index % 3) * .1, y: .9 + (index % 4) * .08, z: .9 + (index % 3) * .1 }, collision: true } }) as readonly LevelObject[]; commit({ ...level, objects: [...level.objects, ...objects] }, `${assetName(placementAsset)} ${objects.length}개 스캐터 배치`); setSelectedId(objects.at(-1)?.id ?? null); setSelectedWallId(null); clearPlacement() }
  const placeWall = (position: LevelVector3, kind: LevelWallKind, size: LevelVector3) => { const source: LevelWall = { id: crypto.randomUUID(), kind, position: { x: position.x, y: getTerrainSurfaceHeight(level, position.x, position.z) + size.y / 2, z: position.z }, size, rotationY: 0, color: kind === "wall" ? "#53635e" : "#c9b995", topColor: kind === "wall" ? "#53635e" : "#78a879", collision: true }; const wall = snapWallToLevel(level, source); commit({ ...level, walls: [...level.walls, wall] }, kind === "ramp" ? "경사로를 격자 정렬 배치했습니다." : kind === "block" ? "지형 블록을 격자 정렬 배치했습니다." : "벽을 배치했습니다."); setSelectedWallId(wall.id); setSelectedId(null); clearPlacement() }
  const setSpawnPoint = (position: LevelVector3) => { commit({ ...level, spawn: { x: position.x, y: getTerrainHeight(level, position.x, position.z), z: position.z } }, "플레이어 시작 지점을 지정했습니다."); setSpawnPlacement(false) }
  const transform = (id: string, object: LevelObject) => commit(replaceObject(level, id, object), "오브젝트 변형을 적용했습니다.")
  const transformWall = (id: string, wall: LevelWall) => commit(replaceWall(level, id, snapWallToLevel(level, wall)), "벽 변형과 격자 정렬을 적용했습니다.")
  const duplicateTransform = (id: string, object: LevelObject) => { const copy = { ...object, id: crypto.randomUUID() }; commit({ ...level, objects: [...level.objects, copy] }, "오브젝트를 복제했습니다."); setSelectedWallId(null); setSelectedId(copy.id) }
  const duplicateWallTransform = (id: string, wall: LevelWall) => { const copy = snapWallToLevel(level, { ...wall, id: crypto.randomUUID() }); commit({ ...level, walls: [...level.walls, copy] }, "배치를 복제하고 격자 정렬했습니다."); setSelectedId(null); setSelectedWallId(copy.id) }
  const applyBrush = (x: number, z: number, tool: TerrainTool, nextMaterial: string, size: number) => {
    if (tool === "select") return
    const { width, depth, columns, rows, cells } = level.terrain
    const cellWidth = width / columns
    const cellDepth = depth / rows
    const radiusX = Math.max(cellWidth * .5, size * cellWidth * .5)
    const radiusZ = Math.max(cellDepth * .5, size * cellDepth * .5)
    const changed = cells.map((cell, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const cellX = -width / 2 + (column + .5) * cellWidth
      const cellZ = -depth / 2 + (row + .5) * cellDepth
      const distance = Math.hypot((cellX - x) / radiusX, (cellZ - z) / radiusZ)
      if (distance > 1) return cell
      if (tool === "paint") return { ...cell, material: nextMaterial }
      const influence = 1 - distance
      const delta = (tool === "raise" ? .25 : -.25) * influence
      return { ...cell, height: clamp(cell.height + delta, 0, level.terrain.maxHeight) }
    })
    commit({ ...level, terrain: { ...level.terrain, cells: changed } }, tool === "paint" ? "지형 색상을 칠했습니다." : "지형 높이를 조절했습니다.")
  }
  const patchTerrain = (patch: Partial<LevelDocument["terrain"]>) => commit({ ...level, terrain: { ...level.terrain, ...patch } }, "지형 속성을 변경했습니다.")
  const patchMaterial = (id: string, patch: Partial<TerrainMaterial>) => patchTerrain({ materials: level.terrain.materials.map((material) => material.id === id ? { ...material, ...patch } : material) })
  const addWall = () => { const wall: LevelWall = { id: crypto.randomUUID(), kind: "wall", position: { x: 0, y: level.terrain.baseHeight + 1, z: 0 }, size: { x: 6, y: 2, z: .35 }, rotationY: 0, color: "#53635e", topColor: "#53635e", collision: true }; commit({ ...level, walls: [...level.walls, wall] }, "벽을 추가했습니다."); setSelectedWallId(wall.id); setSelectedId(null) }
  const patchSelected = (patch: Partial<LevelObject>) => { if (selected) commit(replaceObject(level, selected.id, { ...selected, ...patch }), "오브젝트 속성을 변경했습니다.") }
  const patchSelectedWall = (patch: Partial<LevelWall>) => { if (selectedWall) commit(replaceWall(level, selectedWall.id, snapWallToLevel(level, { ...selectedWall, ...patch })), "벽 속성과 격자 정렬을 적용했습니다.") }
  const removeSelected = () => { if (selected) { commit({ ...level, objects: level.objects.filter((object) => object.id !== selected.id) }, "오브젝트를 삭제했습니다."); setSelectedId(null) } else if (selectedWall) { commit({ ...level, walls: level.walls.filter((wall) => wall.id !== selectedWall.id) }, "벽을 삭제했습니다."); setSelectedWallId(null) } }
  const undo = () => { const previous = past.at(-1); if (!previous) return; setPast((items) => items.slice(0, -1)); setFuture((items) => [level, ...items]); setLevel(previous); setStatus("실행 취소") }
  const redo = () => { const next = future[0]; if (!next) return; setFuture((items) => items.slice(1)); setPast((items) => [...items, level]); setLevel(next); setStatus("다시 실행") }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isEditingField = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement
      if (!isEditingField && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault()
        removeSelected()
        return
      }
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo() }
      else if (event.key.toLowerCase() === "y") { event.preventDefault(); redo() }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [redo, removeSelected, undo])
  const save = async () => { setStatus("레벨 저장 중..."); try { const response = await fetch(`${EDITOR_SERVER}/level?id=${level.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(level) }); const body: unknown = await response.json(); if (response.ok) { setLevels((items) => items.some((item) => item.id === level.id) ? items.map((item) => item.id === level.id ? level : item) : [...items, level]); setStatus(`${level.name}을 저장했습니다.`) } else setStatus(readError(body)) } catch { setStatus("레벨 저장 서버를 먼저 실행해주세요: npm run dev:level-editor") } }
  const importLevel = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { const parsed: unknown = JSON.parse(await file.text()); const next = readLevelDocument(parsed, level.id); if (!next) throw new Error("지원하지 않는 레벨 형식입니다."); setLevels((items) => items.some((item) => item.id === next.id) ? items.map((item) => item.id === next.id ? next : item) : [...items, next]); setLevel(next); setSelectedId(null); setSelectedWallId(null); setStatus(`${file.name} 불러오기 완료`) } catch (error: unknown) { setStatus(error instanceof Error ? error.message : "레벨을 불러오지 못했습니다.") } event.target.value = "" }
  const exportLevel = () => { const url = URL.createObjectURL(new Blob([`${JSON.stringify(level, null, 2)}\n`], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${level.id}.json`; anchor.click(); URL.revokeObjectURL(url); setStatus("레벨 JSON을 내보냈습니다.") }

  return <main className={styles.editor}>
    <header className={styles.header}><div><strong>테라 레벨 제작실</strong><span>개발 환경 전용 · {level.name} · {level.objects.length + level.walls.length}개 배치</span></div><div className={styles.mapControls}><label>맵<select value={level.id} onChange={(event) => selectMap(event.target.value)}>{levels.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><button type="button" onClick={createMap}>새 맵</button><button type="button" onClick={undo} disabled={!past.length}>실행 취소</button><button type="button" onClick={redo} disabled={!future.length}>다시 실행</button><button type="button" onClick={() => importInput.current?.click()}>JSON 불러오기</button><button type="button" onClick={exportLevel}>JSON 내보내기</button><button className={styles.primary} type="button" onClick={save}>프로젝트에 저장</button></div></header>
    <div className={styles.workspace}>
      <aside className={styles.library}><div className={styles.panelTitle}><span>도구</span><span className={styles.panelNote}>내장 오브젝트</span></div><p>선택 도구를 기본으로 사용합니다. 나무와 바위를 필드에 배치하세요.</p><div className={styles.toolGrid}><button type="button" className={terrainTool === "select" ? styles.active : ""} onClick={() => { clearPlacement(); setTerrainTool("select") }}>선택</button>{(["paint", "raise", "lower"] as const).map((item) => <button type="button" key={item} className={terrainTool === item ? styles.active : ""} onClick={() => { clearPlacement(); setTerrainTool(item) }}>{item === "paint" ? "표면 칠하기" : item === "raise" ? "지형 올리기" : "지형 낮추기"}</button>)}<button type="button" onClick={() => beginPlacement("wall")} className={placementKind === "wall" ? styles.active : ""}>벽 배치</button><button type="button" onClick={() => beginPlacement("block")} className={placementKind === "block" ? styles.active : ""}>블록 배치</button><button type="button" onClick={() => beginPlacement("ramp")} className={placementKind === "ramp" ? styles.active : ""}>경사로 배치</button><button type="button" onClick={() => { clearPlacement(); setSpawnPlacement(true) }} className={spawnPlacement ? styles.active : ""}>시작 지점</button></div>{placementKind && <VectorFields label="배치 크기" value={pieceSize} minimum={.25} onChange={setPieceSize} />}<label className={styles.rangeField}>브러시 크기<input type="range" min="1" max="5" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} /><strong>{brushSize}</strong></label><h2 className={styles.subheading}>표면 팔레트</h2><div className={styles.palette}>{level.terrain.materials.map((material) => <button className={materialId === material.id ? styles.selected : ""} type="button" key={material.id} onClick={() => { clearPlacement(); setMaterialId(material.id); setTerrainTool("paint") }}><i style={{ background: material.topColor }} /><span>{material.label}</span></button>)}</div><div className={styles.assetList}>{BUILTIN_PROP_META.map((meta) => <div className={styles.assetRow} key={meta.asset}><button className={placementAsset === meta.asset && !scatterPlacement ? styles.active : ""} type="button" onClick={() => beginBuiltinPlacement(meta.asset)}><span className={styles.assetIcon}>◈</span><span><b>{meta.label}</b><small>{meta.description}</small></span></button><button className={scatterPlacement && placementAsset === meta.asset ? styles.active : ""} type="button" onClick={() => beginBuiltinPlacement(meta.asset, true)}>스캐터</button></div>)}</div>{placementAsset ? <label className={styles.rangeField}>스캐터 수<input type="range" min="2" max="24" value={scatterCount} onChange={(event) => setScatterCount(Number(event.target.value))} /><strong>{scatterCount}</strong></label> : null}<div className={styles.objectList}><h2>배치 목록</h2>{level.walls.map((wall, index) => <button className={selectedWallId === wall.id ? styles.selected : ""} type="button" key={wall.id} onClick={() => { clearPlacement(); setSelectedWallId(wall.id); setSelectedId(null) }}><span>W{String(index + 1).padStart(2, "0")}</span>{wall.kind === "ramp" ? "경사로" : wall.kind === "block" ? "지형 블록" : "벽 조각"}</button>)}{level.objects.map((object, index) => <button className={selectedId === object.id ? styles.selected : ""} type="button" key={object.id} onClick={() => { clearPlacement(); setSelectedId(object.id); setSelectedWallId(null) }}><span>{String(index + 1).padStart(2, "0")}</span>{assetName(object.asset)}</button>)}</div></aside>
      <section className={styles.viewport} aria-label="3D 레벨 편집 화면"><div className={styles.modeBar}>{(["translate", "rotate", "scale"] as const).map((item) => <button type="button" aria-pressed={mode === item} key={item} onClick={() => setMode(item)}>{item === "translate" ? "이동" : item === "rotate" ? "회전" : "크기"}</button>)}</div><EditorViewport terrain={level.terrain} spawn={level.spawn} walls={level.walls} objects={level.objects} selectedId={selectedId} selectedWallId={selectedWallId} placementAsset={placementAsset} scatterPlacement={scatterPlacement} placementKind={placementKind} pieceSize={pieceSize} spawnPlacement={spawnPlacement} mode={mode} terrainTool={terrainTool} brushSize={brushSize} materialId={materialId} onTerrainBrush={applyBrush} onPlace={place} onScatter={scatter} onPlaceWall={placeWall} onSetSpawn={setSpawnPoint} onSelect={setSelectedId} onSelectWall={setSelectedWallId} onTransform={transform} onDuplicateTransform={duplicateTransform} onWallTransform={transformWall} onDuplicateWallTransform={duplicateWallTransform} /><div className={styles.help}>좌클릭 브러시·배치 · 우클릭 회전 · 중클릭 이동 · 휠 확대</div></section>
      <aside className={styles.inspector}><div className={styles.panelTitle}><span>{selected || selectedWall ? "선택 속성" : "지형 설정"}</span>{selected || selectedWall ? <button className={styles.danger} type="button" onClick={removeSelected}>삭제</button> : null}</div>{selected ? <ObjectInspector object={selected} onChange={patchSelected} /> : selectedWall ? <WallInspector wall={selectedWall} onChange={patchSelectedWall} /> : <><TerrainInspector terrain={level.terrain} onTerrainChange={patchTerrain} onMaterialChange={patchMaterial} /><VectorFields label="플레이어 시작 지점" value={level.spawn} onChange={(spawn) => commit({ ...level, spawn }, "시작 지점을 변경했습니다.")} /></>}</aside>
    </div>
    <footer className={styles.status} role="status" aria-live="polite"><span className={placementAsset ? styles.placing : ""}>{placementAsset ? `${assetName(placementAsset)} 배치 대기 중` : status}</span><a href="/">게임으로 돌아가기</a></footer>
    <input ref={importInput} type="file" accept=".json,application/json" hidden onChange={importLevel} />
  </main>
}

function TerrainInspector({ terrain, onTerrainChange, onMaterialChange }: { readonly terrain: LevelDocument["terrain"]; readonly onTerrainChange: (patch: Partial<LevelDocument["terrain"]>) => void; readonly onMaterialChange: (id: string, patch: Partial<TerrainMaterial>) => void }) { return <div className={styles.inspectorStack}><NumberField label="?? ??" value={terrain.width} onChange={(value) => onTerrainChange({ width: clamp(value, 4, 256) })} /><NumberField label="?? ??" value={terrain.depth} onChange={(value) => onTerrainChange({ depth: clamp(value, 4, 256) })} /><NumberField label="?? ??" value={terrain.baseHeight} onChange={(value) => onTerrainChange({ baseHeight: value })} /><NumberField label="?? ??" value={terrain.maxHeight} onChange={(value) => onTerrainChange({ maxHeight: clamp(value, 1, 20) })} /><fieldset><legend>?? ??</legend>{terrain.materials.map((material) => <div className={styles.materialEditor} key={material.id}><strong>{material.label}</strong><label>??<input type="color" value={material.topColor} onChange={(event) => onMaterialChange(material.id, { topColor: event.target.value })} /></label><label>??<input type="color" value={material.sideColor} onChange={(event) => onMaterialChange(material.id, { sideColor: event.target.value })} /></label></div>)}</fieldset></div> }
function ObjectInspector({ object, onChange }: { readonly object: LevelObject; readonly onChange: (patch: Partial<LevelObject>) => void }) { return <><label>에셋<input value={assetName(object.asset)} readOnly /></label><VectorFields label="위치" value={object.position} onChange={(position) => onChange({ position })} /><VectorFields label="회전" value={object.rotation} step={.1} onChange={(rotation) => onChange({ rotation })} /><VectorFields label="크기" value={object.scale} step={.1} minimum={.05} onChange={(scale) => onChange({ scale })} /><label className={styles.check}><input type="checkbox" checked={object.collision} onChange={(event) => onChange({ collision: event.target.checked })} />충돌 사용</label></> }
function WallInspector({ wall, onChange }: { readonly wall: LevelWall; readonly onChange: (patch: Partial<LevelWall>) => void }) { return <><label>형태<input value={wall.kind === "ramp" ? "경사로" : wall.kind === "block" ? "지형 블록" : "벽"} readOnly /></label><VectorFields label="위치" value={wall.position} onChange={(position) => onChange({ position })} /><VectorFields label="크기" value={wall.size} minimum={.1} onChange={(size) => onChange({ size })} /><NumberField label="방향(도)" value={Math.round(wall.rotationY * 180 / Math.PI)} onChange={(value) => onChange({ rotationY: value * Math.PI / 180 })} /><label>측면 색상<input type="color" value={wall.color} onChange={(event) => onChange({ color: event.target.value })} /></label><label>상부 색상<input type="color" value={wall.topColor} onChange={(event) => onChange({ topColor: event.target.value })} /></label><label className={styles.check}><input type="checkbox" checked={wall.collision} onChange={(event) => onChange({ collision: event.target.checked })} />충돌 사용</label></> }
function VectorFields({ label, value, onChange, step = .1, minimum }: { readonly label: string; readonly value: LevelVector3; readonly onChange: (value: LevelVector3) => void; readonly step?: number; readonly minimum?: number }) { return <fieldset><legend>{label}</legend><div className={styles.vector}>{(["x", "y", "z"] as const).map((axis) => <label key={axis}>{axis.toUpperCase()}<input type="number" value={round(value[axis])} min={minimum} step={step} onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next) && (minimum === undefined || next >= minimum)) onChange({ ...value, [axis]: next }) }} /></label>)}</div></fieldset> }
function NumberField({ label, value, onChange }: { readonly label: string; readonly value: number; readonly onChange: (value: number) => void }) { return <label>{label}<input type="number" value={round(value)} step="0.1" onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next)) onChange(next) }} /></label> }
function round(value: number) { return Math.round(value * 1000) / 1000 }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null }
function readError(value: unknown) { return isRecord(value) && typeof value.error === "string" ? value.error : "요청을 처리하지 못했습니다." }
