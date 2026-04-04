'use client'

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const COLS = 18
const ROWS = 12

export default function ClothPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const { Engine, Runner, Bodies, Body, Composite, Constraint } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 0.9 } })
    const world = engine.world

    const padX = 40
    const spacingX = (W - padX * 2) / (COLS - 1)
    const spacingY = 26
    const startY = 36

    const particles: Matter.Body[][] = []
    for (let row = 0; row < ROWS; row++) {
      particles[row] = []
      for (let col = 0; col < COLS; col++) {
        const x = padX + col * spacingX
        const y = startY + row * spacingY
        const pinned = row === 0 && (col === 0 || col === COLS - 1 || col === Math.floor(COLS / 2))
        const p = Bodies.circle(x, y, 3, {
          isStatic: pinned,
          collisionFilter: { category: 0x0002, mask: 0x0000 },
          frictionAir: 0.025,
        })
        particles[row][col] = p
        Composite.add(world, p)
      }
    }

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (col < COLS - 1) {
          Composite.add(world, Constraint.create({
            bodyA: particles[row][col],
            bodyB: particles[row][col + 1],
            length: spacingX,
            stiffness: 0.6,
            damping: 0.08,
          }))
        }
        if (row < ROWS - 1) {
          Composite.add(world, Constraint.create({
            bodyA: particles[row][col],
            bodyB: particles[row + 1][col],
            length: spacingY,
            stiffness: 0.6,
            damping: 0.08,
          }))
        }
      }
    }

    let mouseX = W / 2
    let mouseY = H * 2

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    const onMouseLeave = () => { mouseY = H * 2 }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number
    let frame = 0

    const draw = () => {
      frame++

      for (let row = 1; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const p = particles[row][col]
          const dx = p.position.x - mouseX
          const dy = p.position.y - mouseY
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
          const influence = Math.max(0, 1 - dist / 120)
          if (influence > 0) {
            Body.applyForce(p, p.position, {
              x: (dx / dist) * influence * 0.00018,
              y: (dy / dist) * influence * 0.0001,
            })
          }
          // ambient wind
          Body.applyForce(p, p.position, {
            x: Math.sin(frame * 0.012 + col * 0.4) * 0.00005,
            y: 0,
          })
        }
      }

      ctx.clearRect(0, 0, W, H)

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const p = particles[row][col]
          const alpha = 0.22 + (row / ROWS) * 0.5
          if (col < COLS - 1) {
            const p2 = particles[row][col + 1]
            ctx.beginPath()
            ctx.moveTo(p.position.x, p.position.y)
            ctx.lineTo(p2.position.x, p2.position.y)
            ctx.strokeStyle = `rgba(228, 228, 231, ${alpha})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
          if (row < ROWS - 1) {
            const p2 = particles[row + 1][col]
            ctx.beginPath()
            ctx.moveTo(p.position.x, p.position.y)
            ctx.lineTo(p2.position.x, p2.position.y)
            ctx.strokeStyle = `rgba(228, 228, 231, ${alpha})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
          if (p.isStatic) {
            ctx.fillStyle = 'rgba(251, 146, 60, 0.9)'
            ctx.beginPath()
            ctx.arc(p.position.x, p.position.y, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      Runner.stop(runner)
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-crosshair"
        style={{ height: 420 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            격자 파티클을 <code className="text-orange-300/80 font-mono">Constraint</code>로 연결해 천을 시뮬레이션한다.
            상단 3개 포인트가 고정되고, 나머지는 중력과 주변 바람에 흔들린다.
            마우스를 가까이 가져가면 그 방향으로 바람이 분다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 격자 파티클 간 Constraint 연결
Constraint.create({
  bodyA: particles[row][col],
  bodyB: particles[row][col + 1],
  length: spacingX,
  stiffness: 0.6,   // 낮을수록 더 흐물흐물
})

// 마우스 위치 기반 척력
const dist = distance(particle, mouse)
const influence = Math.max(0, 1 - dist / 120)
Body.applyForce(p, p.position, {
  x: (dx / dist) * influence * 0.00018,
})`}</pre>
        </div>
      </div>
    </div>
  )
}
