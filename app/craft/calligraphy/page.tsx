'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Slider from '@/app/components/Slider'
import ColorPalette, { PALETTE } from '@/app/components/ColorPalette'

interface StrokePoint {
  x: number
  y: number
  t: number
  w: number
}

const CANVAS_H = 480

export default function CalligraphyPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const ctxRef     = useRef<CanvasRenderingContext2D | null>(null)
  const dprRef     = useRef(1)
  const drawing    = useRef(false)
  const points     = useRef<StrokePoint[]>([])

  const [maxWidth,  setMaxWidth]  = useState(28)
  const [penAngle,  setPenAngle]  = useState(45)
  const [speedSens, setSpeedSens] = useState(60)
  const [color,     setColor]     = useState(PALETTE[0].value)

  // Keep param refs so callbacks never stale-close over state
  const maxWidthRef  = useRef(maxWidth)
  const penAngleRef  = useRef(penAngle)
  const speedSensRef = useRef(speedSens)
  const colorRef     = useRef(color)
  useEffect(() => { maxWidthRef.current  = maxWidth  }, [maxWidth])
  useEffect(() => { penAngleRef.current  = penAngle  }, [penAngle])
  useEffect(() => { speedSensRef.current = speedSens }, [speedSens])
  useEffect(() => { colorRef.current     = color     }, [color])

  // Init canvas once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    const w = canvas.clientWidth
    const h = CANVAS_H
    canvas.width  = w * dpr
    canvas.height = h * dpr
    canvas.style.width  = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(0, 0, w, h)
    ctxRef.current = ctx
  }, [])

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const drawSegment = useCallback((p0: StrokePoint, p1: StrokePoint, col: string) => {
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.fillStyle = col

    // Circle cap at p0
    ctx.beginPath()
    ctx.arc(p0.x, p0.y, p0.w / 2, 0, Math.PI * 2)
    ctx.fill()

    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 0.5) return

    // Perpendicular unit vector
    const nx = -dy / len
    const ny =  dx / len

    // Filled trapezoid
    ctx.beginPath()
    ctx.moveTo(p0.x + nx * p0.w / 2, p0.y + ny * p0.w / 2)
    ctx.lineTo(p1.x + nx * p1.w / 2, p1.y + ny * p1.w / 2)
    ctx.lineTo(p1.x - nx * p1.w / 2, p1.y - ny * p1.w / 2)
    ctx.lineTo(p0.x - nx * p0.w / 2, p0.y - ny * p0.w / 2)
    ctx.closePath()
    ctx.fill()

    // Circle cap at p1
    ctx.beginPath()
    ctx.arc(p1.x, p1.y, p1.w / 2, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const pos = getPos(e)
    points.current = [{ ...pos, t: Date.now(), w: maxWidthRef.current * 0.3 }]
  }, [getPos])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const pts = points.current
    if (pts.length === 0) return

    const pos  = getPos(e)
    const prev = pts[pts.length - 1]
    const dx   = pos.x - prev.x
    const dy   = pos.y - prev.y
    const dt   = Math.max(Date.now() - prev.t, 1)
    const speed = Math.sqrt(dx * dx + dy * dy) / dt

    const movAngle    = Math.atan2(dy, dx)
    const penRad      = (penAngleRef.current * Math.PI) / 180
    const angleFactor = Math.abs(Math.sin(movAngle - penRad)) * 0.85 + 0.15
    const speedFactor = Math.max(1 - speed / speedSensRef.current, 0.08)

    const targetW = maxWidthRef.current * angleFactor * speedFactor
    const w = prev.w + (targetW - prev.w) * 0.35   // smoothing

    const next: StrokePoint = { ...pos, t: Date.now(), w }
    pts.push(next)
    drawSegment(prev, next, colorRef.current)
  }, [getPos, drawSegment])

  const stopDrawing = useCallback(() => {
    drawing.current = false
    points.current  = []
  }, [])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(0, 0, canvas.clientWidth, CANVAS_H)
  }, [])

  return (
    <>
      <header className="mb-6">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-2">calligraphy</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          붓 각도와 속도에 반응하는 캘리그래피 브러시. 느릴수록 굵어지고, 이동 방향과 펜 각도의 차이로 선 두께가 달라진다.
        </p>
      </header>

      <canvas
        ref={canvasRef}
        className="w-full rounded-sm mb-6 select-none"
        style={{ height: CANVAS_H, background: '#0d0d0d', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
        <div>
          <Slider label="max thickness" value={maxWidth}  min={6}  max={60}  onChange={setMaxWidth}  unit="px" />
          <Slider label="pen angle"     value={penAngle}  min={0}  max={90}  onChange={setPenAngle}  unit="°"  />
          <Slider label="speed sensitivity" value={speedSens} min={10} max={200} onChange={setSpeedSens} />
        </div>
        <div>
          <ColorPalette color={color} onChange={setColor} />
          <button
            onClick={clear}
            className="px-4 py-2 text-[11px] font-mono text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
          >
            clear
          </button>
        </div>
      </div>
    </>
  )
}
