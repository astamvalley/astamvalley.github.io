'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle'

const WAVEFORMS: { type: WaveType; label: string }[] = [
  { type: 'sine', label: 'sine' },
  { type: 'square', label: 'square' },
  { type: 'sawtooth', label: 'sawtooth' },
  { type: 'triangle', label: 'triangle' },
]

function freqToLog(value: number, min: number, max: number): number {
  // map slider 0-1000 → 20-2000 Hz logarithmically
  return Math.round(min * Math.pow(max / min, value / 1000))
}

function logToSlider(freq: number, min: number, max: number): number {
  return Math.round((Math.log(freq / min) / Math.log(max / min)) * 1000)
}

export default function OscilloscopePage() {
  const waveCanvasRef = useRef<HTMLCanvasElement>(null)
  const fftCanvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  // Audio nodes
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const [playing, setPlaying] = useState(false)
  const [waveType, setWaveType] = useState<WaveType>('sine')
  const [freqSlider, setFreqSlider] = useState(() => logToSlider(440, 20, 2000))
  const [volume, setVolume] = useState(60)

  const frequency = freqToLog(freqSlider, 20, 2000)

  // Sync oscillator params when playing
  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.type = waveType
    }
  }, [waveType])

  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.setTargetAtTime(
        frequency,
        audioCtxRef.current!.currentTime,
        0.01
      )
    }
  }, [frequency])

  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setTargetAtTime(
        volume / 100,
        audioCtxRef.current.currentTime,
        0.01
      )
    }
  }, [volume])

  const draw = useCallback(() => {
    const analyser = analyserRef.current
    const waveCanvas = waveCanvasRef.current
    const fftCanvas = fftCanvasRef.current
    if (!analyser || !waveCanvas || !fftCanvas) return

    const bufferLength = analyser.frequencyBinCount
    const timeData = new Uint8Array(bufferLength)
    const freqData = new Uint8Array(bufferLength)

    // --- Waveform canvas ---
    const wCtx = waveCanvas.getContext('2d')!
    analyser.getByteTimeDomainData(timeData)

    const W = waveCanvas.width
    const H = waveCanvas.height

    wCtx.clearRect(0, 0, W, H)
    wCtx.fillStyle = '#0a0a0a'
    wCtx.fillRect(0, 0, W, H)

    // Grid lines
    wCtx.strokeStyle = 'rgba(63,63,70,0.4)'
    wCtx.lineWidth = 1
    for (let g = 1; g < 4; g++) {
      const y = (H / 4) * g
      wCtx.beginPath()
      wCtx.moveTo(0, y)
      wCtx.lineTo(W, y)
      wCtx.stroke()
    }
    for (let g = 1; g < 8; g++) {
      const x = (W / 8) * g
      wCtx.beginPath()
      wCtx.moveTo(x, 0)
      wCtx.lineTo(x, H)
      wCtx.stroke()
    }

    // Center line
    wCtx.strokeStyle = 'rgba(63,63,70,0.6)'
    wCtx.lineWidth = 1
    wCtx.setLineDash([4, 4])
    wCtx.beginPath()
    wCtx.moveTo(0, H / 2)
    wCtx.lineTo(W, H / 2)
    wCtx.stroke()
    wCtx.setLineDash([])

    // Waveform glow
    wCtx.shadowColor = 'rgba(252, 211, 77, 0.6)'
    wCtx.shadowBlur = 12
    wCtx.strokeStyle = '#fcd34d'
    wCtx.lineWidth = 2.5
    wCtx.lineJoin = 'round'
    wCtx.lineCap = 'round'

    wCtx.beginPath()
    const sliceWidth = W / bufferLength
    let x = 0
    for (let i = 0; i < bufferLength; i++) {
      const v = timeData[i] / 128.0
      const y = (v * H) / 2
      if (i === 0) wCtx.moveTo(x, y)
      else wCtx.lineTo(x, y)
      x += sliceWidth
    }
    wCtx.stroke()
    wCtx.shadowBlur = 0

    // --- FFT canvas ---
    const fCtx = fftCanvas.getContext('2d')!
    analyser.getByteFrequencyData(freqData)

    const FW = fftCanvas.width
    const FH = fftCanvas.height

    fCtx.clearRect(0, 0, FW, FH)
    fCtx.fillStyle = '#0a0a0a'
    fCtx.fillRect(0, 0, FW, FH)

    const barCount = 128
    const barWidth = FW / barCount - 1

    for (let i = 0; i < barCount; i++) {
      const value = freqData[i]
      const barHeight = (value / 255) * FH

      const hue = 30 + (i / barCount) * 20
      const alpha = 0.7 + (value / 255) * 0.3
      fCtx.fillStyle = `hsla(${hue}, 90%, 65%, ${alpha})`

      fCtx.shadowColor = `hsla(${hue}, 90%, 65%, 0.4)`
      fCtx.shadowBlur = 6

      fCtx.fillRect(
        i * (barWidth + 1),
        FH - barHeight,
        barWidth,
        barHeight
      )
    }
    fCtx.shadowBlur = 0

    animFrameRef.current = requestAnimationFrame(draw)
  }, [])

  const startAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') await ctx.resume()

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8
    analyserRef.current = analyser

    const gain = ctx.createGain()
    gain.gain.value = volume / 100
    gainRef.current = gain

    const osc = ctx.createOscillator()
    osc.type = waveType
    osc.frequency.value = frequency
    oscillatorRef.current = osc

    osc.connect(analyser)
    analyser.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    setPlaying(true)
    animFrameRef.current = requestAnimationFrame(draw)
  }, [waveType, frequency, volume, draw])

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)

    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current.disconnect()
      oscillatorRef.current = null
    }
    if (gainRef.current) {
      gainRef.current.disconnect()
      gainRef.current = null
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }

    // Clear canvases to idle state
    const waveCanvas = waveCanvasRef.current
    if (waveCanvas) {
      const wCtx = waveCanvas.getContext('2d')!
      wCtx.fillStyle = '#0a0a0a'
      wCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height)
      // Draw flat center line
      wCtx.strokeStyle = 'rgba(63,63,70,0.6)'
      wCtx.lineWidth = 1
      wCtx.setLineDash([4, 4])
      wCtx.beginPath()
      wCtx.moveTo(0, waveCanvas.height / 2)
      wCtx.lineTo(waveCanvas.width, waveCanvas.height / 2)
      wCtx.stroke()
      wCtx.setLineDash([])
    }
    const fftCanvas = fftCanvasRef.current
    if (fftCanvas) {
      const fCtx = fftCanvas.getContext('2d')!
      fCtx.fillStyle = '#0a0a0a'
      fCtx.fillRect(0, 0, fftCanvas.width, fftCanvas.height)
    }

    setPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (playing) stopAudio()
    else startAudio()
  }, [playing, startAudio, stopAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      oscillatorRef.current?.stop()
      oscillatorRef.current?.disconnect()
      gainRef.current?.disconnect()
      analyserRef.current?.disconnect()
      audioCtxRef.current?.close()
    }
  }, [])

  // Draw idle state on mount
  useEffect(() => {
    const waveCanvas = waveCanvasRef.current
    const fftCanvas = fftCanvasRef.current
    if (waveCanvas) {
      const ctx = waveCanvas.getContext('2d')!
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, waveCanvas.width, waveCanvas.height)
      ctx.strokeStyle = 'rgba(63,63,70,0.6)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(0, waveCanvas.height / 2)
      ctx.lineTo(waveCanvas.width, waveCanvas.height / 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
    if (fftCanvas) {
      const ctx = fftCanvas.getContext('2d')!
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, fftCanvas.width, fftCanvas.height)
    }
  }, [])

  return (
    <div className="max-w-2xl">
      <a href="/" className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-12 mb-10">← Home</a>
      <header className="mb-8">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-2">
          Waveform Oscilloscope
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          OscillatorNode가 만드는 파형을 AnalyserNode로 캡처해 실시간 시각화한다.
        </p>
      </header>

      {/* Canvas: Waveform */}
      <div className="mb-2">
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
          time domain
        </p>
        <canvas
          ref={waveCanvasRef}
          width={640}
          height={160}
          className="w-full rounded border border-zinc-800 block"
          style={{ background: '#0a0a0a' }}
        />
      </div>

      {/* Canvas: FFT */}
      <div className="mb-8">
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
          frequency domain (fft)
        </p>
        <canvas
          ref={fftCanvasRef}
          width={640}
          height={100}
          className="w-full rounded border border-zinc-800 block"
          style={{ background: '#0a0a0a' }}
        />
      </div>

      {/* Controls */}
      <div className="space-y-6 mb-10">
        {/* Waveform selector */}
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

        {/* Frequency */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
            frequency —{' '}
            <span className="text-orange-300">{frequency} Hz</span>
          </p>
          <input
            type="range"
            min={0}
            max={1000}
            value={freqSlider}
            onChange={(e) => setFreqSlider(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-zinc-700">20 Hz</span>
            <span className="text-[10px] font-mono text-zinc-700">2000 Hz</span>
          </div>
        </div>

        {/* Volume */}
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
            volume —{' '}
            <span className="text-orange-300">{volume}%</span>
          </p>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
        </div>

        {/* Play/Stop */}
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
      </div>

      {/* Explanation */}
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
            이 실험에 대해
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            Web Audio API의 <code className="text-zinc-400">OscillatorNode</code>는 네 가지 기본 파형을 생성한다.
            사인파는 단일 주파수의 순수한 소리, 사각파는 홀수 배음이 풍부한 날카로운 소리,
            톱니파는 모든 배음을 포함한 밝은 소리, 삼각파는 사인파에 가까운 부드러운 소리를 낸다.
            <code className="text-zinc-400">AnalyserNode</code>를 통해 시간 도메인(파형)과
            주파수 도메인(FFT) 데이터를 실시간으로 추출하여 Canvas에 그린다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">
            핵심 코드
          </p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`const ctx = new AudioContext()
const osc = ctx.createOscillator()
const analyser = ctx.createAnalyser()
const gain = ctx.createGain()

analyser.fftSize = 2048          // 분석 해상도
osc.type = 'sine'                // 파형 타입
osc.frequency.value = 440        // A4 = 440 Hz

// 신호 체인: osc → analyser → gain → 스피커
osc.connect(analyser)
analyser.connect(gain)
gain.connect(ctx.destination)
osc.start()

// 매 프레임 파형 데이터 읽기
const data = new Uint8Array(analyser.frequencyBinCount)
analyser.getByteTimeDomainData(data) // 시간 도메인
analyser.getByteFrequencyData(data)  // 주파수 도메인`}</pre>
        </div>
      </div>
    </div>
  )
}
