'use client'

import { useEffect, useRef, useState } from 'react'
import BackLink from '@/app/components/BackLink'

// ── Grid ──────────────────────────────────────────────────────────
const COLS = 200
const ROWS = 150
const CELL = 3   // px per grid cell → 600 × 450 canvas

// ── Cell types ────────────────────────────────────────────────────
const EMPTY = 0, SAND = 1, WATER = 2, FIRE = 3, SMOKE = 4, STONE = 5, WOOD = 6

// ── Module-level sim state (perf: avoid allocation each frame) ────
const grid = new Uint8Array(COLS * ROWS)
const meta = new Uint8Array(COLS * ROWS)   // fire age, smoke age
const shd  = new Int8Array(COLS * ROWS)    // per-cell shade offset −8..8
const upd  = new Uint8Array(COLS * ROWS)   // visited this step?
let frame = 0

// ── Helpers ───────────────────────────────────────────────────────
const clamp = (n: number) => n < 0 ? 0 : n > 255 ? 255 : n
const gi    = (x: number, y: number) => y * COLS + x
const inB   = (x: number, y: number) => x >= 0 && x < COLS && y >= 0 && y < ROWS
const getCell  = (x: number, y: number): number => inB(x, y) ? grid[gi(x, y)] : STONE
const isEmpty  = (x: number, y: number) => getCell(x, y) === EMPTY

function setCell(x: number, y: number, type: number) {
  if (!inB(x, y)) return
  const i = gi(x, y)
  grid[i] = type
  meta[i] = 0
  shd[i]  = ((Math.random() * 17 - 8) | 0)
}

function swapCells(ax: number, ay: number, bx: number, by: number) {
  const ai = gi(ax, ay), bi = gi(bx, by)
  const g = grid[ai]; grid[ai] = grid[bi]; grid[bi] = g
  const m = meta[ai]; meta[ai] = meta[bi]; meta[bi] = m
  const s = shd[ai];  shd[ai]  = shd[bi];  shd[bi]  = s
  upd[bi] = 1
}

// ── Rendering ─────────────────────────────────────────────────────
function cellColor(
  type: number, s: number, m: number, f: number
): [number, number, number] {
  switch (type) {
    case SAND: {
      return [clamp(194 + s), clamp(162 + s), clamp(96 + s)]
    }
    case WATER: {
      const wave = (Math.sin(f * 0.05 + s * 0.4) * 6) | 0
      return [clamp(22 + s), clamp(82 + s + wave), clamp(198 + s)]
    }
    case FIRE: {
      const flicker = (Math.sin(f * 0.5 + s * 0.8) * 18) | 0
      const age = Math.min(m, 80) / 80
      return [
        clamp(240 + flicker),
        clamp(Math.round(140 - age * 110) + flicker),
        clamp(8 - age * 8),
      ]
    }
    case SMOKE: {
      const age = Math.min(m, 80) / 80
      return [
        clamp(Math.round(62 + age * (10 - 62) + s)),
        clamp(Math.round(64 + age * (10 - 64) + s)),
        clamp(Math.round(68 + age * (10 - 68) + s)),
      ]
    }
    case STONE: return [clamp(104 + s), clamp(107 + s), clamp(115 + s)]
    case WOOD:  return [clamp(98  + s), clamp(66  + s), clamp(30  + s)]
    default:    return [10, 10, 10]
  }
}

// ── Simulation rules ──────────────────────────────────────────────
const N4 = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const

function stepSand(x: number, y: number) {
  const below = getCell(x, y + 1)
  if (below === EMPTY || below === WATER) { swapCells(x, y, x, y + 1); return }
  const l = getCell(x - 1, y + 1), r = getCell(x + 1, y + 1)
  const cl = l === EMPTY || l === WATER
  const cr = r === EMPTY || r === WATER
  if (cl && cr) swapCells(x, y, Math.random() < 0.5 ? x - 1 : x + 1, y + 1)
  else if (cl)  swapCells(x, y, x - 1, y + 1)
  else if (cr)  swapCells(x, y, x + 1, y + 1)
}

function stepWater(x: number, y: number) {
  if (isEmpty(x, y + 1)) { swapCells(x, y, x, y + 1); return }
  const l = isEmpty(x - 1, y + 1), r = isEmpty(x + 1, y + 1)
  if (l && r) { swapCells(x, y, Math.random() < 0.5 ? x - 1 : x + 1, y + 1); return }
  if (l)      { swapCells(x, y, x - 1, y + 1); return }
  if (r)      { swapCells(x, y, x + 1, y + 1); return }
  const d = Math.random() < 0.5 ? 1 : -1
  for (const dir of [d, -d]) {
    for (let n = 1; n <= 5; n++) {
      const nx = x + dir * n
      if (!isEmpty(nx, y)) break
      if (n === 5 || !isEmpty(nx + dir, y)) { swapCells(x, y, nx, y); return }
    }
  }
}

function stepFire(x: number, y: number) {
  const i = gi(x, y)
  if (meta[i] < 255) meta[i]++

  // Extinguish by adjacent water
  for (const [dx, dy] of N4) {
    if (getCell(x + dx, y + dy) === WATER && Math.random() < 0.08) {
      grid[i] = SMOKE; meta[i] = 0; return
    }
  }

  // Ignite adjacent wood
  for (const [dx, dy] of N4) {
    const nx = x + dx, ny = y + dy
    if (inB(nx, ny) && getCell(nx, ny) === WOOD && Math.random() < 0.001) {
      setCell(nx, ny, FIRE)
    }
  }

  // Rise — leave smoke trail occasionally
  if (isEmpty(x, y - 1) && Math.random() < 0.62) {
    swapCells(x, y, x, y - 1)
    if (Math.random() < 0.22) {
      const ti = gi(x, y)
      grid[ti] = SMOKE
      meta[ti] = 0
      shd[ti]  = ((Math.random() * 17 - 8) | 0)
    }
    return
  }
  const ddx = Math.random() < 0.5 ? -1 : 1
  if (isEmpty(x + ddx, y - 1) && Math.random() < 0.38) {
    swapCells(x, y, x + ddx, y - 1); return
  }

  // Die into smoke
  if (meta[i] > 50 + (Math.random() * 65 | 0)) {
    grid[i] = SMOKE; meta[i] = 0
  }
}

function stepSmoke(x: number, y: number) {
  const i = gi(x, y)
  if (meta[i] < 255) meta[i]++
  if (meta[i] > 72 + (Math.random() * 44 | 0)) { grid[i] = EMPTY; meta[i] = 0; return }
  if (isEmpty(x, y - 1) && Math.random() < 0.5) { swapCells(x, y, x, y - 1); return }
  const dx = Math.random() < 0.5 ? -1 : 1
  if (isEmpty(x + dx, y - 1) && Math.random() < 0.25) { swapCells(x, y, x + dx, y - 1); return }
  if (isEmpty(x + dx, y)     && Math.random() < 0.15) { swapCells(x, y, x + dx, y) }
}

function stepWood(x: number, y: number) {
  for (const [dx, dy] of N4) {
    const nx = x + dx, ny = y + dy
    if (inB(nx, ny) && getCell(nx, ny) === FIRE && Math.random() < 0.001) {
      setCell(x, y, FIRE); break
    }
  }
}

function simStep() {
  upd.fill(0)
  frame++
  for (let y = ROWS - 1; y >= 0; y--) {
    const ltr = (frame + y) % 2 === 0
    for (let xi = 0; xi < COLS; xi++) {
      const x = ltr ? xi : COLS - 1 - xi
      const i = gi(x, y)
      if (upd[i]) continue
      switch (grid[i]) {
        case SAND:  stepSand(x, y);  break
        case WATER: stepWater(x, y); break
        case FIRE:  stepFire(x, y);  break
        case SMOKE: stepSmoke(x, y); break
        case WOOD:  stepWood(x, y);  break
      }
    }
  }
}

// ── UI config ─────────────────────────────────────────────────────
const MATERIALS = [
  { type: SAND,  label: 'sand',  dot: '#c2a464' },
  { type: WATER, label: 'water', dot: '#3b82f6' },
  { type: FIRE,  label: 'fire',  dot: '#f97316' },
  { type: STONE, label: 'stone', dot: '#71717a' },
  { type: WOOD,  label: 'wood',  dot: '#a16207' },
  { type: EMPTY, label: 'erase', dot: '#3f3f46' },
] as const

const BRUSH_SIZES = [
  { r: 2, label: 'S' },
  { r: 5, label: 'M' },
  { r: 10, label: 'L' },
] as const

// ── Component ─────────────────────────────────────────────────────
export default function SandPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [mat,   setMat]   = useState<number>(SAND)
  const [brush, setBrush] = useState<number>(2)
  const matRef   = useRef(mat)
  const brushRef = useRef(brush)
  matRef.current   = mat
  brushRef.current = brush

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = COLS * CELL
    canvas.height = ROWS * CELL

    const imgData = ctx.createImageData(COLS * CELL, ROWS * CELL)
    const data = imgData.data

    // Prime background to opaque black
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 10; data[i + 1] = 10; data[i + 2] = 10; data[i + 3] = 255
    }

    let raf: number

    const renderLoop = () => {
      simStep()

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const i  = gi(x, y)
          const [r, g, b] = cellColor(grid[i], shd[i], meta[i], frame)
          const bx = x * CELL, by = y * CELL
          for (let cy = 0; cy < CELL; cy++) {
            for (let cx = 0; cx < CELL; cx++) {
              const pi = ((by + cy) * COLS * CELL + (bx + cx)) * 4
              data[pi]     = r
              data[pi + 1] = g
              data[pi + 2] = b
              // alpha already 255, no need to rewrite
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0)
      raf = requestAnimationFrame(renderLoop)
    }

    raf = requestAnimationFrame(renderLoop)

    // ── Pointer input ──────────────────────────────────────────────
    let painting = false

    function paint(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect()
      const gx = Math.floor((clientX - rect.left) * COLS / rect.width)
      const gy = Math.floor((clientY - rect.top)  * ROWS / rect.height)
      const r  = brushRef.current
      const m  = matRef.current
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r + 1) setCell(gx + dx, gy + dy, m)
        }
      }
    }

    const onDown = (e: MouseEvent) => { painting = true; paint(e.clientX, e.clientY) }
    const onMove = (e: MouseEvent) => { if (painting) paint(e.clientX, e.clientY) }
    const onUp   = () => { painting = false }
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      Array.from(e.touches).forEach(t => paint(t.clientX, t.clientY))
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    canvas.addEventListener('touchstart', onTouch, { passive: false })
    canvas.addEventListener('touchmove',  onTouch, { passive: false })

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      canvas.removeEventListener('touchstart', onTouch)
      canvas.removeEventListener('touchmove',  onTouch)
    }
  }, [])

  return (
    <div className="py-8">
      <BackLink section="falling sand" />

      <div className="mb-5">
        <h1 className="font-mono text-zinc-100 text-xl mb-1 tracking-tight">falling sand</h1>
        <p className="font-mono text-zinc-600 text-xs">
          캔버스 전용 파티클 시뮬레이션 — 라이브러리 없음
        </p>
      </div>

      {/* Canvas */}
      <div className="border border-zinc-800/80" style={{ lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            maxWidth: COLS * CELL,
            height: 'auto',
            display: 'block',
            imageRendering: 'pixelated',
            cursor: 'crosshair',
          }}
        />
      </div>

      {/* Controls */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Material selector */}
        <div className="flex gap-1 flex-wrap">
          {MATERIALS.map(({ type, label, dot }) => (
            <button
              key={type}
              onClick={() => setMat(type)}
              className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1.5 border transition-colors ${
                mat === type
                  ? 'border-orange-400/60 text-orange-300 bg-orange-400/10'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: dot }}
              />
              {label}
            </button>
          ))}
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] text-zinc-700 mr-0.5">brush</span>
          {BRUSH_SIZES.map(({ r, label }) => (
            <button
              key={r}
              onClick={() => setBrush(r)}
              className={`font-mono text-xs w-7 py-1.5 border transition-colors text-center ${
                brush === r
                  ? 'border-orange-400/60 text-orange-300'
                  : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Clear */}
        <button
          onClick={() => { grid.fill(0); meta.fill(0) }}
          className="font-mono text-xs text-zinc-700 hover:text-zinc-400 transition-colors ml-auto"
        >
          clear
        </button>
      </div>

      {/* Hints */}
      <p className="mt-4 font-mono text-[11px] text-zinc-800 leading-relaxed">
        sand sinks through water · wood burns · fire turns to smoke · water extinguishes fire
      </p>
    </div>
  )
}
