"use client"

export default function LevelEditorError({ reset }: { readonly reset: () => void }) {
  return <main style={{ alignItems: "center", background: "#07100f", color: "#e9efeb", display: "flex", flexDirection: "column", gap: 16, height: 900, justifyContent: "center", width: 1600 }}><h1>레벨 제작기를 열지 못했습니다.</h1><button type="button" onClick={reset} style={{ background: "#82ddd2", border: 0, minHeight: 44, padding: "0 20px" }}>다시 시도</button></main>
}
