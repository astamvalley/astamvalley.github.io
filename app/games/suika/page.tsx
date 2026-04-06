'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

// 레벨 1~10 (인덱스 0~9)
const FRUITS = [
  { radius: 14,  color: '#ff6b6b', border: '#e63946' },
  { radius: 21,  color: '#ffa94d', border: '#f77f00' },
  { radius: 29,  color: '#c084fc', border: '#9333ea' },
  { radius: 38,  color: '#fb923c', border: '#ea580c' },
  { radius: 48,  color: '#f87171', border: '#dc2626' },
  { radius: 60,  color: '#86efac', border: '#16a34a' },
  { radius: 73,  color: '#fde047', border: '#ca8a04' },
  { radius: 87,  color: '#fbbf24', border: '#b45309' },
  { radius: 103, color: '#4ade80', border: '#15803d' },
  { radius: 120, color: '#22c55e', border: '#166534' },
]
const MERGE_SCORES = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55]
const MAX_DROP_LEVEL = 5
const COOLDOWN = 700
const GW = 360
const GH = 560
const WT = 16       // side wall thickness
const FT = 50       // floor thickness
const DANGER_Y = 88

function randomLevel() {
  return Math.floor(Math.random() * MAX_DROP_LEVEL) + 1
}

// ── Inner simulation (remounts on key change) ──────────────────────────────
function GameCanvas({
  onScore,
  onGameOver,
  onNextLevel,
}: {
  onScore: (s: number) => void
  onGameOver: () => void
  onNextLevel: (l: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onScoreRef = useRef(onScore)
  const onGameOverRef = useRef(onGameOver)
  const onNextLevelRef = useRef(onNextLevel)
  onScoreRef.current = onScore
  onGameOverRef.current = onGameOver
  onNextLevelRef.current = onNextLevel

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.style.width  = `${GW}px`
    canvas.style.height = `${GH}px`
    canvas.width  = GW * dpr
    canvas.height = GH * dpr
    ctx.scale(dpr, dpr)

    const { Engine, Runner, Bodies, Composite, Events } = Matter
    const engine = Engine.create({
      gravity: { x: 0, y: 2.2 },
      positionIterations: 12,
      velocityIterations: 10,
      constraintIterations: 4,
    })
    const world  = engine.world

    // Walls — floor extra thick to prevent tunneling
    const wOpts = { isStatic: true, friction: 0.5, restitution: 0.15, label: 'wall' }
    Composite.add(world, [
      Bodies.rectangle(GW / 2,      GH - FT / 2, GW,   FT,      wOpts),
      Bodies.rectangle(WT / 2,      GH / 2,      WT,   GH * 2,  wOpts),
      Bodies.rectangle(GW - WT / 2, GH / 2,      WT,   GH * 2,  wOpts),
    ])

    const fruitBodies: Matter.Body[] = []
    const mergingIds  = new Set<number>()
    const pendingMerges: Array<{ bodyA: Matter.Body; bodyB: Matter.Body; level: number }> = []

    let dropperX     = GW / 2
    let currentLevel = randomLevel()
    let nextLevelVal = randomLevel()
    let canDrop      = true
    let gone         = false
    let dangerFrames = 0
    let frameCount   = 0
    let scoreVal     = 0

    onNextLevel(nextLevelVal)

    const mkFruit = (level: number, x: number, y: number) =>
      Bodies.circle(x, y, FRUITS[level - 1].radius, {
        restitution: 0.25,
        friction: 0.5,
        frictionAir: 0.012,
        density: 0.002,
        label: `f${level}`,
      })

    const drop = () => {
      if (!canDrop || gone) return
      canDrop = false
      const r = FRUITS[currentLevel - 1].radius
      const x = Math.max(WT + r + 2, Math.min(GW - WT - r - 2, dropperX))
      const body = mkFruit(currentLevel, x, DANGER_Y + r + 2)
      fruitBodies.push(body)
      Composite.add(world, body)
      currentLevel = nextLevelVal
      nextLevelVal = randomLevel()
      onNextLevelRef.current(nextLevelVal)
      setTimeout(() => { canDrop = true }, COOLDOWN)
    }

    // Merge on collision
    Events.on(engine, 'collisionStart', ({ pairs }) => {
      for (const { bodyA, bodyB } of pairs) {
        if (mergingIds.has(bodyA.id) || mergingIds.has(bodyB.id)) continue
        if (!bodyA.label.startsWith('f') || !bodyB.label.startsWith('f')) continue
        const la = parseInt(bodyA.label.slice(1))
        const lb = parseInt(bodyB.label.slice(1))
        if (la !== lb || la >= FRUITS.length) continue
        mergingIds.add(bodyA.id)
        mergingIds.add(bodyB.id)
        pendingMerges.push({ bodyA, bodyB, level: la })
      }
    })

    // Input
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      dropperX = e.clientX - rect.left
    }
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      dropperX = e.touches[0].clientX - rect.left
    }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', drop)
    canvas.addEventListener('touchmove', onTouch, { passive: false })
    canvas.addEventListener('touchend', drop)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number

    const draw = () => {
      frameCount++

      // Process merges at frame start
      while (pendingMerges.length > 0) {
        const { bodyA, bodyB, level } = pendingMerges.shift()!
        const mx = (bodyA.position.x + bodyB.position.x) / 2
        const my = (bodyA.position.y + bodyB.position.y) / 2

        Composite.remove(world, bodyA)
        Composite.remove(world, bodyB)
        mergingIds.delete(bodyA.id)
        mergingIds.delete(bodyB.id)
        ;[bodyA, bodyB].forEach(b => {
          const i = fruitBodies.indexOf(b)
          if (i !== -1) fruitBodies.splice(i, 1)
        })

        const nextLevel = level + 1
        if (nextLevel <= FRUITS.length) {
          const newR  = FRUITS[nextLevel - 1].radius
          const newY  = Math.min(my, GH - WT - newR - 1)
          const nb    = mkFruit(nextLevel, mx, newY)
          fruitBodies.push(nb)
          Composite.add(world, nb)
        }

        scoreVal += MERGE_SCORES[level - 1]
        onScoreRef.current(scoreVal)
      }

      // Game-over detection (after 2s grace period)
      if (!gone && frameCount > 120) {
        const over = fruitBodies.some(b => {
          const lv = parseInt(b.label.slice(1))
          return b.position.y - FRUITS[lv - 1].radius < DANGER_Y
        })
        if (over) { dangerFrames++ } else { dangerFrames = 0 }
        if (dangerFrames > 100) {
          gone = true
          onGameOverRef.current()
        }
      }

      // ── Render ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, GW, GH)

      // BG
      ctx.fillStyle = '#0f0f11'
      ctx.fillRect(0, 0, GW, GH)

      // Danger line
      ctx.strokeStyle = 'rgba(239,68,68,0.25)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.moveTo(WT, DANGER_Y)
      ctx.lineTo(GW - WT, DANGER_Y)
      ctx.stroke()
      ctx.setLineDash([])

      // Walls
      ctx.fillStyle = '#27272a'
      ctx.fillRect(0, 0, WT, GH)
      ctx.fillRect(GW - WT, 0, WT, GH)
      ctx.fillRect(0, GH - FT, GW, FT)
      ctx.strokeStyle = '#3f3f46'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, WT, GH)
      ctx.strokeRect(GW - WT, 0, WT, GH)
      ctx.strokeRect(0, GH - FT, GW, FT)

      // Dropper
      if (!gone) {
        const f = FRUITS[currentLevel - 1]
        const r = f.radius
        const cx = Math.max(WT + r + 2, Math.min(GW - WT - r - 2, dropperX))

        // guide line
        ctx.strokeStyle = 'rgba(161,161,170,0.18)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 5])
        ctx.beginPath()
        ctx.moveTo(cx, DANGER_Y + r * 2)
        ctx.lineTo(cx, GH - WT)
        ctx.stroke()
        ctx.setLineDash([])

        // ghost
        ctx.beginPath()
        ctx.arc(cx, DANGER_Y + r, r, 0, Math.PI * 2)
        ctx.fillStyle = f.color + '44'
        ctx.fill()
        ctx.strokeStyle = f.color + '99'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Fruits
      fruitBodies.forEach(body => {
        const lv = parseInt(body.label.slice(1))
        const f  = FRUITS[lv - 1]
        if (!f) return

        ctx.save()
        ctx.translate(body.position.x, body.position.y)
        ctx.rotate(body.angle)

        ctx.beginPath()
        ctx.arc(0, 0, f.radius, 0, Math.PI * 2)
        ctx.fillStyle = f.color
        ctx.fill()
        ctx.strokeStyle = f.border
        ctx.lineWidth = 2
        ctx.stroke()

        // Level label
        const fontSize = Math.max(9, Math.floor(f.radius * 0.48))
        ctx.font = `bold ${fontSize}px monospace`
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(lv), 0, 0)

        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', drop)
      canvas.removeEventListener('touchmove', onTouch)
      canvas.removeEventListener('touchend', drop)
      Runner.stop(runner)
      Events.off(engine, 'collisionStart')
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="block rounded border border-zinc-800 cursor-crosshair select-none touch-none"
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function SuikaPage() {
  const [score, setScore]         = useState(0)
  const [best, setBest]           = useState(0)
  const [gameOver, setGameOver]   = useState(false)
  const [nextLevel, setNextLevel] = useState(1)
  const [gameKey, setGameKey]     = useState(0)
  const [started, setStarted]     = useState(false)

  const handleGameOver = () => {
    setGameOver(true)
    setBest(b => Math.max(b, score))
  }

  const restart = () => {
    setScore(0)
    setGameOver(false)
    setGameKey(k => k + 1)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <a href="/" className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors">← Home</a>
        <span className="text-zinc-800 text-xs">/</span>
        <span className="text-xs font-mono text-zinc-400">suika</span>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
        {/* Score bar */}
        <div className="flex items-center justify-between w-full max-w-[360px]">
          <div className="text-center">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Score</p>
            <p className="font-mono text-lg text-zinc-100">{score}</p>
          </div>

          {/* Next preview — fixed 56x56 container */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Next</p>
            <div className="w-14 h-14 flex items-center justify-center">
              <div
                className="rounded-full border-2 transition-colors duration-150 flex items-center justify-center"
                style={{
                  width:  Math.min(52, FRUITS[nextLevel - 1].radius * 1.4),
                  height: Math.min(52, FRUITS[nextLevel - 1].radius * 1.4),
                  backgroundColor: FRUITS[nextLevel - 1].color + 'cc',
                  borderColor: FRUITS[nextLevel - 1].border,
                }}
              >
                <span className="font-mono font-bold text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                  {nextLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Best</p>
            <p className="font-mono text-lg text-zinc-500">{best}</p>
          </div>
        </div>

        {/* Game */}
        <div className="relative" style={{ width: GW, height: GH }}>
          {started && (
            <GameCanvas
              key={gameKey}
              onScore={setScore}
              onGameOver={handleGameOver}
              onNextLevel={setNextLevel}
            />
          )}

          {/* Start screen */}
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f11] rounded border border-zinc-800">
              <p className="font-mono text-2xl font-semibold text-zinc-100 mb-2">suika</p>
              <p className="text-xs font-mono text-zinc-600 mb-8">같은 크기끼리 합쳐 더 큰 원을 만드세요</p>
              <div className="flex items-end gap-1 mb-10">
                {FRUITS.slice(0, 6).map((f, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: f.radius * 0.7,
                      height: f.radius * 0.7,
                      backgroundColor: f.color + 'cc',
                      border: `2px solid ${f.border}`,
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setStarted(true)}
                className="font-mono text-sm text-orange-300 border border-orange-400/40 px-8 py-2.5 rounded hover:bg-orange-400/10 transition-colors"
              >
                시작하기
              </button>
            </div>
          )}

          {/* Game over */}
          {started && gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded">
              <p className="font-mono text-xl text-zinc-100 mb-1">GAME OVER</p>
              <p className="font-mono text-sm text-zinc-500 mb-6">score: {score}</p>
              <button
                onClick={restart}
                className="font-mono text-sm text-orange-300 border border-orange-400/40 px-5 py-2 rounded hover:bg-orange-400/10 transition-colors"
              >
                다시하기
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="w-full max-w-[360px] mt-4 space-y-4">
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">이 게임에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            수박게임에서 모티브를 얻었다. 같은 크기의 원끼리 충돌하면 합쳐져 다음 단계로 커진다.
            물리 엔진은 <code className="text-orange-300/80 font-mono">Matter.js</code>를 사용했고,
            충돌 감지는 <code className="text-orange-300/80 font-mono">Events.on(engine, &apos;collisionStart&apos;)</code>로 처리한다.
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {FRUITS.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full border"
                  style={{
                    width: Math.max(12, f.radius * 0.5),
                    height: Math.max(12, f.radius * 0.5),
                    backgroundColor: f.color + 'bb',
                    borderColor: f.border,
                  }}
                />
                <span className="text-[9px] font-mono text-zinc-700">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
