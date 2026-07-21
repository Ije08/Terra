"use client"

import { useEffect, useRef } from "react"

export type TerraMusicTrack = "start" | "route" | "social" | "terra"

interface TerraAudioManagerProps {
  readonly track: TerraMusicTrack
  readonly enabled: boolean
}

const TRACK_SOURCES: Readonly<Record<TerraMusicTrack, string>> = {
  start: "/assets/audio/terra-start-bgm.mp3",
  route: "/assets/audio/terra-route-bgm.mp3",
  social: "/assets/audio/terra-social-hub-bgm.mp3",
  terra: "/assets/audio/terra-planet-bgm.mp3",
}

const TRACK_VOLUMES: Readonly<Record<TerraMusicTrack, number>> = {
  start: 0.28,
  route: 0.28,
  social: 0.3,
  terra: 0.3,
}

const FADE_DURATION_MS = 420

export function TerraAudioManager({ track, enabled }: TerraAudioManagerProps) {
  const audioMapRef = useRef(new Map<TerraMusicTrack, HTMLAudioElement>())
  const activeTrackRef = useRef<TerraMusicTrack | null>(null)
  const fadeFramesRef = useRef(new Map<TerraMusicTrack, number>())
  const trackRef = useRef(track)
  const enabledRef = useRef(enabled)

  const getAudio = (nextTrack: TerraMusicTrack) => {
    const existing = audioMapRef.current.get(nextTrack)
    if (existing) return existing

    const audio = new Audio(TRACK_SOURCES[nextTrack])
    audio.loop = true
    audio.preload = "auto"
    audio.volume = 0
    audioMapRef.current.set(nextTrack, audio)
    return audio
  }

  const fadeTo = (nextTrack: TerraMusicTrack, target: number, duration = FADE_DURATION_MS) => {
    const audio = getAudio(nextTrack)
    const previousFrame = fadeFramesRef.current.get(nextTrack)
    if (previousFrame !== undefined) window.cancelAnimationFrame(previousFrame)

    const from = audio.volume
    const startedAt = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      audio.volume = from + (target - from) * progress
      if (progress < 1) {
        fadeFramesRef.current.set(nextTrack, window.requestAnimationFrame(step))
      } else {
        fadeFramesRef.current.delete(nextTrack)
        if (target === 0) {
          audio.pause()
          audio.currentTime = 0
        }
      }
    }

    fadeFramesRef.current.set(nextTrack, window.requestAnimationFrame(step))
  }

  const playActiveTrack = () => {
    if (!enabledRef.current) return
    const activeTrack = activeTrackRef.current ?? trackRef.current
    const audio = getAudio(activeTrack)
    audio.volume = TRACK_VOLUMES[activeTrack]
    void audio.play().catch(() => undefined)
  }

  useEffect(() => {
    trackRef.current = track
    enabledRef.current = enabled
    const nextAudio = getAudio(track)
    const previousTrack = activeTrackRef.current

    if (!enabled) {
      for (const [key] of audioMapRef.current) fadeTo(key, 0, 180)
      activeTrackRef.current = track
      return
    }

    activeTrackRef.current = track
    if (previousTrack && previousTrack !== track) fadeTo(previousTrack, 0)
    nextAudio.volume = previousTrack === track ? TRACK_VOLUMES[track] : 0
    void nextAudio.play().then(() => {
      if (previousTrack !== track) fadeTo(track, TRACK_VOLUMES[track])
    }).catch(() => undefined)
  }, [enabled, track])

  useEffect(() => {
    const resumeAudio = () => playActiveTrack()
    window.addEventListener("pointerdown", resumeAudio, { passive: true })
    window.addEventListener("keydown", resumeAudio)

    return () => {
      window.removeEventListener("pointerdown", resumeAudio)
      window.removeEventListener("keydown", resumeAudio)
      for (const frame of fadeFramesRef.current.values()) window.cancelAnimationFrame(frame)
      for (const audio of audioMapRef.current.values()) {
        audio.pause()
        audio.src = ""
      }
      fadeFramesRef.current.clear()
      audioMapRef.current.clear()
    }
  }, [])

  return null
}
