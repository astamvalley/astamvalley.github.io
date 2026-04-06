'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const TRACKS = ['KICK', 'SNARE', 'HI-HAT', 'PERC'] as const
type TrackName = typeof TRACKS[number]

const STEPS = 16

type Grid = Record<TrackName, boolean[]>

function makeEmptyGrid(): Grid {
  return Object.fromEntries(
    TRACKS.map((t) => [t, Array(STEPS).fill(false)])
  ) as Grid
}

// ── Sound synthesis ──────────────────────────────────────────────────────────

function playKick(ctx: AudioContext, time: number, master: GainNode) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.2)

  gain.gain.setValueAtTime(1, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)

  osc.connect(gain)
  gain.connect(master)
  osc.start(time)
  osc.stop(time + 0.35)
}

function playSnare(ctx: AudioContext, time: number, master: GainNode) {
  // White noise burst
  const bufferSize = ctx.sampleRate * 0.2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.8, time)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2)

  // Snare body oscillator
  const osc = ctx.createOscillator()
  osc.frequency.setValueAtTime(200, time)
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.1)

  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.7, time)
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

  noise.connect(noiseGain)
  noiseGain.connect(master)
  osc.connect(oscGain)
  oscGain.connect(master)

  noise.start(time)
  noise.stop(time + 0.2)
  osc.start(time)
  osc.stop(time + 0.15)
}

function playHihat(ctx: AudioContext, time: number, master: GainNode) {
  const bufferSize = ctx.sampleRate * 0.05
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  // High-pass filter
  const hpf = ctx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 7000

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.5, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

  noise.connect(hpf)
  hpf.connect(gain)
  gain.connect(master)

  noise.start(time)
  noise.stop(time + 0.06)
}

function playPerc(ctx: AudioContext, time: number, master: GainNode) {
  const freq = 200 + Math.random() * 600 // random pitch each hit
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, time)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.12)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.6, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

  osc.connect(gain)
  gain.connect(master)
  osc.start(time)
  osc.stop(time + 0.15)
}

const SOUND_FNS: Record<TrackName, (ctx: AudioContext, time: number, master: GainNode) => void> = {
  KICK: playKick,
  SNARE: playSnare,
  'HI-HAT': playHihat,
  PERC: playPerc,
}

// ── Lookahead scheduler constants ─────────────────────────────────────────────
const LOOKAHEAD_MS = 25.0   // how often scheduler runs (ms)
const SCHEDULE_AHEAD = 0.1  // how far ahead to schedule (sec)

export default function SequencerPage() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Scheduling state in refs (no re-renders)
  const currentStepRef = useRef(0)
  const nextStepTimeRef = useRef(0)
  const gridRef = useRef<Grid>(makeEmptyGrid())
  const bpmRef = useRef(120)
  const playingRef = useRef(false)

  const [grid, setGrid] = useState<Grid>(makeEmptyGrid)
  const [bpm, setBpm] = useState(120)
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)

  // Keep refs in sync with state
  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { bpmRef.current = bpm }, [bpm])

  const scheduleStep = useCallback((step: number, time: number) => {
    const ctx = audioCtxRef.current
    const master = masterGainRef.current
    if (!ctx || !master) return

    TRACKS.forEach((track) => {
      if (gridRef.current[track][step]) {
        SOUND_FNS[track](ctx, time, master)
      }
    })
  }, [])

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return

    const secondsPerBeat = 60.0 / bpmRef.current
    const secondsPerStep = secondsPerBeat / 4 // 16th notes

    while (nextStepTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleStep(currentStepRef.current, nextStepTimeRef.current)

      // Update visual step indicator with a slight delay to match audio
      const step = currentStepRef.current
      const schedTime = nextStepTimeRef.current
      const delay = Math.max(0, (schedTime - ctx.currentTime) * 1000)
      setTimeout(() => {
        if (playingRef.current) setCurrentStep(step)
      }, delay)

      nextStepTimeRef.current += secondsPerStep
      currentStepRef.current = (currentStepRef.current + 1) % STEPS
    }
  }, [scheduleStep])

  const start = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
      const master = audioCtxRef.current.createGain()
      master.gain.value = 0.8
      master.connect(audioCtxRef.current.destination)
      masterGainRef.current = master
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    currentStepRef.current = 0
    nextStepTimeRef.current = audioCtxRef.current.currentTime + 0.05
    playingRef.current = true
    setPlaying(true)
    setCurrentStep(0)

    schedulerRef.current = setInterval(scheduler, LOOKAHEAD_MS)
  }, [scheduler])

  const stop = useCallback(() => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current)
      schedulerRef.current = null
    }
    playingRef.current = false
    currentStepRef.current = 0
    setPlaying(false)
    setCurrentStep(-1)
  }, [])

  const togglePlay = useCallback(() => {
    if (playing) stop()
    else start()
  }, [playing, start, stop])

  const toggleStep = useCallback((track: TrackName, step: number) => {
    setGrid((prev) => {
      const next = { ...prev, [track]: [...prev[track]] }
      next[track][step] = !next[track][step]
      return next
    })
  }, [])

  const clearGrid = useCallback(() => {
    setGrid(makeEmptyGrid())
  }, [])

  // Preset pattern
  const loadPreset = useCallback(() => {
    setGrid({
      KICK:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
      SNARE:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
      'HI-HAT':[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0].map(Boolean),
      PERC:    [0,0,0,1, 0,0,1,0, 0,0,0,1, 0,1,0,0].map(Boolean),
    })
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current)
      audioCtxRef.current?.close()
    }
  }, [])

  const TRACK_COLORS: Record<TrackName, string> = {
    KICK: 'text-orange-300',
    SNARE: 'text-amber-400',
    'HI-HAT': 'text-yellow-400',
    PERC: 'text-orange-400',
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-2">
          Beat Sequencer
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          4트랙 × 16스텝 비트 시퀀서. Web Audio API 합성음만으로 드럼 패턴을 만든다.
        </p>
      </header>

      {/* Transport */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={togglePlay}
          className={`text-xs font-mono px-6 py-2 rounded border transition-colors ${
            playing
              ? 'bg-orange-400/15 text-orange-300 border-orange-400/30 hover:bg-orange-400/25'
              : 'text-zinc-300 border-zinc-700 hover:border-zinc-500'
          }`}
        >
          {playing ? '■ stop' : '▶ play'}
        </button>

        <div className="flex items-center gap-3 flex-1">
          <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest whitespace-nowrap">
            bpm
          </span>
          <input
            type="range" min={60} max={180} value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1 accent-orange-400"
          />
          <span className="text-sm font-mono text-orange-300 w-8 text-right">{bpm}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadPreset}
            className="text-xs font-mono px-3 py-1.5 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            preset
          </button>
          <button
            onClick={clearGrid}
            className="text-xs font-mono px-3 py-1.5 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            clear
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`text-xs font-mono ${playing ? 'text-orange-300' : 'text-zinc-600'}`}>
          {playing ? '● playing' : '○ stopped'}
        </span>
        {playing && (
          <span className="text-xs font-mono text-zinc-600">
            step {currentStep + 1}/16
          </span>
        )}
      </div>

      {/* Step numbers */}
      <div className="mb-1 ml-20 grid grid-cols-16 gap-0.5" style={{ display: 'flex', marginLeft: '5rem' }}>
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className={`w-7 text-center text-[9px] font-mono ${
              currentStep === i ? 'text-orange-300' : 'text-zinc-700'
            }`}
            style={{ width: 28, flexShrink: 0 }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1 mb-8">
        {TRACKS.map((track) => (
          <div key={track} className="flex items-center gap-2">
            {/* Track label */}
            <div className="w-16 shrink-0 text-right">
              <span className={`text-[10px] font-mono ${TRACK_COLORS[track]}`}>
                {track}
              </span>
            </div>

            {/* Steps */}
            <div className="flex gap-0.5">
              {Array.from({ length: STEPS }, (_, step) => {
                const on = grid[track][step]
                const isCurrentBeat = currentStep === step
                const isBeat = step % 4 === 0

                return (
                  <button
                    key={step}
                    onClick={() => toggleStep(track, step)}
                    className={`rounded transition-all ${
                      on
                        ? isCurrentBeat && playing
                          ? 'bg-orange-200 shadow-[0_0_8px_rgba(252,211,77,0.8)]'
                          : 'bg-orange-300'
                        : isCurrentBeat && playing
                        ? 'bg-zinc-600 ring-1 ring-orange-400/50'
                        : isBeat
                        ? 'bg-zinc-700/80 hover:bg-zinc-600'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                    style={{ width: 28, height: 28, flexShrink: 0 }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Beat group dividers */}
      <div className="flex mb-8 ml-[4.5rem]">
        {Array.from({ length: 4 }, (_, g) => (
          <div key={g} className="flex gap-0.5 mr-2">
            {Array.from({ length: 4 }, (_, s) => (
              <div key={s} className="w-7" style={{ width: 29 }} />
            ))}
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
            이 실험에 대해
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            정확한 타이밍을 위해 <code className="text-zinc-400">AudioContext.currentTime</code>을 기준으로
            미리 스케줄링하는 lookahead 패턴을 사용한다. <code className="text-zinc-400">setInterval</code>로
            25ms마다 스케줄러를 깨워 100ms 앞의 스텝을 미리 예약한다.{' '}
            각 드럼 소리는 오디오 파일 없이 순수 합성으로 만든다: KICK은 주파수 스윕, SNARE는
            화이트 노이즈 + 오실레이터, HI-HAT은 고역통과 필터 화이트 노이즈, PERC는 랜덤 피치 사인파.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
            핵심 코드
          </p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// Lookahead 스케줄링 패턴
const LOOKAHEAD_MS = 25     // 스케줄러 실행 주기
const SCHEDULE_AHEAD = 0.1  // 미리 예약할 시간(초)

function scheduler() {
  const spStep = (60 / bpm) / 4  // 16분음표 간격
  while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(currentStep, nextStepTime)
    nextStepTime += spStep
    currentStep = (currentStep + 1) % 16
  }
}
setInterval(scheduler, LOOKAHEAD_MS)

// KICK: 주파수 스윕으로 펀치감 생성
function playKick(ctx, time, master) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.2)
  gain.gain.setValueAtTime(1, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
  osc.connect(gain); gain.connect(master)
  osc.start(time); osc.stop(time + 0.35)
}`}</pre>
        </div>
      </div>
    </div>
  )
}
