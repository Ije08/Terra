import { createServer } from "node:http"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

const HOST = "127.0.0.1"
const PORT = 3001
const ROOT = process.cwd()
const ASSET_DIRECTORY = path.join(ROOT, "public", "assets", "models", "level-editor")
const LEVEL_DIRECTORY = path.join(ROOT, "app", "game", "levels")
const MAX_ASSET_SIZE = 30 * 1024 * 1024
const MAX_LEVEL_SIZE = 3 * 1024 * 1024

function headers(contentType = "application/json; charset=utf-8") {
  return { "Access-Control-Allow-Headers": "Content-Type, X-File-Name", "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS", "Access-Control-Allow-Origin": "http://localhost:3000", "Content-Type": contentType }
}
function send(response, status, value) { response.writeHead(status, headers()); response.end(JSON.stringify(value)) }
function isRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value) }
function isFiniteNumber(value) { return typeof value === "number" && Number.isFinite(value) }
function isVector(value) { return isRecord(value) && [value.x, value.y, value.z].every(isFiniteNumber) }
function isColor(value) { return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) }
const BUILTIN_ASSETS = new Set(["builtin:tree-background", "builtin:tree-collectible", "builtin:rock-collectible"])
function isAsset(value) { return typeof value === "string" && (BUILTIN_ASSETS.has(value) || (value.startsWith("/assets/models/") && value.toLowerCase().endsWith(".glb"))) }
function isLevel(value) {
  return isRecord(value) && value.version === 2 && typeof value.id === "string" && /^[a-z0-9-]{2,40}$/.test(value.id) && typeof value.name === "string" && isVector(value.spawn) && isRecord(value.terrain) && isFiniteNumber(value.terrain.width) && isFiniteNumber(value.terrain.depth) && isFiniteNumber(value.terrain.columns) && isFiniteNumber(value.terrain.rows) && Array.isArray(value.terrain.cells) && Array.isArray(value.terrain.materials) && value.terrain.cells.length === value.terrain.columns * value.terrain.rows && value.terrain.materials.every((item) => isRecord(item) && typeof item.id === "string" && isColor(item.topColor) && isColor(item.sideColor)) && Array.isArray(value.walls) && value.walls.every((item) => isRecord(item) && typeof item.id === "string" && isVector(item.position) && isVector(item.size) && isFiniteNumber(item.rotationY) && isColor(item.color)) && Array.isArray(value.objects) && value.objects.length <= 500 && value.objects.every((item) => isRecord(item) && typeof item.id === "string" && isAsset(item.asset) && typeof item.collision === "boolean" && isVector(item.position) && isVector(item.rotation) && isVector(item.scale))
}
function safeId(value) { return /^[a-z0-9-]{2,40}$/.test(value) ? value : null }
function levelFile(id) { return path.join(LEVEL_DIRECTORY, `${id}.json`) }
function queryId(request) { return safeId(new URL(request.url, `http://${HOST}:${PORT}`).searchParams.get("id") ?? "") }
async function readBody(request, limit) {
  const chunks = []; let size = 0
  for await (const chunk of request) { size += chunk.length; if (size > limit) throw new Error("요청 파일이 너무 큽니다."); chunks.push(chunk) }
  return Buffer.concat(chunks)
}
async function listAssets() {
  try { return (await readdir(ASSET_DIRECTORY, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".glb")).map((entry) => `/assets/models/level-editor/${entry.name}`).sort() } catch { return [] }
}
async function listLevels() {
  try { return (await readdir(LEVEL_DIRECTORY, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.startsWith("terra-") && entry.name.endsWith(".json")).map((entry) => entry.name.slice(0, -5)).sort() } catch { return [] }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") { response.writeHead(204, headers()); response.end(); return }
  try {
    if (request.method === "GET" && request.url === "/health") { send(response, 200, { ok: true }); return }
    if (request.method === "GET" && request.url === "/assets") { send(response, 200, { assets: await listAssets() }); return }
    if (request.method === "GET" && new URL(request.url, `http://${HOST}:${PORT}`).pathname === "/levels") { send(response, 200, { levels: await listLevels() }); return }
    if (request.method === "GET" && new URL(request.url, `http://${HOST}:${PORT}`).pathname === "/level") {
      const id = queryId(request); if (!id) { send(response, 400, { error: "맵 ID가 필요합니다." }); return }
      send(response, 200, { level: JSON.parse(await readFile(levelFile(id), "utf8")) }); return
    }
    if (request.method === "PUT" && new URL(request.url, `http://${HOST}:${PORT}`).pathname === "/level") {
      const level = JSON.parse((await readBody(request, MAX_LEVEL_SIZE)).toString("utf8"))
      const id = queryId(request); if (!id || !isLevel(level) || level.id !== id) { send(response, 400, { error: "레벨 데이터 형식이 올바르지 않습니다." }); return }
      await writeFile(levelFile(id), `${JSON.stringify(level, null, 2)}\n`, "utf8"); send(response, 200, { level }); return
    }
    if (request.method === "POST" && request.url === "/assets") {
      const rawName = decodeURIComponent(String(request.headers["x-file-name"] ?? ""))
      const safeName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, "-")
      if (!safeName.toLowerCase().endsWith(".glb")) { send(response, 400, { error: "GLB 파일만 업로드할 수 있습니다." }); return }
      const bytes = await readBody(request, MAX_ASSET_SIZE)
      if (bytes.length < 4 || bytes.subarray(0, 4).toString("ascii") !== "glTF") { send(response, 400, { error: "올바른 GLB 파일이 아닙니다." }); return }
      await mkdir(ASSET_DIRECTORY, { recursive: true }); await writeFile(path.join(ASSET_DIRECTORY, safeName), bytes, { flag: "wx" })
      send(response, 201, { asset: `/assets/models/level-editor/${safeName}`, assets: await listAssets() }); return
    }
    send(response, 404, { error: "지원하지 않는 요청입니다." })
  } catch (error) {
    const duplicate = error instanceof Error && "code" in error && error.code === "EEXIST"
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT"
    send(response, missing ? 404 : duplicate ? 409 : 500, { error: missing ? "맵 파일을 찾을 수 없습니다." : duplicate ? "같은 이름의 에셋이 이미 있습니다." : error instanceof Error ? error.message : "요청을 처리하지 못했습니다." })
  }
})

server.listen(PORT, HOST, () => process.stdout.write(`TERRA level editor server: http://${HOST}:${PORT}\n`))
