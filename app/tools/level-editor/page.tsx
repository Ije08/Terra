import { notFound } from "next/navigation"
import { LevelEditor } from "./LevelEditor"
import forestSource from "../../game/levels/terra-forest.json"
import plazaSource from "../../game/levels/terra-plaza.json"
import { readLevelDocument } from "../../game/level"

export default async function LevelEditorPage() {
  if (process.env.NODE_ENV !== "development") notFound()
  const forest = readLevelDocument(forestSource, "terra-forest")
  const plaza = readLevelDocument(plazaSource, "terra-plaza")
  if (!forest || !plaza) throw new Error("TERRA 레벨 데이터가 올바르지 않습니다.")
  return <LevelEditor initialLevels={[forest, plaza]} />
}
