'use client'

import { useEffect, useRef } from 'react'
import Matter from 'matter-js'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const FONT_SIZE = 28
const SPAWN_INTERVAL = 18  // frames between spawns
const MAX_BODIES = 120

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

export default function LettersPage() {
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

    const { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter

    const engine = Engine.create({ gravity: { x: 0, y: 1.5 } })
    const world = engine.world

    // Invisible walls (no floor — letters fall off screen)
    const wallOpts = { isStatic: true, friction: 0.1, restitution: 0.4, collisionFilter: { mask: 0x0001 } }
    const wallL = Bodies.rectangle(-25, H / 2, 50, H * 4, wallOpts)
    const wallR = Bodies.rectangle(W + 25, H / 2, 50, H * 4, wallOpts)
    Composite.add(world, [wallL, wallR])

    // Wiper rod — static, angle controlled by mouse
    const wiper = Bodies.rectangle(W / 2, H / 2, W * 0.65, 6, {
      isStatic: true,
      friction: 0.0,
      restitution: 0.9,
      collisionFilter: { category: 0x0002, mask: 0x0001 },
      label: 'wiper',
    })
    Composite.add(world, wiper)

    // Track mouse for wiper angle
    let mouseX = W / 2
    let mouseY = H / 2
    let prevAngle = 0
    let wiperAngularVel = 0

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    canvas.addEventListener('mousemove', onMouseMove)

    // Letter bodies (dynamic, collide with wiper and walls)
    const letterBodies: Array<Matter.Body & { label: string }> = []
    const charW = FONT_SIZE * 0.6
    const charH = FONT_SIZE * 1.1
    let spawnFrame = 0

    function spawnLetter() {
      const x = Math.random() * (W - 80) + 40
      const y = -20
      const body = Bodies.rectangle(x, y, charW, charH, {
        restitution: 0.5,
        friction: 0.2,
        frictionAir: 0.005,
        angle: (Math.random() - 0.5) * 0.5,
        collisionFilter: { category: 0x0001, mask: 0x0003 },
        label: randomLetter(),
      }) as Matter.Body & { label: string }
      letterBodies.push(body)
      Composite.add(world, body)
    }

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number
    let frame = 0

    const draw = () => {
      frame++

      // Update wiper angle toward mouse
      const targetAngle = Math.atan2(mouseY - H / 2, mouseX - W / 2)
      const angleDelta = targetAngle - prevAngle
      // Normalize delta to [-PI, PI]
      const normalizedDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta))
      wiperAngularVel = normalizedDelta * 0.25
      const newAngle = prevAngle + wiperAngularVel
      Body.setPosition(wiper, { x: W / 2, y: H / 2 })
      Body.setAngle(wiper, newAngle)
      Body.setAngularVelocity(wiper, wiperAngularVel * 3)
      prevAngle = newAngle

      // Spawn letters
      if (frame % SPAWN_INTERVAL === 0 && letterBodies.length < MAX_BODIES) {
        spawnLetter()
      }

      // Remove letters that fell way off screen
      for (let i = letterBodies.length - 1; i >= 0; i--) {
        const b = letterBodies[i]
        if (b.position.y > H + 100) {
          Composite.remove(world, b)
          letterBodies.splice(i, 1)
        }
      }

      // Draw
      ctx.clearRect(0, 0, W, H)

      // Draw wiper rod
      const wx = wiper.position.x
      const wy = wiper.position.y
      const wa = wiper.angle
      const halfLen = W * 0.65 / 2
      ctx.save()
      ctx.translate(wx, wy)
      ctx.rotate(wa)
      ctx.strokeStyle = 'rgba(250, 250, 250, 0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-halfLen, 0)
      ctx.lineTo(halfLen, 0)
      ctx.stroke()
      // Tip dots
      ctx.fillStyle = 'rgba(251, 146, 60, 0.8)'
      ctx.beginPath()
      ctx.arc(-halfLen, 0, 3.5, 0, Math.PI * 2)
      ctx.arc(halfLen, 0, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Draw letters
      ctx.font = `${FONT_SIZE}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      letterBodies.forEach((body) => {
        const { x, y } = body.position
        const speed = body.speed

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(body.angle)

        if (speed > 3) {
          const t = Math.min(1, speed / 22)
          const r = Math.round(228 + (251 - 228) * t)
          const g = Math.round(228 + (146 - 228) * t)
          const b = Math.round(231 + (60 - 231) * t)
          ctx.fillStyle = `rgba(${r},${g},${b},${0.5 + t * 0.45})`
        } else {
          ctx.fillStyle = 'rgba(228, 228, 231, 0.5)'
        }

        ctx.fillText(body.label, 0, 0)
        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMouseMove)
      Runner.stop(runner)
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none"
        style={{ height: 500 }}
      />

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
            알파벳이 위에서 계속 떨어지고, 마우스를 따라 회전하는 와이퍼가 글자들을 튕겨낸다.
            글자 하나하나가 강체(rigid body)로 와이퍼와 충돌한다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 와이퍼 — static body, 매 프레임 마우스 각도로 회전
const angle = Math.atan2(mouseY - cy, mouseX - cx)
Body.setAngle(wiper, angle)
Body.setAngularVelocity(wiper, delta * 3)  // 충격량 전달

// 글자 — 매 N프레임마다 위에서 스폰
const body = Bodies.rectangle(x, -20, w, h, {
  restitution: 0.5,   // 반발계수
  frictionAir: 0.005, // 공기저항 (천천히 떨어짐)
})

// 화면 아래로 나간 글자 제거
if (body.position.y > H + 100) {
  Composite.remove(world, body)
}`}</pre>
        </div>
      </div>
    </div>
  )
}
