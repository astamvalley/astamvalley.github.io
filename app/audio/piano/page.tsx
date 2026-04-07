'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

// Salamander Grand Piano samples (Tone.js CDN)
// Samples every 3 semitones — we pick the closest and pitch-shift
const SAMPLE_URLS: Record<string, string> = {
  C3:  'https://tonejs.github.io/audio/salamander/C3.mp3',
  Ds3: 'https://tonejs.github.io/audio/salamander/Ds3.mp3',
  Fs3: 'https://tonejs.github.io/audio/salamander/Fs3.mp3',
  A3:  'https://tonejs.github.io/audio/salamander/A3.mp3',
  C4:  'https://tonejs.github.io/audio/salamander/C4.mp3',
  Ds4: 'https://tonejs.github.io/audio/salamander/Ds4.mp3',
  Fs4: 'https://tonejs.github.io/audio/salamander/Fs4.mp3',
}

const SAMPLE_MIDI: Record<string, number> = {
  C3: 48, Ds3: 51, Fs3: 54, A3: 57, C4: 60, Ds4: 63, Fs4: 66,
}

const NOTE_MIDI: Record<string, number> = {
  C3: 48, 'C#3': 49, D3: 50, 'D#3': 51,
  E3: 52, F3: 53, 'F#3': 54, G3: 55,
  'G#3': 56, A3: 57, 'A#3': 58, B3: 59,
  C4: 60, 'C#4': 61, D4: 62, 'D#4': 63, E4: 64,
}

type Step = { note: string | null; dur: number }

const MELODIES: Record<string, { bpm: number; steps: Step[] }> = {
  'Für Elise': {
    bpm: 96,
    steps: [
      {note:'E4',dur:0.5},{note:'D#4',dur:0.5},{note:'E4',dur:0.5},{note:'D#4',dur:0.5},
      {note:'E4',dur:0.5},{note:'B3',dur:0.5},{note:'D4',dur:0.5},{note:'C4',dur:0.5},
      {note:'A3',dur:1},{note:null,dur:0.5},{note:'C3',dur:0.5},{note:'E3',dur:0.5},{note:'A3',dur:0.5},
      {note:'B3',dur:1},{note:null,dur:0.5},{note:'E3',dur:0.5},{note:'G#3',dur:0.5},{note:'B3',dur:0.5},
      {note:'C4',dur:1},{note:null,dur:0.5},{note:'E3',dur:0.5},{note:'E4',dur:0.5},{note:'D#4',dur:0.5},
      {note:'E4',dur:0.5},{note:'D#4',dur:0.5},{note:'E4',dur:0.5},{note:'B3',dur:0.5},{note:'D4',dur:0.5},{note:'C4',dur:0.5},
      {note:'A3',dur:1.5},
    ],
  },
  'Twinkle': {
    bpm: 110,
    steps: [
      {note:'C3',dur:1},{note:'C3',dur:1},{note:'G3',dur:1},{note:'G3',dur:1},
      {note:'A3',dur:1},{note:'A3',dur:1},{note:'G3',dur:2},
      {note:'F3',dur:1},{note:'F3',dur:1},{note:'E3',dur:1},{note:'E3',dur:1},
      {note:'D3',dur:1},{note:'D3',dur:1},{note:'C3',dur:2},
      {note:'G3',dur:1},{note:'G3',dur:1},{note:'F3',dur:1},{note:'F3',dur:1},
      {note:'E3',dur:1},{note:'E3',dur:1},{note:'D3',dur:2},
    ],
  },
  'Ode to Joy': {
    bpm: 108,
    steps: [
      {note:'E3',dur:1},{note:'E3',dur:1},{note:'F3',dur:1},{note:'G3',dur:1},
      {note:'G3',dur:1},{note:'F3',dur:1},{note:'E3',dur:1},{note:'D3',dur:1},
      {note:'C3',dur:1},{note:'C3',dur:1},{note:'D3',dur:1},{note:'E3',dur:1},
      {note:'E3',dur:1.5},{note:'D3',dur:0.5},{note:'D3',dur:2},
      {note:'E3',dur:1},{note:'E3',dur:1},{note:'F3',dur:1},{note:'G3',dur:1},
      {note:'G3',dur:1},{note:'F3',dur:1},{note:'E3',dur:1},{note:'D3',dur:1},
      {note:'C3',dur:1},{note:'C3',dur:1},{note:'D3',dur:1},{note:'E3',dur:1},
      {note:'D3',dur:1.5},{note:'C3',dur:0.5},{note:'C3',dur:2},
    ],
  },
}

const WHITE_KEYS = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4']
const BLACK_KEYS: { note: string; position: number }[] = [
  { note: 'C#3', position: 0 },
  { note: 'D#3', position: 1 },
  { note: 'F#3', position: 3 },
  { note: 'G#3', position: 4 },
  { note: 'A#3', position: 5 },
  { note: 'C#4', position: 7 },
  { note: 'D#4', position: 8 },
]

const NOTE_KEY_LABEL: Record<string, string> = {
  C3:'a', D3:'s', E3:'d', F3:'f', G3:'g', A3:'h', B3:'j',
  C4:'k', D4:'l', E4:';',
  'C#3':'w', 'D#3':'e', 'F#3':'t', 'G#3':'y', 'A#3':'u',
  'C#4':'o', 'D#4':'p',
}

const KEY_MAP: Record<string, string> = {
  a:'C3', w:'C#3', s:'D3', e:'D#3', d:'E3',
  f:'F3', t:'F#3', g:'G3', y:'G#3', h:'A3',
  u:'A#3', j:'B3', k:'C4', o:'C#4', l:'D4',
  p:'D#4', ';':'E4',
}

function getSampleAndRate(note: string): { sampleKey: string; playbackRate: number } {
  const targetMidi = NOTE_MIDI[note]
  let closest = 'C3'
  let minDiff = Infinity
  for (const [key, midi] of Object.entries(SAMPLE_MIDI)) {
    const diff = Math.abs(targetMidi - midi)
    if (diff < minDiff) { minDiff = diff; closest = key }
  }
  return {
    sampleKey: closest,
    playbackRate: Math.pow(2, (targetMidi - SAMPLE_MIDI[closest]) / 12),
  }
}

// Generate synthetic reverb impulse response
function makeReverb(ctx: AudioContext, duration = 2.5, decay = 3): AudioBuffer {
  const rate = ctx.sampleRate
  const length = Math.floor(rate * duration)
  const buf = ctx.createBuffer(2, length, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return buf
}

const WHITE_KEY_W = 48
const WHITE_KEY_H = 150
const BLACK_KEY_W = 30
const BLACK_KEY_H = 96

export default function PianoPage() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const samplesRef = useRef<Map<string, AudioBuffer>>(new Map())
  const reverbRef = useRef<ConvolverNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const reverbGainRef = useRef<GainNode | null>(null)
  const dryGainRef = useRef<GainNode | null>(null)
  const activeSourcesRef = useRef<Map<string, { source: AudioBufferSourceNode; gain: GainNode }>>( new Map())
  const sustainedRef = useRef<Set<string>>(new Set()) // notes held by sustain

  const [playingMelody, setPlayingMelody] = useState<string | null>(null)
  const melodyTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set())
  const [sustain, setSustain] = useState(false)
  const [reverbOn, setReverbOn] = useState(true)
  const [volume, setVolume] = useState(80)
  const sustainRef = useRef(false)
  const reverbOnRef = useRef(true)
  const volumeRef = useRef(80)

  useEffect(() => { sustainRef.current = sustain }, [sustain])
  useEffect(() => { reverbOnRef.current = reverbOn }, [reverbOn])
  useEffect(() => {
    volumeRef.current = volume
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume / 100, audioCtxRef.current.currentTime, 0.02)
    }
  }, [volume])

  const initAudio = useCallback(async () => {
    if (loadState !== 'idle') return
    setLoadState('loading')

    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      const master = ctx.createGain()
      master.gain.value = volumeRef.current / 100
      masterGainRef.current = master

      const dry = ctx.createGain()
      dry.gain.value = 1
      dryGainRef.current = dry

      const reverbGain = ctx.createGain()
      reverbGain.gain.value = 0.35
      reverbGainRef.current = reverbGain

      const convolver = ctx.createConvolver()
      convolver.buffer = makeReverb(ctx)
      reverbRef.current = convolver

      dry.connect(master)
      reverbGain.connect(convolver)
      convolver.connect(master)
      master.connect(ctx.destination)

      const keys = Object.keys(SAMPLE_URLS)
      let loaded = 0
      await Promise.all(keys.map(async (key) => {
        const res = await fetch(SAMPLE_URLS[key])
        const arrayBuf = await res.arrayBuffer()
        const audioBuf = await ctx.decodeAudioData(arrayBuf)
        samplesRef.current.set(key, audioBuf)
        loaded++
        setLoadProgress(Math.round((loaded / keys.length) * 100))
      }))

      setLoadState('ready')
    } catch (e) {
      setLoadState('error')
    }
  }, [loadState])

  const noteOn = useCallback((note: string) => {
    const ctx = audioCtxRef.current
    if (!ctx || loadState !== 'ready') return
    if (activeSourcesRef.current.has(note)) return

    const { sampleKey, playbackRate } = getSampleAndRate(note)
    const buffer = samplesRef.current.get(sampleKey)
    if (!buffer) return

    const now = ctx.currentTime

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.85, now + 0.008) // fast attack

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = playbackRate
    source.connect(gain)

    // Route to dry + reverb
    if (reverbOnRef.current && reverbGainRef.current) {
      gain.connect(dryGainRef.current!)
      gain.connect(reverbGainRef.current)
    } else {
      gain.connect(dryGainRef.current!)
    }

    source.start()
    activeSourcesRef.current.set(note, { source, gain })
    setPressedNotes((prev) => new Set([...prev, note]))
  }, [loadState])

  const noteOff = useCallback((note: string) => {
    if (sustainRef.current) {
      sustainedRef.current.add(note)
      return
    }
    _releaseNote(note)
  }, [])

  const _releaseNote = (note: string) => {
    const ctx = audioCtxRef.current
    const active = activeSourcesRef.current.get(note)
    if (!active || !ctx) return

    const now = ctx.currentTime
    active.gain.gain.cancelScheduledValues(now)
    active.gain.gain.setValueAtTime(active.gain.gain.value, now)
    active.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
    active.source.stop(now + 0.55)
    activeSourcesRef.current.delete(note)
    setPressedNotes((prev) => { const n = new Set(prev); n.delete(note); return n })
  }

  const releaseSustain = useCallback(() => {
    sustainedRef.current.forEach((note) => _releaseNote(note))
    sustainedRef.current.clear()
  }, [])

  const stopMelody = useCallback(() => {
    melodyTimersRef.current.forEach(clearTimeout)
    melodyTimersRef.current = []
    setPlayingMelody(null)
  }, [])

  const playMelody = useCallback((name: string) => {
    if (playingMelody) { stopMelody(); return }
    if (loadState !== 'ready') return
    const melody = MELODIES[name]
    if (!melody) return
    setPlayingMelody(name)

    const beatMs = (60 / melody.bpm) * 1000
    let t = 0
    melody.steps.forEach(({ note, dur }) => {
      const durMs = dur * beatMs
      if (note) {
        const onTimer = setTimeout(() => noteOn(note), t)
        const offTimer = setTimeout(() => noteOff(note), t + durMs * 0.85)
        melodyTimersRef.current.push(onTimer, offTimer)
      }
      t += durMs
    })
    const endTimer = setTimeout(() => setPlayingMelody(null), t)
    melodyTimersRef.current.push(endTimer)
  }, [playingMelody, stopMelody, noteOn, noteOff, loadState])

  // Keyboard events
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === ' ') { e.preventDefault(); setSustain(true); sustainRef.current = true; return }
      const note = KEY_MAP[e.key.toLowerCase()]
      if (note) noteOn(note)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setSustain(false)
        sustainRef.current = false
        releaseSustain()
        return
      }
      const note = KEY_MAP[e.key.toLowerCase()]
      if (note) noteOff(note)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [noteOn, noteOff, releaseSustain])

  useEffect(() => {
    return () => { audioCtxRef.current?.close() }
  }, [])

  const totalWidth = WHITE_KEYS.length * WHITE_KEY_W

  return (
    <div className="max-w-2xl">

      <header className="mb-8">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-2">Grand Piano</h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Salamander Grand Piano 샘플 기반. 실제 피아노 녹음을 피치 시프팅해 각 음을 재생한다.
        </p>
      </header>

      {/* Load gate */}
      {loadState === 'idle' && (
        <div className="mb-8 p-6 border border-zinc-800 rounded bg-zinc-900/40 text-center">
          <p className="text-sm font-mono text-zinc-500 mb-4">
            피아노 샘플을 로드합니다 (~2MB)
          </p>
          <button
            onClick={initAudio}
            className="text-xs font-mono px-5 py-2 rounded border border-orange-400/40 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 transition-colors"
          >
            Load Piano
          </button>
        </div>
      )}

      {loadState === 'loading' && (
        <div className="mb-8 p-6 border border-zinc-800 rounded bg-zinc-900/40">
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">로딩 중</p>
          <div className="w-full h-0.5 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-orange-400 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="text-xs font-mono text-zinc-600 mt-2">{loadProgress}%</p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="mb-8 p-4 border border-red-900 rounded bg-red-950/30">
          <p className="text-xs font-mono text-red-400">샘플 로드 실패. 네트워크를 확인해주세요.</p>
        </div>
      )}

      {/* Keyboard */}
      <div className={`mb-8 transition-opacity duration-300 ${loadState === 'ready' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
          keyboard — C3 to E4
        </p>
        <div className="overflow-x-auto pb-2">
          <div className="relative select-none" style={{ width: totalWidth, height: WHITE_KEY_H + 4 }}>
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
                    active ? 'bg-orange-300/70' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  style={{ left: i * WHITE_KEY_W, top: 0, width: WHITE_KEY_W - 2, height: WHITE_KEY_H, zIndex: 1 }}
                >
                  <span className="absolute bottom-7 left-0 right-0 text-center text-[9px] font-mono text-zinc-500 select-none">
                    {note.replace(/\d/g, '')}{note.slice(-1)}
                  </span>
                  <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-mono text-zinc-700 select-none">
                    {NOTE_KEY_LABEL[note]}
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
                  className={`absolute rounded-b cursor-pointer transition-colors flex flex-col items-center justify-end pb-1.5 ${
                    active ? 'bg-orange-400' : 'bg-zinc-950 hover:bg-zinc-800 border border-zinc-700'
                  }`}
                  style={{ left: position * WHITE_KEY_W + WHITE_KEY_W - BLACK_KEY_W / 2, top: 0, width: BLACK_KEY_W, height: BLACK_KEY_H, zIndex: 2 }}
                >
                  <span className="text-[8px] font-mono text-zinc-600 select-none">{NOTE_KEY_LABEL[note]}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-5 mb-10">
        {/* Sustain */}
        <div className="flex items-center gap-4">
          <button
            onMouseDown={() => { setSustain(true); sustainRef.current = true }}
            onMouseUp={() => { setSustain(false); sustainRef.current = false; releaseSustain() }}
            onTouchStart={(e) => { e.preventDefault(); setSustain(true); sustainRef.current = true }}
            onTouchEnd={(e) => { e.preventDefault(); setSustain(false); sustainRef.current = false; releaseSustain() }}
            className={`text-xs font-mono px-4 py-2 rounded border transition-colors select-none ${
              sustain
                ? 'bg-orange-400/15 text-orange-300 border-orange-400/30'
                : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {sustain ? '● sustain' : '○ sustain'}
          </button>
          <span className="text-[11px] font-mono text-zinc-700">또는 스페이스바</span>
        </div>

        {/* Reverb */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setReverbOn((v) => !v)}
            className={`text-xs font-mono px-4 py-2 rounded border transition-colors ${
              reverbOn
                ? 'bg-orange-400/15 text-orange-300 border-orange-400/30'
                : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {reverbOn ? '● reverb on' : '○ reverb off'}
          </button>
        </div>

        {/* Volume */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
            volume — <span className="text-orange-300">{volume}%</span>
          </p>
          <input
            type="range" min={0} max={100} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
        </div>
      </div>

      {/* Melody presets */}
      <div className={`mb-8 transition-opacity duration-300 ${loadState === 'ready' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">예제 악보</p>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(MELODIES).map((name) => (
            <button
              key={name}
              onClick={() => playMelody(name)}
              className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${
                playingMelody === name
                  ? 'bg-orange-400/15 text-orange-300 border-orange-400/30'
                  : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {playingMelody === name ? '■ ' : '▶ '}{name}
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="mb-8 p-3 bg-zinc-900/60 border border-zinc-800 rounded">
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-2">keyboard shortcuts</p>
        <p className="text-xs font-mono text-zinc-500">
          white: <span className="text-zinc-400">a s d f g h j k l ;</span>
          &nbsp;&nbsp;black: <span className="text-zinc-400">w e t y u o p</span>
          &nbsp;&nbsp;sustain: <span className="text-zinc-400">space</span>
        </p>
      </div>

      {/* Explanation */}
      <div className="border-t border-zinc-800 pt-8 space-y-6">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            Salamander Grand Piano의 실제 녹음 샘플을 <code className="text-zinc-400">AudioBuffer</code>로 로드한다.
            샘플은 3반음 간격으로 존재하고, 중간 음은 가장 가까운 샘플을{' '}
            <code className="text-zinc-400">AudioBufferSourceNode.playbackRate</code>로 조정해 재생한다.
            reverb는 합성 임펄스 응답을 <code className="text-zinc-400">ConvolverNode</code>에 적용해 공간감을 만든다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 샘플 피치 시프팅
const semitones = targetMidi - sampleMidi
const playbackRate = Math.pow(2, semitones / 12)

source.buffer = sampledBuffer   // 실제 피아노 녹음
source.playbackRate.value = playbackRate  // 음정 조정
source.start()

// 합성 reverb 임펄스 응답
for (let i = 0; i < length; i++) {
  data[i] = (Math.random() * 2 - 1)
           * Math.pow(1 - i / length, decay)
}
convolver.buffer = impulseBuffer`}</pre>
        </div>
      </div>
    </div>
  )
}
