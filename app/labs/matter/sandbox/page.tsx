'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

type ShapeType = 'circle' | 'box' | 'triangle' | 'pentagon'

const SHAPE_COLORS: Record<ShapeType, string> = {
  circle:   'rgba(251, 146, 60,  0.7)',
  box:      'rgba(167, 139, 250, 0.7)',
  triangle: 'rgba(52,  211, 153, 0.7)',
  pentagon: 'rgba(248, 113, 113, 0.7)',
}

function Simulation({ simKey, shape }: { simKey: number; shape: ShapeType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shapeRef = useRef<ShapeType>(shape)
  shapeRef.current = shape

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
    const engine = Engine.create({ gravity: { x: 0, y: 1.5 } })
    const world = engine.world

    // Fixed walls
    const floor = Bodies.rectangle(W / 2, H + 25, W * 2, 50, { isStatic: true, friction: 0.6, label: 'floor' })
    const wallL = Bodies.rectangle(-25, H / 2, 50, H * 2, { isStatic: true, label: 'wall' })
    const wallR = Bodies.rectangle(W + 25, H / 2, 50, H * 2, { isStatic: true, label: 'wall' })
    Composite.add(world, [floor, wallL, wallR])

    const userBodies: Matter.Body[] = []
    const wallSegments: Matter.Body[] = []

    // Draw state
    let drawPath: { x: number; y: number }[] = []
    let isDragging = false
    let dragStartX = 0, dragStartY = 0

    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const spawnShape = (x: number, y: number) => {
      const s = shapeRef.current
      let body: Matter.Body
      const opts = { restitution: 0.35, friction: 0.4, label: s }
      switch (s) {
        case 'circle':   body = Bodies.circle(x, y, 16 + Math.random() * 10, opts); break
        case 'box':      body = Bodies.rectangle(x, y, 28 + Math.random() * 14, 28 + Math.random() * 14, opts); break
        case 'triangle': body = Bodies.polygon(x, y, 3, 20 + Math.random() * 8, opts); break
        case 'pentagon': body = Bodies.polygon(x, y, 5, 18 + Math.random() * 8, opts); break
      }
      userBodies.push(body!)
      Composite.add(world, body!)
    }

    const finishWall = () => {
      if (drawPath.length < 2) return
      for (let i = 0; i < drawPath.length - 1; i++) {
        const a = drawPath[i], b = drawPath[i + 1]
        const cx = (a.x + b.x) / 2
        const cy = (a.y + b.y) / 2
        const len = Math.max(4, Math.hypot(b.x - a.x, b.y - a.y))
        const angle = Math.atan2(b.y - a.y, b.x - a.x)
        const seg = Bodies.rectangle(cx, cy, len, 7, {
          isStatic: true,
          angle,
          friction: 0.5,
          restitution: 0.2,
          label: 'wall-seg',
        })
        wallSegments.push(seg)
        Composite.add(world, seg)
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      const { x, y } = getPos(e)
      isDragging = true
      dragStartX = x
      dragStartY = y
      drawPath = [{ x, y }]
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const { x, y } = getPos(e)
      const last = drawPath[drawPath.length - 1]
      if (Math.hypot(x - last.x, y - last.y) > 10) {
        drawPath.push({ x, y })
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!isDragging) return
      isDragging = false
      const { x, y } = getPos(e)
      const dist = Math.hypot(x - dragStartX, y - dragStartY)
      if (dist < 6) {
        spawnShape(x, y)
      } else {
        finishWall()
      }
      drawPath = []
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)

    const runner = Runner.create()
    Runner.run(runner, engine)

    let animId: number
    const drawCanvas = () => {
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

      // Draw live path preview
      if (isDragging && drawPath.length > 1) {
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        drawPath.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
      }

      // Wall segments
      wallSegments.forEach((seg) => {
        ctx.save()
        ctx.translate(seg.position.x, seg.position.y)
        ctx.rotate(seg.angle)
        const verts = seg.vertices
        const hw = Math.hypot(verts[1].x - verts[0].x, verts[1].y - verts[0].y) / 2
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(-hw, 0)
        ctx.lineTo(hw, 0)
        ctx.stroke()
        ctx.restore()
      })

      // Dynamic shapes
      userBodies.forEach((body) => {
        const label = body.label as ShapeType
        const color = SHAPE_COLORS[label] ?? 'rgba(228, 228, 231, 0.5)'
        ctx.save()
        ctx.beginPath()
        body.vertices.forEach((v, i) => {
          if (i === 0) ctx.moveTo(v.x, v.y)
          else ctx.lineTo(v.x, v.y)
        })
        ctx.closePath()
        ctx.fillStyle = color.replace('0.7', '0.18')
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      })

      animId = requestAnimationFrame(drawCanvas)
    }

    drawCanvas()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      Runner.stop(runner)
      Engine.clear(engine)
      Composite.clear(world, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simKey])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none cursor-crosshair"
      style={{ height: 460 }}
    />
  )
}

export default function SandboxPage() {
  const [simKey, setSimKey] = useState(0)
  const [shape, setShape] = useState<ShapeType>('circle')

  const shapes: ShapeType[] = ['circle', 'box', 'triangle', 'pentagon']
  const labels: Record<ShapeType, string> = { circle: '원', box: '박스', triangle: '삼각형', pentagon: '오각형' }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-xs font-mono text-zinc-600">드래그 → 벽 그리기 / 클릭 → 도형 소환:</span>
        {shapes.map((s) => (
          <button
            key={s}
            onClick={() => setShape(s)}
            className={`text-xs font-mono px-3 py-1 rounded border transition-colors ${
              shape === s
                ? 'border-orange-400/40 text-orange-300 bg-orange-400/10'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {labels[s]}
          </button>
        ))}
        <button
          onClick={() => setSimKey(k => k + 1)}
          className="ml-auto text-xs font-mono text-zinc-500 hover:text-orange-300 border border-zinc-800 hover:border-orange-400/30 px-3 py-1 rounded transition-colors"
        >
          초기화
        </button>
      </div>
      <Simulation key={simKey} simKey={simKey} shape={shape} />
      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            마우스 드래그로 정적 벽(static body)을 직접 그리고,
            클릭으로 물리 도형을 소환해 자신만의 물리 세계를 구성한다.
            드래그 경로를 짧은 사각형 세그먼트로 분해해 벽을 만든다.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 드래그 경로 → 세그먼트 벽
for (let i = 0; i < path.length - 1; i++) {
  const [a, b] = [path[i], path[i+1]]
  const angle = Math.atan2(b.y-a.y, b.x-a.x)
  Bodies.rectangle(midX, midY, len, 7, {
    isStatic: true,
    angle,
  })
}

// 클릭 vs 드래그 구분
const dist = Math.hypot(upX - downX, upY - downY)
if (dist < 6) spawnShape(x, y)  // 클릭
else buildWall(path)             // 드래그`}</pre>
        </div>
      </div>
    </div>
  )
}
