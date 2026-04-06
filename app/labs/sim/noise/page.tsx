'use client'

import { useEffect, useRef, useState } from 'react'

// Layered sine-based smooth noise — no external library
// Uses multiple octaves of smooth gradient noise implemented with
// a permutation table (value noise style but with smoothstep interpolation)

const PERM_SIZE = 512
const perm = new Uint8Array(PERM_SIZE)

// Build a shuffled permutation table
;(function buildPerm() {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
})()

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
}

function noise2d(x: number, y: number): number {
  const xi = Math.floor(x) & 255
  const yi = Math.floor(y) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const u = fade(xf)
  const v = fade(yf)

  const aa = perm[perm[xi] + yi]
  const ab = perm[perm[xi] + yi + 1]
  const ba = perm[perm[xi + 1] + yi]
  const bb = perm[perm[xi + 1] + yi + 1]

  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  )
}

// FBM — fractal brownian motion, 4 octaves
function fbm(x: number, y: number): number {
  let val = 0
  let amp = 0.5
  let freq = 1
  let max = 0
  for (let i = 0; i < 4; i++) {
    val += noise2d(x * freq, y * freq) * amp
    max += amp
    amp *= 0.5
    freq *= 2.1
  }
  return val / max
}

// Map noise value (-1..1) to terrain color
function terrainColor(n: number): [number, number, number] {
  // Normalize to 0..1
  const t = (n + 1) * 0.5

  if (t < 0.35) {
    // Deep water → shallow water
    const f = t / 0.35
    return [
      Math.round(lerp(15, 40, f)),
      Math.round(lerp(30, 80, f)),
      Math.round(lerp(80, 160, f)),
    ]
  } else if (t < 0.42) {
    // Shore
    const f = (t - 0.35) / 0.07
    return [
      Math.round(lerp(40, 180, f)),
      Math.round(lerp(80, 160, f)),
      Math.round(lerp(160, 100, f)),
    ]
  } else if (t < 0.62) {
    // Lowland green
    const f = (t - 0.42) / 0.2
    return [
      Math.round(lerp(50, 80, f)),
      Math.round(lerp(120, 100, f)),
      Math.round(lerp(60, 50, f)),
    ]
  } else if (t < 0.78) {
    // Highland / hills
    const f = (t - 0.62) / 0.16
    return [
      Math.round(lerp(80, 130, f)),
      Math.round(lerp(100, 110, f)),
      Math.round(lerp(50, 80, f)),
    ]
  } else if (t < 0.9) {
    // Rock
    const f = (t - 0.78) / 0.12
    return [
      Math.round(lerp(130, 160, f)),
      Math.round(lerp(110, 140, f)),
      Math.round(lerp(80, 140, f)),
    ]
  } else {
    // Snow
    const f = (t - 0.9) / 0.1
    return [
      Math.round(lerp(160, 235, Math.min(1, f))),
      Math.round(lerp(140, 235, Math.min(1, f))),
      Math.round(lerp(140, 245, Math.min(1, f))),
    ]
  }
}

const GRID_COLS = 120
const GRID_ROWS = 80

export default function NoisePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const zoomRef = useRef(1.0)
  const [zoom, setZoom] = useState(1.0)
  const animIdRef = useRef<number>(0)
  const offscreenRef = useRef<ImageData | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const setSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    setSize()

    const ro = new ResizeObserver(setSize)
    ro.observe(canvas)

    let t = 0
    const speed = 0.004

    const loop = () => {
      animIdRef.current = requestAnimationFrame(loop)
      t += speed

      const W = canvas.width
      const H = canvas.height
      const cellW = W / GRID_COLS
      const cellH = H / GRID_ROWS
      const z = zoomRef.current

      // Use ImageData for fast pixel writes
      if (!offscreenRef.current || offscreenRef.current.width !== W || offscreenRef.current.height !== H) {
        offscreenRef.current = ctx.createImageData(W, H)
      }
      const img = offscreenRef.current
      const data = img.data

      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const nx = (col / GRID_COLS) * z * 4 + t * 0.6
          const ny = (row / GRID_ROWS) * z * 4 + t * 0.4
          const n = fbm(nx, ny)
          const [r, g, b] = terrainColor(n)

          const px = Math.floor(col * cellW)
          const py = Math.floor(row * cellH)
          const pw = Math.ceil(cellW)
          const ph = Math.ceil(cellH)

          for (let dy = 0; dy < ph; dy++) {
            for (let dx = 0; dx < pw; dx++) {
              const px2 = px + dx
              const py2 = py + dy
              if (px2 >= W || py2 >= H) continue
              const i = (py2 * W + px2) * 4
              data[i] = r
              data[i + 1] = g
              data[i + 2] = b
              data[i + 3] = 255
            }
          }
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    loop()

    return () => {
      cancelAnimationFrame(animIdRef.current)
      ro.disconnect()
    }
  }, [])

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    zoomRef.current = v
    setZoom(v)
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Zoom</span>
          <input
            type="range"
            min="0.3"
            max="3.0"
            step="0.05"
            value={zoom}
            onChange={handleZoom}
            className="w-28 accent-orange-400"
          />
          <span className="text-[10px] font-mono text-zinc-500 w-8">{zoom.toFixed(2)}×</span>
        </label>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none"
        style={{ height: 500 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            외부 라이브러리 없이 순수 JavaScript로 구현한 퍼린 스타일 노이즈. 256개의 무작위 순열 테이블(permutation table)을 기반으로,
            격자 꼭짓점에서 그래디언트를 보간해 연속적인 노이즈 값을 생성한다.
            4옥타브의 FBM(Fractal Brownian Motion)을 쌓아 자연스러운 지형감을 만든다.
            시간 축으로 오프셋을 증가시켜 지형이 흐르는 효과를 낸다.
            Zoom 슬라이더는 노이즈 샘플링 주파수를 조절한다 — 낮을수록 부드럽고 넓은 지형, 높을수록 세밀하고 복잡해진다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 2D 퍼린 노이즈 — 순열 테이블 기반
function noise2d(x: number, y: number): number {
  const xi = Math.floor(x) & 255
  const yi = Math.floor(y) & 255
  const u = fade(x - Math.floor(x))  // smoothstep 6t⁵-15t⁴+10t³
  const v = fade(y - Math.floor(y))

  const aa = perm[perm[xi] + yi]
  const ba = perm[perm[xi + 1] + yi]
  // ... bilinear interpolation with gradient vectors
  return lerp(lerp(grad(aa,...), grad(ba,...), u),
              lerp(grad(ab,...), grad(bb,...), u), v)
}

// FBM — 4옥타브 누적
function fbm(x: number, y: number): number {
  let val = 0, amp = 0.5, freq = 1
  for (let i = 0; i < 4; i++) {
    val += noise2d(x * freq, y * freq) * amp
    amp *= 0.5; freq *= 2.1
  }
  return val
}

// 매 프레임 시간 오프셋으로 지형 흐름
const nx = (col / COLS) * zoom * 4 + time * 0.6
const ny = (row / ROWS) * zoom * 4 + time * 0.4`}</pre>
        </div>
      </div>
    </div>
  )
}
