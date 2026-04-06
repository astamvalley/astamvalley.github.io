'use client'

import { useEffect, useRef } from 'react'

const NUM_BOIDS = 120
const PERCEPTION = 80       // neighbor detection radius
const SEPARATION_DIST = 28  // min distance before separation kicks in
const MAX_SPEED = 3.2
const MIN_SPEED = 1.4
const MAX_FORCE = 0.08

const SEP_WEIGHT = 1.6
const ALI_WEIGHT = 1.0
const COH_WEIGHT = 0.9
const MOUSE_WEIGHT = 2.2
const MOUSE_RADIUS = 120

interface Boid {
  x: number
  y: number
  vx: number
  vy: number
}

function limit(vx: number, vy: number, max: number): [number, number] {
  const mag = Math.sqrt(vx * vx + vy * vy)
  if (mag > max) {
    return [(vx / mag) * max, (vy / mag) * max]
  }
  return [vx, vy]
}

function setMag(vx: number, vy: number, mag: number): [number, number] {
  const m = Math.sqrt(vx * vx + vy * vy)
  if (m === 0) return [0, 0]
  return [(vx / m) * mag, (vy / m) * mag]
}

function steer(boid: Boid, tx: number, ty: number): [number, number] {
  let dx = tx - boid.x
  let dy = ty - boid.y
  ;[dx, dy] = setMag(dx, dy, MAX_SPEED)
  dx -= boid.vx
  dy -= boid.vy
  ;[dx, dy] = limit(dx, dy, MAX_FORCE)
  return [dx, dy]
}

function updateBoids(boids: Boid[], W: number, H: number, mouseX: number, mouseY: number) {
  for (const boid of boids) {
    let sepX = 0, sepY = 0, sepCount = 0
    let aliVX = 0, aliVY = 0, aliCount = 0
    let cohX = 0, cohY = 0, cohCount = 0

    for (const other of boids) {
      if (other === boid) continue
      const dx = other.x - boid.x
      const dy = other.y - boid.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < PERCEPTION) {
        // separation: steer away from very close boids
        if (dist < SEPARATION_DIST && dist > 0) {
          sepX -= dx / dist
          sepY -= dy / dist
          sepCount++
        }
        // alignment: average velocity
        aliVX += other.vx
        aliVY += other.vy
        aliCount++
        // cohesion: average position
        cohX += other.x
        cohY += other.y
        cohCount++
      }
    }

    let fX = 0, fY = 0

    if (sepCount > 0) {
      sepX /= sepCount
      sepY /= sepCount
      ;[sepX, sepY] = setMag(sepX, sepY, MAX_SPEED)
      sepX -= boid.vx
      sepY -= boid.vy
      ;[sepX, sepY] = limit(sepX, sepY, MAX_FORCE)
      fX += sepX * SEP_WEIGHT
      fY += sepY * SEP_WEIGHT
    }

    if (aliCount > 0) {
      aliVX /= aliCount
      aliVY /= aliCount
      ;[aliVX, aliVY] = setMag(aliVX, aliVY, MAX_SPEED)
      aliVX -= boid.vx
      aliVY -= boid.vy
      ;[aliVX, aliVY] = limit(aliVX, aliVY, MAX_FORCE)
      fX += aliVX * ALI_WEIGHT
      fY += aliVY * ALI_WEIGHT
    }

    if (cohCount > 0) {
      cohX /= cohCount
      cohY /= cohCount
      const [cx, cy] = steer(boid, cohX, cohY)
      fX += cx * COH_WEIGHT
      fY += cy * COH_WEIGHT
    }

    // Mouse repulsion
    if (mouseX >= 0) {
      const mdx = boid.x - mouseX
      const mdy = boid.y - mouseY
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
      if (mdist < MOUSE_RADIUS && mdist > 0) {
        const strength = (1 - mdist / MOUSE_RADIUS) * MAX_FORCE * MOUSE_WEIGHT
        fX += (mdx / mdist) * strength * 3
        fY += (mdy / mdist) * strength * 3
      }
    }

    boid.vx += fX
    boid.vy += fY
    ;[boid.vx, boid.vy] = limit(boid.vx, boid.vy, MAX_SPEED)

    // ensure minimum speed
    const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy)
    if (speed < MIN_SPEED) {
      ;[boid.vx, boid.vy] = setMag(boid.vx, boid.vy, MIN_SPEED)
    }

    boid.x += boid.vx
    boid.y += boid.vy

    // wrap edges
    if (boid.x < -10) boid.x = W + 10
    if (boid.x > W + 10) boid.x = -10
    if (boid.y < -10) boid.y = H + 10
    if (boid.y > H + 10) boid.y = -10
  }
}

export default function BoidsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1, y: -1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const setSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    setSize()

    const ro = new ResizeObserver(() => {
      setSize()
      // re-randomize positions on resize
      for (const b of boids) {
        b.x = Math.random() * canvas.width
        b.y = Math.random() * canvas.height
      }
    })
    ro.observe(canvas)

    const W = () => canvas.width
    const H = () => canvas.height

    // Initialize boids
    const boids: Boid[] = Array.from({ length: NUM_BOIDS }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED)
      return {
        x: Math.random() * W(),
        y: Math.random() * H(),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      }
    })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1, y: -1 }
    }
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    const drawBoid = (boid: Boid, hue: number) => {
      const angle = Math.atan2(boid.vy, boid.vx)
      const size = 7
      ctx.save()
      ctx.translate(boid.x, boid.y)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.moveTo(size * 1.6, 0)
      ctx.lineTo(-size * 0.8, size * 0.6)
      ctx.lineTo(-size * 0.4, 0)
      ctx.lineTo(-size * 0.8, -size * 0.6)
      ctx.closePath()
      ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.88)`
      ctx.fill()
      ctx.restore()
    }

    let animId: number

    const loop = () => {
      animId = requestAnimationFrame(loop)
      const w = W()
      const h = H()
      const { x: mx, y: my } = mouseRef.current

      updateBoids(boids, w, h, mx, my)

      // Trail effect
      ctx.fillStyle = 'rgba(10,10,10,0.25)'
      ctx.fillRect(0, 0, w, h)

      for (const boid of boids) {
        const angle = Math.atan2(boid.vy, boid.vx)
        // Map angle (-π to π) to hue (0 to 360)
        const hue = ((angle / Math.PI) * 180 + 180) % 360
        drawBoid(boid, hue)
      }

      // Mouse repulsion indicator
      if (mx >= 0) {
        ctx.beginPath()
        ctx.arc(mx, my, MOUSE_RADIUS, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(251,146,60,0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(mx, my, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(251,146,60,0.4)'
        ctx.fill()
      }
    }

    loop()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      ro.disconnect()
    }
  }, [])

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-mono text-zinc-600">
          마우스를 캔버스 위에 올려 보이드를 흩어뜨린다
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40 select-none"
        style={{ height: 500 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            Craig Reynolds가 1986년 고안한 Boids 알고리즘. 각 개체는 주변 반경 내 이웃만 인식하고, 세 가지 단순한 조향 규칙만 따른다.
            분리(Separation)로 충돌을 피하고, 정렬(Alignment)로 이웃과 방향을 맞추고, 응집(Cohesion)으로 무리 중심으로 모인다.
            전역 지시 없이 새 떼 같은 복잡한 집단 행동이 창발한다. 각 보이드의 색상은 진행 방향에 따라 변한다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// 세 가지 조향 힘 계산 (모든 이웃 순회)
for (const other of boids) {
  const dist = distance(boid, other)
  if (dist < PERCEPTION) {
    // 분리: 너무 가까우면 멀어짐
    if (dist < SEPARATION_DIST) {
      sepX -= (other.x - boid.x) / dist
      sepY -= (other.y - boid.y) / dist
    }
    // 정렬: 평균 속도 방향으로
    aliVX += other.vx;  aliVY += other.vy
    // 응집: 평균 위치로
    cohX += other.x;    cohY += other.y
  }
}

// 힘 적용 후 속도 제한
boid.vx += sep * SEP_WEIGHT + ali * ALI_WEIGHT + coh * COH_WEIGHT
;[boid.vx, boid.vy] = limit(boid.vx, boid.vy, MAX_SPEED)

// 경계 랩어라운드
if (boid.x < -10) boid.x = W + 10`}</pre>
        </div>
      </div>
    </div>
  )
}
