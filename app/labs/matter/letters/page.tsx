'use client'

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const FONT_SIZE = 28
const LETTER_COUNT = 60

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

export default function LettersPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

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

    const { Engine, Render, Runner, Bodies, Body, World, Mouse, MouseConstraint, Events } = Matter

    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } })
    const world = engine.world

    // Walls
    const wallOpts = { isStatic: true, friction: 0.3, restitution: 0.3 }
    const floor  = Bodies.rectangle(W / 2, H + 25, W * 2, 50, wallOpts)
    const wallL  = Bodies.rectangle(-25, H / 2, 50, H * 2, wallOpts)
    const wallR  = Bodies.rectangle(W + 25, H / 2, 50, H * 2, wallOpts)
    World.add(world, [floor, wallL, wallR])

    // Letter bodies with metadata
    const charSize = FONT_SIZE * 0.55
    const bodies: Array<Matter.Body & { label: string }> = []

    for (let i = 0; i < LETTER_COUNT; i++) {
      const x = Math.random() * (W - 80) + 40
      const y = -Math.random() * H * 1.5 - 40
      const letter = randomLetter()
      const body = Bodies.rectangle(x, y, charSize * 1.1, FONT_SIZE * 1.1, {
        restitution: 0.35,
        friction: 0.4,
        frictionAir: 0.01,
        angle: (Math.random() - 0.5) * Math.PI,
        label: letter,
      }) as Matter.Body & { label: string }
      bodies.push(body)
    }
    World.add(world, bodies)

    // Mouse interaction
    const mouse = Mouse.create(canvas)
    // Correct for DPR
    mouse.pixelRatio = dpr
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    })
    World.add(world, mouseConstraint)

    const runner = Runner.create()
    Runner.run(runner, engine)

    // Render loop
    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      bodies.forEach((body) => {
        const { x, y } = body.position
        const angle = body.angle
        const speed = body.speed

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)

        ctx.font = `${FONT_SIZE}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (speed > 2) {
          const t = Math.min(1, speed / 20)
          const r = Math.round(228 + (251 - 228) * t)
          const g = Math.round(228 + (146 - 228) * t)
          const b = Math.round(231 + (60 - 231) * t)
          ctx.fillStyle = `rgba(${r},${g},${b},${0.5 + t * 0.4})`
        } else {
          ctx.fillStyle = 'rgba(228, 228, 231, 0.55)'
        }

        ctx.fillText(body.label, 0, 0)
        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      Runner.stop(runner)
      Engine.clear(engine)
      World.clear(world, false)
    }
  }, [])

  return (
    <div>
      <div ref={sceneRef}>
        <canvas
          ref={canvasRef}
          className="w-full rounded border border-zinc-800 bg-zinc-900/40 cursor-grab active:cursor-grabbing select-none"
          style={{ height: 480 }}
        />
      </div>

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            <a
              href="https://www.youtube.com/@interactivedeveloper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-300/80 hover:text-orange-300 transition-colors"
            >
              Interactive Developer
            </a>
            의 물리 엔진 포트폴리오를 보고 <code className="text-orange-300/80 font-mono">Matter.js</code>로 재현해봤다.
            알파벳 글자 하나하나를 강체(rigid body)로 생성하고, 중력과 충돌 시뮬레이션을 적용한다.
            마우스로 글자를 잡아서 던지거나 밀 수 있다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 글자 하나 = 물리 강체
const body = Bodies.rectangle(x, y, w, h, {
  restitution: 0.35,  // 반발계수
  friction: 0.4,
  label: 'A',         // 렌더링에 사용
})

// 마우스로 잡기
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: Mouse.create(canvas),
  constraint: { stiffness: 0.2 },
})

// Canvas에 직접 그리기 (Matter 내장 렌더러 미사용)
ctx.translate(body.position.x, body.position.y)
ctx.rotate(body.angle)
ctx.fillText(body.label, 0, 0)`}</pre>
        </div>
      </div>
    </div>
  )
}
