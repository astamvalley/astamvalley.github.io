'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const DOMINO_W = 11
const DOMINO_H = 52
const COUNT = 20

function Simulation({ simKey }: { simKey: number }) {
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

    const { Engine, Runner, Bodies, Body, Composite } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 1.5 } })
    const world = engine.world

    const floor = Bodies.rectangle(W / 2, H + 25, W * 2, 50, {
      isStatic: true, friction: 0.9,
    })
    const wallL = Bodies.rectangle(-25, H / 2, 50, H * 2, { isStatic: true })
    const wallR = Bodies.rectangle(W + 25, H / 2, 50, H * 2, { isStatic: true })
    Composite.add(world, [floor, wallL, wallR])

    const spacing = 30
    const totalWidth = (COUNT - 1) * spacing
    const startX = Math.max(40, (W - totalWidth) / 2)
    const baseY = H - 20 - DOMINO_H / 2

    const dominoes: Matter.Body[] = []
    for (let i = 0; i < COUNT; i++) {
      const d = Bodies.rectangle(startX + i * spacing, baseY, DOMINO_W, DOMINO_H, {
        restitution: 0.05,
        friction: 0.4,
        frictionStatic: 0.5,
        frictionAir: 0.005,
        label: 'domino',
      })
      dominoes.push(d)
    }
    Composite.add(world, dominoes)

    let started = false
    const onClick = () => {
      if (!started) {
        started = true
        Body.applyForce(dominoes[0], { x: dominoes[0].position.x, y: dominoes[0].position.y - DOMINO_H / 3 }, { x: 0.06, y: 0 })
      }
    }
    canvas.addEventListener('click', onClick)

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

      // Hint text if not started
      if (!started) {
        ctx.fillStyle = 'rgba(161, 161, 170, 0.35)'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('클릭하면 시작', W / 2, H / 2 - 60)
      }

      dominoes.forEach((d, i) => {
        const { x, y } = d.position
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(d.angle)

        const tiltAngle = Math.abs(d.angle % (Math.PI * 2))
        const isFalling = tiltAngle > 0.08
        ctx.fillStyle = isFalling
          ? `rgba(251, 146, 60, ${0.55 + Math.min(0.35, tiltAngle)})`
          : 'rgba(228, 228, 231, 0.2)'
        ctx.strokeStyle = isFalling
          ? 'rgba(251, 146, 60, 0.7)'
          : 'rgba(228, 228, 231, 0.45)'
        ctx.lineWidth = 1

        ctx.fillRect(-DOMINO_W / 2, -DOMINO_H / 2, DOMINO_W, DOMINO_H)
        ctx.strokeRect(-DOMINO_W / 2, -DOMINO_H / 2, DOMINO_W, DOMINO_H)

        // Dots
        ctx.fillStyle = isFalling ? 'rgba(255,255,255,0.5)' : 'rgba(100,100,110,0.6)'
        const dotY = -DOMINO_H / 2 + 8
        ctx.beginPath()
        ctx.arc(0, dotY, 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('click', onClick)
      Runner.stop(runner)
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simKey])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-pointer"
      style={{ height: 300 }}
    />
  )
}

export default function DominoPage() {
  const [simKey, setSimKey] = useState(0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-zinc-600">캔버스를 클릭하면 도미노가 쓰러집니다</p>
        <button
          onClick={() => setSimKey(k => k + 1)}
          className="text-xs font-mono text-zinc-500 hover:text-orange-300 border border-zinc-800 hover:border-orange-400/30 px-3 py-1.5 rounded transition-colors"
        >
          리셋
        </button>
      </div>
      <Simulation key={simKey} simKey={simKey} />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            22개의 도미노를 일정 간격으로 세우고, 첫 번째에 작은 힘을 가해 연쇄 반응을 시작한다.
            쓰러지는 도미노는 오렌지색으로 강조된다.
            넘어질 때 다음 도미노 상단에 힘이 전달되도록 <code className="text-orange-300/80 font-mono">applyForce</code> 위치를 상단 1/3 지점으로 지정했다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 도미노 상단 1/3 지점에 힘 적용
Body.applyForce(
  dominoes[0],
  { x: d.position.x, y: d.position.y - H / 3 },
  { x: 0.022, y: 0 }
)

// 마찰력이 높아야 잘 서 있음
Bodies.rectangle(x, y, w, h, {
  friction: 0.7,
  frictionStatic: 0.9,
  restitution: 0.05,
})`}</pre>
        </div>
      </div>
    </div>
  )
}
