'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const COLS = 100
const ROWS = 70
const TARGET_FPS = 60

function createGrid(): Uint8Array {
  return new Uint8Array(COLS * ROWS)
}

function idx(x: number, y: number): number {
  return y * COLS + x
}

function countNeighbors(grid: Uint8Array, x: number, y: number): number {
  let count = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = (x + dx + COLS) % COLS
      const ny = (y + dy + ROWS) % ROWS
      count += grid[idx(nx, ny)]
    }
  }
  return count
}

function step(grid: Uint8Array): Uint8Array {
  const next = createGrid()
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const alive = grid[idx(x, y)]
      const n = countNeighbors(grid, x, y)
      if (alive) {
        next[idx(x, y)] = n === 2 || n === 3 ? 1 : 0
      } else {
        next[idx(x, y)] = n === 3 ? 1 : 0
      }
    }
  }
  return next
}

function randomGrid(): Uint8Array {
  const g = createGrid()
  for (let i = 0; i < g.length; i++) {
    g[i] = Math.random() < 0.3 ? 1 : 0
  }
  return g
}

export default function GameOfLifePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<Uint8Array>(randomGrid())
  const runningRef = useRef(true)
  const animIdRef = useRef<number>(0)
  const generationRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const isDrawingRef = useRef(false)
  const drawModeRef = useRef<0 | 1>(1)

  const [running, setRunning] = useState(true)
  const [generation, setGeneration] = useState(0)

  const renderGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cellW = W / COLS
    const cellH = H / ROWS

    ctx.fillStyle = '#0f0f0f'
    ctx.fillRect(0, 0, W, H)

    const grid = gridRef.current
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[idx(x, y)]) {
          ctx.fillStyle = 'rgba(251,146,60,0.92)'
          ctx.fillRect(
            Math.floor(x * cellW) + 0.5,
            Math.floor(y * cellH) + 0.5,
            Math.ceil(cellW) - 1,
            Math.ceil(cellH) - 1
          )
        }
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      renderGrid()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const interval = 1000 / TARGET_FPS

    const loop = (ts: number) => {
      animIdRef.current = requestAnimationFrame(loop)
      if (runningRef.current) {
        if (ts - lastFrameTimeRef.current >= interval) {
          lastFrameTimeRef.current = ts
          gridRef.current = step(gridRef.current)
          generationRef.current++
          setGeneration(generationRef.current)
          renderGrid()
        }
      }
    }

    animIdRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animIdRef.current)
      ro.disconnect()
    }
  }, [renderGrid])

  const getCellFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    const x = Math.floor(((clientX - rect.left) / rect.width) * COLS)
    const y = Math.floor(((clientY - rect.top) / rect.height) * ROWS)
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null
    return { x, y }
  }, [])

  const paintCell = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const cell = getCellFromEvent(e)
    if (!cell) return
    const newGrid = new Uint8Array(gridRef.current)
    newGrid[idx(cell.x, cell.y)] = drawModeRef.current
    gridRef.current = newGrid
    renderGrid()
  }, [getCellFromEvent, renderGrid])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const cell = getCellFromEvent(e)
    if (!cell) return
    drawModeRef.current = gridRef.current[idx(cell.x, cell.y)] ? 0 : 1
    isDrawingRef.current = true
    paintCell(e)
  }, [getCellFromEvent, paintCell])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current) return
    paintCell(e)
  }, [paintCell])

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  const toggleRunning = useCallback(() => {
    runningRef.current = !runningRef.current
    setRunning(runningRef.current)
  }, [])

  const clear = useCallback(() => {
    gridRef.current = createGrid()
    generationRef.current = 0
    setGeneration(0)
    renderGrid()
  }, [renderGrid])

  const randomize = useCallback(() => {
    gridRef.current = randomGrid()
    generationRef.current = 0
    setGeneration(0)
    renderGrid()
  }, [renderGrid])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleRunning}
            className="text-[10px] font-mono border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {running ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={randomize}
            className="text-[10px] font-mono border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Random
          </button>
          <button
            onClick={clear}
            className="text-[10px] font-mono border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear
          </button>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">
          gen <span className="text-zinc-400">{generation.toLocaleString()}</span>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-crosshair"
        style={{ height: 500 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            Conway의 생명 게임(Game of Life)은 1970년 수학자 John Horton Conway가 고안한 세포 자동자(cellular automaton)다.
            단 네 가지 규칙만으로 글라이더, 오실레이터, 스틸 라이프 등 무한한 패턴이 창발한다.
            캔버스를 클릭하거나 드래그해 세포를 직접 그릴 수 있다.
            빈 격자에서 시작해 글라이더나 글라이더 건을 손으로 그려보는 것을 추천한다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// Conway의 네 가지 규칙
function step(grid: Uint8Array): Uint8Array {
  const next = new Uint8Array(COLS * ROWS)
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const alive = grid[y * COLS + x]
      const n = countNeighbors(grid, x, y)
      // 살아있는 세포: 2~3명 이웃이면 생존
      // 죽은 세포: 정확히 3명 이웃이면 탄생
      next[y * COLS + x] = alive
        ? (n === 2 || n === 3 ? 1 : 0)
        : (n === 3 ? 1 : 0)
    }
  }
  return next
}

// 토러스 경계 — 격자 가장자리가 반대쪽과 연결됨
const nx = (x + dx + COLS) % COLS
const ny = (y + dy + ROWS) % ROWS`}</pre>
        </div>
      </div>
    </div>
  )
}
