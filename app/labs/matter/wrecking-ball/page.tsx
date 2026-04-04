'use client'

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const LINK_COUNT = 9
const LINK_LEN = 30
const BALL_RADIUS = 30
const BOX_W = 32
const BOX_H = 32
const STACK_COLS = 5
const STACK_ROWS = 7

export default function WreckingBallPage() {
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

    const { Engine, Runner, Bodies, Composite, Constraint, Mouse, MouseConstraint } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } })
    const world = engine.world

    // Floor
    Composite.add(world, Bodies.rectangle(W / 2, H + 25, W * 2, 50, {
      isStatic: true, friction: 0.8, label: 'floor',
    }))

    const anchorX = W * 0.3
    const anchorY = 10

    // Anchor (static, invisible)
    const anchor = Bodies.circle(anchorX, anchorY, 4, {
      isStatic: true,
      collisionFilter: { mask: 0x0000 },
      label: 'anchor',
    })
    Composite.add(world, anchor)

    // Chain links
    const links: Matter.Body[] = []
    for (let i = 0; i < LINK_COUNT; i++) {
      const link = Bodies.rectangle(anchorX, anchorY + (i + 1) * LINK_LEN, 6, LINK_LEN - 4, {
        frictionAir: 0.008,
        density: 0.001,
        collisionFilter: { category: 0x0002, mask: 0x0000 },
        label: 'link',
      })
      links.push(link)
      Composite.add(world, link)
    }

    // Ball
    const ball = Bodies.circle(anchorX, anchorY + (LINK_COUNT + 1) * LINK_LEN + BALL_RADIUS, BALL_RADIUS, {
      restitution: 0.35,
      friction: 0.05,
      density: 0.015,
      collisionFilter: { category: 0x0001, mask: 0x0001 },
      label: 'ball',
    })
    Composite.add(world, ball)

    // Anchor → first link
    Composite.add(world, Constraint.create({
      bodyA: anchor,
      bodyB: links[0],
      pointB: { x: 0, y: -LINK_LEN / 2 },
      length: 2,
      stiffness: 0.9,
    }))
    // Links chain
    for (let i = 0; i < LINK_COUNT - 1; i++) {
      Composite.add(world, Constraint.create({
        bodyA: links[i],
        bodyB: links[i + 1],
        pointA: { x: 0, y: LINK_LEN / 2 },
        pointB: { x: 0, y: -LINK_LEN / 2 },
        length: 2,
        stiffness: 0.85,
      }))
    }
    // Last link → ball
    Composite.add(world, Constraint.create({
      bodyA: links[LINK_COUNT - 1],
      bodyB: ball,
      pointA: { x: 0, y: LINK_LEN / 2 },
      length: 4,
      stiffness: 0.9,
    }))

    // Stack of boxes
    const boxes: Matter.Body[] = []
    const stackX = W * 0.72
    const stackBaseY = H - 20 - BOX_H / 2
    for (let row = 0; row < STACK_ROWS; row++) {
      const offset = row % 2 === 0 ? 0 : BOX_W * 0.5
      for (let col = 0; col < STACK_COLS; col++) {
        const bx = stackX - ((STACK_COLS - 1) / 2) * BOX_W + col * BOX_W + offset
        const by = stackBaseY - row * BOX_H
        const box = Bodies.rectangle(bx, by, BOX_W - 1, BOX_H - 1, {
          restitution: 0.1,
          friction: 0.6,
          collisionFilter: { category: 0x0001, mask: 0x0001 },
          label: 'box',
        })
        boxes.push(box)
        Composite.add(world, box)
      }
    }

    // Mouse
    const mouse = Mouse.create(canvas)
    mouse.pixelRatio = dpr
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.015, damping: 0.1 },
    })
    Composite.add(world, mc)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Floor line
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(0, H - 20)
      ctx.lineTo(W, H - 20)
      ctx.stroke()
      ctx.setLineDash([])

      // Anchor dot
      ctx.fillStyle = 'rgba(251, 146, 60, 0.9)'
      ctx.beginPath()
      ctx.arc(anchor.position.x, anchor.position.y, 5, 0, Math.PI * 2)
      ctx.fill()

      // Chain
      const chainPoints = [anchor, ...links, ball]
      ctx.strokeStyle = 'rgba(161, 161, 170, 0.55)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      chainPoints.forEach((b, i) => {
        if (i === 0) ctx.moveTo(b.position.x, b.position.y)
        else ctx.lineTo(b.position.x, b.position.y)
      })
      ctx.stroke()

      // Ball
      const speed = ball.speed
      const t = Math.min(1, speed / 18)
      const r = Math.round(161 + (251 - 161) * t)
      const g = Math.round(161 + (146 - 161) * t)
      const bv = Math.round(170 + (60 - 170) * t)
      ctx.fillStyle = `rgba(${r},${g},${bv},0.9)`
      ctx.beginPath()
      ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgba(${r},${g},${bv},0.4)`
      ctx.lineWidth = 2
      ctx.stroke()

      // Boxes
      boxes.forEach((box) => {
        const { x, y } = box.position
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(box.angle)
        ctx.fillStyle = 'rgba(228, 228, 231, 0.12)'
        ctx.strokeStyle = 'rgba(228, 228, 231, 0.4)'
        ctx.lineWidth = 1
        ctx.fillRect(-BOX_W / 2, -BOX_H / 2, BOX_W, BOX_H)
        ctx.strokeRect(-BOX_W / 2, -BOX_H / 2, BOX_W, BOX_H)
        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      Runner.stop(runner)
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  }, [])

  return (
    <div>
      <p className="text-xs font-mono text-zinc-600 mb-3">마우스로 공을 잡아서 던지세요</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-grab active:cursor-grabbing"
        style={{ height: 500 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            <code className="text-orange-300/80 font-mono">Constraint</code> 체인으로 연결된 공이 진자처럼 흔들리며 블록 탑을 무너뜨린다.
            링크마다 관절이 있어 자연스럽게 휘어진다.
            마우스로 공을 잡아 원하는 방향으로 던질 수 있다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 체인 링크 연결 (pointA/B로 끝점 지정)
Constraint.create({
  bodyA: links[i],
  bodyB: links[i + 1],
  pointA: { x: 0, y: segLen / 2 },  // 이전 링크 하단
  pointB: { x: 0, y: -segLen / 2 }, // 다음 링크 상단
  stiffness: 0.85,
  length: 2,
})`}</pre>
        </div>
      </div>
    </div>
  )
}
