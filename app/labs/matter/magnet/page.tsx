'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const BALL_COUNT = 65
const BALL_RADIUS = 7

export default function MagnetPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [attracting, setAttracting] = useState(true)
  const attractRef = useRef(true)

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

    const { Engine, Runner, Bodies, Body, Composite } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 0.3 } })
    const world = engine.world

    // Floor & walls
    const wallOpts = { isStatic: true, friction: 0.3, restitution: 0.6 }
    Composite.add(world, [
      Bodies.rectangle(W / 2, H + 25, W * 2, 50, wallOpts),
      Bodies.rectangle(-25, H / 2, 50, H * 2, wallOpts),
      Bodies.rectangle(W + 25, H / 2, 50, H * 2, wallOpts),
      Bodies.rectangle(W / 2, -25, W * 2, 50, wallOpts),
    ])

    // Scatter balls
    const balls: Matter.Body[] = []
    for (let i = 0; i < BALL_COUNT; i++) {
      const x = 40 + Math.random() * (W - 80)
      const y = 40 + Math.random() * (H - 80)
      const r = BALL_RADIUS - 1 + Math.random() * 3
      const ball = Bodies.circle(x, y, r, {
        restitution: 0.5,
        friction: 0.05,
        frictionAir: 0.015,
        label: 'ball',
      })
      balls.push(ball)
    }
    Composite.add(world, balls)

    let mouseX = W / 2
    let mouseY = H / 2
    let isMouseOnCanvas = false

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
      isMouseOnCanvas = true
    }
    const onMouseLeave = () => { isMouseOnCanvas = false }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number
    let frame = 0

    const draw = () => {
      frame++

      if (isMouseOnCanvas) {
        const sign = attractRef.current ? 1 : -1
        balls.forEach((b) => {
          const dx = mouseX - b.position.x
          const dy = mouseY - b.position.y
          const dist = Math.max(5, Math.sqrt(dx * dx + dy * dy))
          const strength = sign * 0.0028 * (b.mass ?? 1) / Math.max(30, dist)
          Body.applyForce(b, b.position, {
            x: (dx / dist) * strength,
            y: (dy / dist) * strength,
          })
        })
      }

      ctx.clearRect(0, 0, W, H)

      // Magnet indicator
      if (isMouseOnCanvas) {
        const color = attractRef.current
          ? 'rgba(251, 146, 60, 0.12)'
          : 'rgba(96, 165, 250, 0.12)'
        const strokeColor = attractRef.current
          ? 'rgba(251, 146, 60, 0.3)'
          : 'rgba(96, 165, 250, 0.3)'
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 80, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1
        ctx.setLineDash([3, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Center cross
        ctx.strokeStyle = attractRef.current
          ? 'rgba(251, 146, 60, 0.6)'
          : 'rgba(96, 165, 250, 0.6)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(mouseX - 6, mouseY)
        ctx.lineTo(mouseX + 6, mouseY)
        ctx.moveTo(mouseX, mouseY - 6)
        ctx.lineTo(mouseX, mouseY + 6)
        ctx.stroke()
      }

      balls.forEach((b) => {
        const { x, y } = b.position
        const speed = b.speed
        const t = Math.min(1, speed / 15)

        let r: number, g: number, bv: number
        if (attractRef.current) {
          r = Math.round(161 + (251 - 161) * t)
          g = Math.round(161 + (146 - 161) * t)
          bv = Math.round(170 + (60 - 170) * t)
        } else {
          r = Math.round(161 + (96 - 161) * t)
          g = Math.round(161 + (165 - 161) * t)
          bv = Math.round(170 + (250 - 170) * t)
        }

        ctx.fillStyle = `rgba(${r},${g},${bv},${0.5 + t * 0.4})`
        ctx.beginPath()
        ctx.arc(x, y, b.circleRadius ?? BALL_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      })

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

  const toggle = () => {
    attractRef.current = !attractRef.current
    setAttracting(a => !a)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs font-mono text-zinc-600">마우스를 올려보세요</p>
        <button
          onClick={toggle}
          className={`ml-auto text-xs font-mono px-3 py-1.5 rounded border transition-colors ${
            attracting
              ? 'border-orange-400/40 text-orange-300 bg-orange-400/10'
              : 'border-blue-400/40 text-blue-300 bg-blue-400/10'
          }`}
        >
          {attracting ? '인력 (당기기)' : '척력 (밀기)'}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-crosshair"
        style={{ height: 460 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            마우스 위치가 자석처럼 작용한다. 매 프레임 각 공에
            마우스 방향으로 힘을 가해 인력/척력을 구현한다.
            거리가 가까울수록 힘이 강해진다. 버튼으로 인력↔척력을 전환.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 매 프레임: 마우스 방향으로 힘 적용
const sign = attracting ? 1 : -1
const dx = mouseX - body.position.x
const dist = Math.max(5, Math.hypot(dx, dy))
const strength = sign * 0.0028 / Math.max(30, dist)

Body.applyForce(body, body.position, {
  x: (dx / dist) * strength,
  y: (dy / dist) * strength,
})`}</pre>
        </div>
      </div>
    </div>
  )
}
