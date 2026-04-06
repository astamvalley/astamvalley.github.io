'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle'

// 2 octaves: C3 to B4
const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81, 'C#3': 138.59, D3: 146.83, 'D#3': 155.56,
  E3: 164.81, F3: 174.61, 'F#3': 185.0, G3: 196.0,
  'G#3': 207.65, A3: 220.0, 'A#3': 233.08, B3: 246.94,
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13,
  E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.0,
  'G#4': 415.3, A4: 440.0, 'A#4': 466.16, B4: 493.88,
}

// White keys in order
const WHITE_KEYS = [
  'C3','D3','E3','F3','G3','A3','B3',
  'C4','D4','E4','F4','G4','A4','B4',
]

// Black keys: note name → position (index between white keys, 0-based)
const BLACK_KEYS: { note: string; position: number }[] = [
  { note: 'C#3', position: 0 },
  { note: 'D#3', position: 1 },
  { note: 'F#3', position: 3 },
  { note: 'G#3', position: 4 },
  { note: 'A#3', position: 5 },
  { note: 'C#4', position: 7 },
  { note: 'D#4', position: 8 },
  { note: 'F#4', position: 10 },
  { note: 'G#4', position: 11 },
  { note: 'A#4', position: 12 },
]

// Keyboard mapping: key → note
const KEY_MAP: Record<string, string> = {
  a: 'C3', w: 'C#3', s: 'D3', e: 'D#3', d: 'E3',
  f: 'F3', t: 'F#3', g: 'G3', y: 'G#3', h: 'A3',
  u: 'A#3', j: 'B3', k: 'C4', o: 'C#4', l: 'D4',
  p: 'D#4', ';': 'E4',
}

interface ActiveNote {
  osc: OscillatorNode
  gain: GainNode
  delayIn?: GainNode
}

const WAVEFORMS: { type: WaveType; label: string }[] = [
  { type: 'sine', label: 'sine' },
  { type: 'square', label: 'square' },
  { type: 'sawtooth', label: 'sawtooth' },
  { type: 'triangle', label: 'triangle' },
]

export default function SynthPage() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const delayNodeRef = useRef<DelayNode | null>(null)
  const delayFeedbackRef = useRef<GainNode | null>(null)
  const activeNotesRef = useRef<Map<string, ActiveNote>>(new Map())

  const [waveType, setWaveType] = useState<WaveType>('sine')
  const [attack, setAttack] = useState(20)
  const [release, setRelease] = useState(300)
  const [masterVolume, setMasterVolume] = useState(70)
  const [delayOn, setDelayOn] = useState(false)
  const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set())

  // Refs for up-to-date values in callbacks
  const waveTypeRef = useRef(waveType)
  const attackRef = useRef(attack)
  const releaseRef = useRef(release)
  const delayOnRef = useRef(delayOn)
  useEffect(() => { waveTypeRef.current = waveType }, [waveType])
  useEffect(() => { attackRef.current = attack }, [attack])
  useEffect(() => { releaseRef.current = release }, [release])
  useEffect(() => { delayOnRef.current = delayOn }, [delayOn])

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        masterVolume / 100,
        audioCtxRef.current.currentTime,
        0.02
      )
    }
  }, [masterVolume])

  useEffect(() => {
    if (delayFeedbackRef.current && audioCtxRef.current) {
      delayFeedbackRef.current.gain.setTargetAtTime(
        delayOn ? 0.35 : 0,
        audioCtxRef.current.currentTime,
        0.05
      )
    }
  }, [delayOn])

  const ensureContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      const master = ctx.createGain()
      master.gain.value = masterVolume / 100
      masterGainRef.current = master

      // Delay chain: delay → feedback → delay (loop)
      const delay = ctx.createDelay(1.0)
      delay.delayTime.value = 0.3
      delayNodeRef.current = delay

      const feedback = ctx.createGain()
      feedback.gain.value = 0 // starts off
      delayFeedbackRef.current = feedback

      delay.connect(feedback)
      feedback.connect(delay)
      delay.connect(master)

      master.connect(ctx.destination)
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [masterVolume])

  const noteOn = useCallback(async (note: string) => {
    if (activeNotesRef.current.has(note)) return
    const ctx = await ensureContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = waveTypeRef.current
    osc.frequency.value = NOTE_FREQUENCIES[note]

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.4, now + attackRef.current / 1000)

    osc.connect(gain)
    gain.connect(masterGainRef.current!)

    // Also feed into delay
    if (delayOnRef.current && delayNodeRef.current) {
      const delayIn = ctx.createGain()
      delayIn.gain.value = 0.4
      gain.connect(delayIn)
      delayIn.connect(delayNodeRef.current)
      activeNotesRef.current.set(note, { osc, gain, delayIn })
    } else {
      activeNotesRef.current.set(note, { osc, gain })
    }

    osc.start()
    setPressedNotes((prev) => new Set([...prev, note]))
  }, [ensureContext])

  const noteOff = useCallback((note: string) => {
    const active = activeNotesRef.current.get(note)
    if (!active || !audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const now = ctx.currentTime
    const relMs = releaseRef.current / 1000

    active.gain.gain.cancelScheduledValues(now)
    active.gain.gain.setValueAtTime(active.gain.gain.value, now)
    active.gain.gain.exponentialRampToValueAtTime(0.0001, now + relMs)

    active.osc.stop(now + relMs + 0.05)
    activeNotesRef.current.delete(note)

    setPressedNotes((prev) => {
      const next = new Set(prev)
      next.delete(note)
      return next
    })
  }, [])

  // Keyboard events
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      const note = KEY_MAP[e.key.toLowerCase()]
      if (note) noteOn(note)
    }
    const up = (e: KeyboardEvent) => {
      const note = KEY_MAP[e.key.toLowerCase()]
      if (note) noteOff(note)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [noteOn, noteOff])

  // Cleanup
  useEffect(() => {
    return () => {
      activeNotesRef.current.forEach(({ osc }) => {
        try { osc.stop() } catch {}
      })
      audioCtxRef.current?.close()
    }
  }, [])

  const WHITE_KEY_W = 44
  const WHITE_KEY_H = 140
  const BLACK_KEY_W = 28
  const BLACK_KEY_H = 88
  const totalWidth = WHITE_KEYS.length * WHITE_KEY_W

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-2">
          Polyphonic Synthesizer
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          마우스 클릭 또는 키보드로 연주하는 2옥타브 폴리포닉 신시사이저.
        </p>
      </header>

      {/* Keyboard */}
      <div className="mb-8">
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
          keyboard — C3 to B4
        </p>
        <div
          className="relative overflow-x-auto pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className="relative select-none"
            style={{ width: totalWidth, height: WHITE_KEY_H + 4 }}
          >
            {/* White keys */}
            {WHITE_KEYS.map((note, i) => {
              const active = pressedNotes.has(note)
              return (
                <div
                  key={note}
                  onMouseDown={() => noteOn(note)}
                  onMouseUp={() => noteOff(note)}
                  onMouseLeave={() => { if (pressedNotes.has(note)) noteOff(note) }}
                  onTouchStart={(e) => { e.preventDefault(); noteOn(note) }}
                  onTouchEnd={(e) => { e.preventDefault(); noteOff(note) }}
                  className={`absolute border border-zinc-600 rounded-b cursor-pointer transition-colors ${
                    active
                      ? 'bg-orange-300/80'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  style={{
                    left: i * WHITE_KEY_W,
                    top: 0,
                    width: WHITE_KEY_W - 2,
                    height: WHITE_KEY_H,
                    zIndex: 1,
                  }}
                >
                  <span
                    className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-mono text-zinc-600 select-none"
                  >
                    {note.replace(/[#\d]/g, '')}
                    {note.includes('3') ? '3' : '4'}
                  </span>
                </div>
              )
            })}

            {/* Black keys */}
            {BLACK_KEYS.map(({ note, position }) => {
              const active = pressedNotes.has(note)
              return (
                <div
                  key={note}
                  onMouseDown={(e) => { e.stopPropagation(); noteOn(note) }}
                  onMouseUp={(e) => { e.stopPropagation(); noteOff(note) }}
                  onMouseLeave={() => { if (pressedNotes.has(note)) noteOff(note) }}
                  onTouchStart={(e) => { e.preventDefault(); noteOn(note) }}
                  onTouchEnd={(e) => { e.preventDefault(); noteOff(note) }}
                  className={`absolute rounded-b cursor-pointer transition-colors ${
                    active
                      ? 'bg-orange-400'
                      : 'bg-zinc-950 hover:bg-zinc-800 border border-zinc-700'
                  }`}
                  style={{
                    left: position * WHITE_KEY_W + WHITE_KEY_W - BLACK_KEY_W / 2,
                    top: 0,
                    width: BLACK_KEY_W,
                    height: BLACK_KEY_H,
                    zIndex: 2,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mb-8 p-3 bg-zinc-900/60 border border-zinc-800 rounded">
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-2">keyboard shortcuts</p>
        <p className="text-xs font-mono text-zinc-500">
          white: <span className="text-zinc-400">a s d f g h j k l ;</span>
          &nbsp;&nbsp;black: <span className="text-zinc-400">w e t y u o p</span>
        </p>
      </div>

      {/* Active notes */}
      <div className="mb-8 min-h-[2rem]">
        {pressedNotes.size > 0 && (
          <div className="flex flex-wrap gap-1">
            {[...pressedNotes].map((note) => (
              <span
                key={note}
                className="text-xs font-mono px-2 py-0.5 rounded bg-orange-400/15 text-orange-300 border border-orange-400/30"
              >
                {note}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-6 mb-10">
        {/* Waveform */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
            waveform
          </p>
          <div className="flex gap-2 flex-wrap">
            {WAVEFORMS.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setWaveType(type)}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${
                  waveType === type
                    ? 'bg-orange-400/15 text-orange-300 border-orange-400/30'
                    : 'text-zinc-500 hover:text-zinc-300 border-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Attack */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
            attack — <span className="text-orange-300">{attack} ms</span>
          </p>
          <input
            type="range" min={0} max={500} value={attack}
            onChange={(e) => setAttack(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-zinc-700">0 ms</span>
            <span className="text-[10px] font-mono text-zinc-700">500 ms</span>
          </div>
        </div>

        {/* Release */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
            release — <span className="text-orange-300">{release} ms</span>
          </p>
          <input
            type="range" min={50} max={2000} value={release}
            onChange={(e) => setRelease(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-zinc-700">50 ms</span>
            <span className="text-[10px] font-mono text-zinc-700">2000 ms</span>
          </div>
        </div>

        {/* Master Volume */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
            master volume — <span className="text-orange-300">{masterVolume}%</span>
          </p>
          <input
            type="range" min={0} max={100} value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
        </div>

        {/* Delay */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
            delay effect
          </p>
          <button
            onClick={() => setDelayOn((v) => !v)}
            className={`text-xs font-mono px-4 py-1.5 rounded border transition-colors ${
              delayOn
                ? 'bg-orange-400/15 text-orange-300 border-orange-400/30'
                : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {delayOn ? '● delay on (300ms, 35% feedback)' : '○ delay off'}
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
            이 실험에 대해
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            각 음표마다 독립적인 <code className="text-zinc-400">OscillatorNode</code>를 생성해
            동시에 여러 음을 낼 수 있다(폴리포닉). 어택은 소리가 최대 볼륨에 도달하는 시간,
            릴리즈는 키를 떼고 소리가 사라지는 시간이다. 딜레이는{' '}
            <code className="text-zinc-400">DelayNode</code>에 피드백 루프를 연결해 에코 효과를 만든다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
            핵심 코드
          </p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 폴리포닉: 음표마다 독립적인 osc + gain
function noteOn(freq: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = waveType
  osc.frequency.value = freq

  // 어택 엔벨로프
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.4, now + attack / 1000)

  osc.connect(gain)
  gain.connect(master)
  osc.start()
}

// 릴리즈 엔벨로프
function noteOff(note: string) {
  const now = ctx.currentTime
  gain.gain.exponentialRampToValueAtTime(
    0.0001, now + release / 1000
  )
  osc.stop(now + release / 1000 + 0.05)
}

// 딜레이 피드백 루프
delay.connect(feedback)   // delay → feedback
feedback.connect(delay)   // feedback → delay (루프)
delay.connect(master)     // 딜레이 출력 → 마스터`}</pre>
        </div>
      </div>
    </div>
  )
}
