'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const WALL_COLS = 10
const WALL_ROWS = 8
const BLOCK_W = 38
const BLOCK_H = 22
const FRAGMENT_COUNT = 5
const FRACTURE_SPEED_THRESHOLD = 4.5

export default function FracturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hint, setHint] = useState('마우스로 발사체를 던지세요')

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

    const { Engine, Runner, Bodies, Composite, Events, Mouse, MouseConstraint, Body } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 1 } })
    const world = engine.world

    // Floor & walls
    const wallOpts = { isStatic: true }
    Composite.add(world, [
      Bodies.rectangle(W / 2, H + 25, W * 2, 50, wallOpts),
      Bodies.rectangle(-25, H / 2, 50, H * 2, wallOpts),
      Bodies.rectangle(W + 25, H / 2, 50, H * 2, wallOpts),
    ])

    // Brittle wall blocks
    const blocks: Map<number, Matter.Body> = new Map()
    const fractured = new Set<number>()

    const wallStartX = W * 0.55
    const wallStartY = H - 20 - WALL_ROWS * BLOCK_H
    const wallW = WALL_COLS * BLOCK_W

    const addBlock = (col: number, row: number): Matter.Body => {
      const bx = wallStartX + col * BLOCK_W + BLOCK_W / 2
      const by = wallStartY + row * BLOCK_H + BLOCK_H / 2
      const block = Bodies.rectangle(bx, by, BLOCK_W - 1, BLOCK_H - 1, {
        isStatic: false,
        restitution: 0.05,
        friction: 0.6,
        density: 0.002,
        label: 'block',
      })
      blocks.set(block.id, block)
      Composite.add(world, block)
      return block
    }

    for (let r = 0; r < WALL_ROWS; r++) {
      for (let c = 0; c < WALL_COLS; c++) {
        addBlock(c, r)
      }
    }

    // Projectile ball
    const ball = Bodies.circle(W * 0.15, H * 0.35, 18, {
      restitution: 0.4,
      friction: 0.05,
      density: 0.05,
      label: 'projectile',
      collisionFilter: { category: 0x0001, mask: 0x0001 },
    })
    Composite.add(world, ball)

    // Fracture on high-speed collision
    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair
        const speed = Math.max(bodyA.speed, bodyB.speed)
        if (speed < FRACTURE_SPEED_THRESHOLD) return

        const targets = [bodyA, bodyB].filter(
          (b) => b.label === 'block' && !fractured.has(b.id)
        )
        targets.forEach((target) => {
          fractured.add(target.id)
          Composite.remove(world, target)
          blocks.delete(target.id)

          // Spawn fragments
          for (let i = 0; i < FRAGMENT_COUNT; i++) {
            const angle = (i / FRAGMENT_COUNT) * Math.PI * 2 + Math.random() * 0.5
            const dist = 6 + Math.random() * 8
            const fx = target.position.x + Math.cos(angle) * dist
            const fy = target.position.y + Math.sin(angle) * dist
            const fw = BLOCK_W * (0.2 + Math.random() * 0.35)
            const fh = BLOCK_H * (0.2 + Math.random() * 0.35)

            const frag = Bodies.rectangle(fx, fy, fw, fh, {
              restitution: 0.15,
              friction: 0.5,
              density: 0.001,
              angle: Math.random() * Math.PI,
              label: 'fragment',
            })
            const impulseStrength = (speed / 15) * 0.003
            Body.applyForce(frag, frag.position, {
              x: Math.cos(angle) * impulseStrength,
              y: Math.sin(angle) * impulseStrength - 0.002,
            })
            Composite.add(world, frag)
          }
        })
      })
    })

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
      ctx.strokeStyle = 'rgba(63,63,70,0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(0, H - 20)
      ctx.lineTo(W, H - 20)
      ctx.stroke()
      ctx.setLineDash([])

      const allBodies = Composite.allBodies(world)
      allBodies.forEach((body) => {
        if (body.isStatic) return
        const { x, y } = body.position

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(body.angle)

        if (body.label === 'projectile') {
          const speed = body.speed
          const t = Math.min(1, speed / 15)
          const r = Math.round(161 + (251 - 161) * t)
          const g = Math.round(161 + (146 - 161) * t)
          const bv = Math.round(170 + (60 - 170) * t)
          ctx.beginPath()
          ctx.arc(0, 0, 18, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${bv},0.9)`
          ctx.fill()
          ctx.strokeStyle = `rgba(${r},${g},${bv},0.4)`
          ctx.lineWidth = 2
          ctx.stroke()
        } else if (body.label === 'block') {
          const verts = body.vertices
          ctx.beginPath()
          ctx.moveTo(verts[0].x - x, verts[0].y - y)
          verts.forEach((v) => ctx.lineTo(v.x - x, v.y - y))
          ctx.closePath()
          ctx.fillStyle = 'rgba(228,228,231,0.10)'
          ctx.strokeStyle = 'rgba(228,228,231,0.45)'
          ctx.lineWidth = 1
          ctx.fill()
          ctx.stroke()
        } else if (body.label === 'fragment') {
          const verts = body.vertices
          ctx.beginPath()
          ctx.moveTo(verts[0].x - x, verts[0].y - y)
          verts.forEach((v) => ctx.lineTo(v.x - x, v.y - y))
          ctx.closePath()
          ctx.fillStyle = 'rgba(251,146,60,0.12)'
          ctx.strokeStyle = 'rgba(251,146,60,0.35)'
          ctx.lineWidth = 1
          ctx.fill()
          ctx.stroke()
        }

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
      <p className="text-xs font-mono text-zinc-600 mb-3">발사체를 잡아 던지세요 — 충분한 속도로 충돌하면 블록이 부서집니다</p>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-grab active:cursor-grabbing"
        style={{ height: 480 }}
      />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            충돌 이벤트에서 속도가 임계값({FRACTURE_SPEED_THRESHOLD}px/frame)을 넘으면 블록을 제거하고
            {FRAGMENT_COUNT}개의 파편 바디를 충격 방향으로 생성한다.
            파편에는 <code className="text-orange-300/80 font-mono">Body.applyForce()</code>로 충돌 방향 임펄스를 적용해
            폭발하듯 퍼진다. 파편은 orange-300으로 표시된다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    const speed = Math.max(bodyA.speed, bodyB.speed)
    if (speed < THRESHOLD) return

    // 블록 제거 후 파편 생성
    Composite.remove(world, block)
    for (let i = 0; i < 5; i++) {
      const frag = Bodies.rectangle(fx, fy, fw, fh, { ... })
      Body.applyForce(frag, pos, {
        x: Math.cos(angle) * impulse,
        y: Math.sin(angle) * impulse,
      })
      Composite.add(world, frag)
    }
  })
})`}</pre>
        </div>
      </div>
    </div>
  )
}
