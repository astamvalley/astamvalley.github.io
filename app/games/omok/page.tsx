'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import BackLink from '@/app/components/BackLink'

// ── Constants ─────────────────────────────────────────────────────────────────
const N = 15                                     // 15×15 intersections
const CELL = 28                                  // px between lines
const PAD = 24                                   // canvas padding
const CW = PAD * 2 + CELL * (N - 1)             // 440
const CH = PAD * 2 + CELL * (N - 1)             // 440
const SR = CELL * 0.44                           // stone radius

// Star points (row, col)
const STARS: [number, number][] = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11],
]

// ── Types ─────────────────────────────────────────────────────────────────────
type Cell = 0 | 1 | 2
type Phase = 'playing' | 'over'
type Mode = 'ai' | 'pvp'

// ── Board helpers ─────────────────────────────────────────────────────────────
const newBoard = (): Cell[][] => Array.from({ length: N }, () => Array(N).fill(0) as Cell[])

function inBounds(r: number, c: number) {
  return r >= 0 && r < N && c >= 0 && c < N
}

function checkWin(board: Cell[][], r: number, c: number, p: 1 | 2): boolean {
  const dirs: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]]
  for (const [dr, dc] of dirs) {
    let count = 1
    for (let s = 1; s <= 4; s++) {
      if (inBounds(r + dr * s, c + dc * s) && board[r + dr * s][c + dc * s] === p) count++
      else break
    }
    for (let s = 1; s <= 4; s++) {
      if (inBounds(r - dr * s, c - dc * s) && board[r - dr * s][c - dc * s] === p) count++
      else break
    }
    if (count >= 5) return true
  }
  return false
}

// Score a single direction for threat evaluation
function scoreDir(board: Cell[][], r: number, c: number, dr: number, dc: number, p: Cell): number {
  let count = 1
  let open = 0

  let nr = r + dr, nc = c + dc
  while (inBounds(nr, nc) && board[nr][nc] === p) { count++; nr += dr; nc += dc }
  if (inBounds(nr, nc) && board[nr][nc] === 0) open++

  nr = r - dr; nc = c - dc
  while (inBounds(nr, nc) && board[nr][nc] === p) { count++; nr -= dr; nc -= dc }
  if (inBounds(nr, nc) && board[nr][nc] === 0) open++

  if (count >= 5) return 100_000
  if (count === 4 && open >= 1) return 10_000
  if (count === 4) return 1_000
  if (count === 3 && open === 2) return 1_000
  if (count === 3 && open === 1) return 300
  if (count === 2 && open === 2) return 100
  if (count === 2) return 30
  if (open > 0) return 5
  return 0
}

function scoreCell(board: Cell[][], r: number, c: number, p: Cell): number {
  const dirs: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]]
  return dirs.reduce((s, [dr, dc]) => s + scoreDir(board, r, c, dr, dc, p), 0)
}

function aiMove(board: Cell[][]): [number, number] | null {
  // 1. Win immediately
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (board[r][c] !== 0) continue
      board[r][c] = 2
      const win = checkWin(board, r, c, 2)
      board[r][c] = 0
      if (win) return [r, c]
    }

  // 2. Block player win
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (board[r][c] !== 0) continue
      board[r][c] = 1
      const win = checkWin(board, r, c, 1)
      board[r][c] = 0
      if (win) return [r, c]
    }

  // 3. Best scored empty cell
  let best = -1
  let move: [number, number] | null = null

  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (board[r][c] !== 0) continue

      board[r][c] = 2
      const atk = scoreCell(board, r, c, 2)
      board[r][c] = 0

      board[r][c] = 1
      const def = scoreCell(board, r, c, 1)
      board[r][c] = 0

      // Center bonus
      const cb = (7 - Math.abs(r - 7)) + (7 - Math.abs(c - 7))
      const total = atk * 1.05 + def + cb * 0.5

      if (total > best) { best = total; move = [r, c] }
    }

  return move
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OmokPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<Cell[][]>(newBoard())
  const hoverRef = useRef<[number, number] | null>(null)

  const phaseRef = useRef<Phase>('playing')
  const turnRef = useRef<1 | 2>(1)

  const [turn, setTurn] = useState<1 | 2>(1)
  const [phase, setPhase] = useState<Phase>('playing')
  const [winner, setWinner] = useState<1 | 2 | null>(null)
  const [mode, setMode] = useState<Mode>('ai')
  const [aiThinking, setAiThinking] = useState(false)

  const syncPhase = (p: Phase) => { phaseRef.current = p; setPhase(p) }
  const syncTurn = (t: 1 | 2) => { turnRef.current = t; setTurn(t) }

  // ── Render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, CW, CH)

      // Background
      ctx.fillStyle = '#161412'
      ctx.fillRect(0, 0, CW, CH)

      // Board lines
      ctx.strokeStyle = '#3a3530'
      ctx.lineWidth = 1
      for (let i = 0; i < N; i++) {
        const x = PAD + i * CELL
        const y = PAD + i * CELL
        ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + (N - 1) * CELL, y); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + (N - 1) * CELL); ctx.stroke()
      }

      // Star points
      STARS.forEach(([r, c]) => {
        ctx.beginPath()
        ctx.arc(PAD + c * CELL, PAD + r * CELL, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#4a4540'
        ctx.fill()
      })

      // Hover indicator
      const hover = hoverRef.current
      if (hover && phaseRef.current === 'playing') {
        const [hr, hc] = hover
        if (boardRef.current[hr][hc] === 0) {
          const hx = PAD + hc * CELL, hy = PAD + hr * CELL
          ctx.beginPath()
          ctx.arc(hx, hy, SR, 0, Math.PI * 2)
          ctx.fillStyle = turnRef.current === 1
            ? 'rgba(200,200,210,0.18)'
            : 'rgba(255,255,255,0.12)'
          ctx.fill()
        }
      }

      // Stones
      const board = boardRef.current
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          const cell = board[r][c]
          if (cell === 0) continue
          const x = PAD + c * CELL, y = PAD + r * CELL

          // Drop shadow
          ctx.beginPath()
          ctx.arc(x + 1.5, y + 2, SR, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(0,0,0,0.45)'
          ctx.fill()

          if (cell === 1) {
            // Black stone
            const g = ctx.createRadialGradient(x - SR * 0.3, y - SR * 0.3, 1, x, y, SR)
            g.addColorStop(0, '#5c6370')
            g.addColorStop(0.4, '#1c2027')
            g.addColorStop(1, '#05070a')
            ctx.beginPath()
            ctx.arc(x, y, SR, 0, Math.PI * 2)
            ctx.fillStyle = g
            ctx.fill()
          } else {
            // White stone
            const g = ctx.createRadialGradient(x - SR * 0.3, y - SR * 0.3, 1, x, y, SR)
            g.addColorStop(0, '#ffffff')
            g.addColorStop(0.6, '#e8e8ec')
            g.addColorStop(1, '#a0a0aa')
            ctx.beginPath()
            ctx.arc(x, y, SR, 0, Math.PI * 2)
            ctx.fillStyle = g
            ctx.fill()
            ctx.strokeStyle = '#c0c0c8'
            ctx.lineWidth = 0.5
            ctx.stroke()
          }

          // Specular
          ctx.beginPath()
          ctx.arc(x - SR * 0.28, y - SR * 0.3, SR * 0.28, 0, Math.PI * 2)
          ctx.fillStyle = cell === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)'
          ctx.fill()
        }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCell = (e: React.MouseEvent): [number, number] | null => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (CW / rect.width)
    const py = (e.clientY - rect.top) * (CH / rect.height)
    const c = Math.round((px - PAD) / CELL)
    const r = Math.round((py - PAD) / CELL)
    if (!inBounds(r, c)) return null
    return [r, c]
  }

  const place = useCallback((r: number, c: number, p: 1 | 2): boolean => {
    if (boardRef.current[r][c] !== 0) return false
    boardRef.current[r][c] = p
    if (checkWin(boardRef.current, r, c, p)) {
      syncPhase('over')
      setWinner(p)
    }
    return true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Click ─────────────────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (phaseRef.current !== 'playing') return
    if (mode === 'ai' && turnRef.current === 2) return

    const cell = getCell(e)
    if (!cell) return
    const [r, c] = cell

    if (!place(r, c, turnRef.current)) return
    if ((phaseRef.current as Phase) === 'over') return

    const next: 1 | 2 = turnRef.current === 1 ? 2 : 1
    syncTurn(next)

    if (mode === 'ai' && next === 2) {
      setAiThinking(true)
      setTimeout(() => {
        const mv = aiMove(boardRef.current)
        if (mv) {
          place(mv[0], mv[1], 2)
          if (phaseRef.current !== 'over') syncTurn(1)
        }
        setAiThinking(false)
      }, 150)
    }
  }, [mode, place]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = (e: React.MouseEvent) => { hoverRef.current = getCell(e) }
  const handleMouseLeave = () => { hoverRef.current = null }

  // ── Restart ───────────────────────────────────────────────────────────────
  const restart = useCallback((newMode?: Mode) => {
    boardRef.current = newBoard()
    hoverRef.current = null
    setWinner(null)
    setAiThinking(false)
    syncTurn(1)
    syncPhase('playing')
    if (newMode) setMode(newMode)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Labels ────────────────────────────────────────────────────────────────
  const pName = (p: 1 | 2) => p === 1 ? '흑' : mode === 'ai' ? 'AI (백)' : '백'

  const statusMsg = () => {
    if (phase === 'over') return `${pName(winner!)} 승리`
    if (aiThinking) return 'AI 생각 중...'
    return `${pName(turn)} 차례`
  }

  return (
    <main className="max-w-[520px] mx-auto px-4 py-4">
      <BackLink section="games / omok" />

      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          {(['ai', 'pvp'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => restart(m)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
                mode === m
                  ? 'border-zinc-500 text-zinc-300'
                  : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-500'
              }`}
            >
              {m === 'ai' ? 'vs AI' : '2P'}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-zinc-400">{statusMsg()}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="w-full rounded-lg border border-zinc-800 cursor-crosshair select-none"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] font-mono text-zinc-700">
          교점을 클릭해 돌을 놓는다 · 5개를 먼저 잇는 쪽 승리
        </p>
        {phase === 'over' && (
          <button
            onClick={() => restart()}
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
          >
            다시 시작
          </button>
        )}
      </div>
    </main>
  )
}
