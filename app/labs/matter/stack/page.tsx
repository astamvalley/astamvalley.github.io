'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const SPAWN_INTERVAL = 2200  // ms
const MAX_SHAPES = 80

const COLORS = [
  { fill: 'rgba(251, 146, 60, 0.18)',  stroke: 'rgba(251, 146, 60, 0.65)' },
  { fill: 'rgba(167, 139, 250, 0.18)', stroke: 'rgba(167, 139, 250, 0.65)' },
  { fill: 'rgba(52, 211, 153, 0.18)',  stroke: 'rgba(52, 211, 153, 0.65)' },
  { fill: 'rgba(248, 113, 113, 0.18)', stroke: 'rgba(248, 113, 113, 0.65)' },
  { fill: 'rgba(56, 189, 248, 0.18)',  stroke: 'rgba(56, 189, 248, 0.65)' },
]

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

    const { Engine, Runner, Bodies, Composite } = Matter
    const engine = Engine.create({ gravity: { x: 0, y: 1.4 } })
    const world = engine.world

    // Floor & walls
    Composite.add(world, [
      Bodies.rectangle(W / 2, H + 25, W * 2, 50, { isStatic: true, friction: 0.8 }),
      Bodies.rectangle(-25, H / 2, 50, H * 2, { isStatic: true, friction: 0.5, restitution: 0.3 }),
      Bodies.rectangle(W + 25, H / 2, 50, H * 2, { isStatic: true, friction: 0.5, restitution: 0.3 }),
    ])

    const bodies: Array<Matter.Body & { colorIdx: number }> = []
    let colorIdx = 0

    const spawnShape = () => {
      if (bodies.length >= MAX_SHAPES) return
      const x = 60 + Math.random() * (W - 120)
      const type = Math.floor(Math.random() * 4)
      const size = 14 + Math.random() * 14
      const opts = { restitution: 0.2 + Math.random() * 0.2, friction: 0.4 }
      let body: Matter.Body

      switch (type) {
        case 0: body = Bodies.circle(x, -30, size, opts); break
        case 1: body = Bodies.rectangle(x, -30, size * 1.6, size * 1.6, opts); break
        case 2: body = Bodies.polygon(x, -30, 3, size * 1.1, opts); break
        default: body = Bodies.polygon(x, -30, 6, size, opts); break
      }

      const tagged = body as Matter.Body & { colorIdx: number }
      tagged.colorIdx = colorIdx % COLORS.length
      colorIdx++
      bodies.push(tagged)
      Composite.add(world, body)
    }

    // Initial batch
    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnShape(), i * 300)
    }

    const intervalId = setInterval(spawnShape, SPAWN_INTERVAL)

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

      // Count
      ctx.fillStyle = 'rgba(63, 63, 70, 0.8)'
      ctx.font = '11px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${bodies.length} / ${MAX_SHAPES}`, W - 12, 18)

      bodies.forEach((body) => {
        const color = COLORS[body.colorIdx]
        ctx.save()
        ctx.beginPath()
        body.vertices.forEach((v, i) => {
          if (i === 0) ctx.moveTo(v.x, v.y)
          else ctx.lineTo(v.x, v.y)
        })
        ctx.closePath()
        ctx.fillStyle = color.fill
        ctx.fill()
        ctx.strokeStyle = color.stroke
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      clearInterval(intervalId)
      Runner.stop(runner)
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simKey])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none"
      style={{ height: 520 }}
    />
  )
}

export default function StackPage() {
  const [simKey, setSimKey] = useState(0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-zinc-600">2.2초마다 무작위 도형이 떨어집니다</p>
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
            원, 사각형, 삼각형, 육각형이 2.2초 간격으로 위에서 떨어져 쌓인다.
            80개가 쌓이면 리셋 버튼으로 초기화할 수 있다.
            <code className="text-orange-300/80 font-mono">body.vertices</code>를 사용해
            모든 도형을 동일한 방법으로 렌더링한다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// vertices로 모든 도형 통일 렌더링
ctx.beginPath()
body.vertices.forEach((v, i) => {
  if (i === 0) ctx.moveTo(v.x, v.y)  // 이미 월드 좌표
  else ctx.lineTo(v.x, v.y)
})
ctx.closePath()
ctx.fill()

// polygon으로 n각형 생성
Bodies.polygon(x, y, sides, radius, opts)`}</pre>
        </div>
      </div>
    </div>
  )
}
