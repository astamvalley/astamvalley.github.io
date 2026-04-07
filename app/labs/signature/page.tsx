'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Slider from '@/app/components/Slider'
import ColorPalette, { PALETTE } from '@/app/components/ColorPalette'

const FONT_FAMILY = '"Dancing Script", cursive'
const CANVAS_H    = 220
const PAD         = 28

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

export default function SignaturePage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const ctxRef     = useRef<CanvasRenderingContext2D | null>(null)
  const rafRef     = useRef<number | null>(null)
  const playIdRef  = useRef(0)

  const [text,    setText]    = useState('astamvalley')
  const [color,   setColor]   = useState(PALETTE[0].value)
  const [size,    setSize]    = useState(64)
  const [speed,   setSpeed]   = useState(50)
  const [playing, setPlaying] = useState(false)

  const textRef  = useRef(text)
  const colorRef = useRef(color)
  const sizeRef  = useRef(size)
  const speedRef = useRef(speed)
  useEffect(() => { textRef.current  = text  }, [text])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { sizeRef.current  = size  }, [size])
  useEffect(() => { speedRef.current = speed }, [speed])

  // Load Dancing Script
  useEffect(() => {
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  // Init canvas + draw ghost
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w   = canvas.clientWidth
    canvas.width        = w * dpr
    canvas.height       = CANVAS_H * dpr
    canvas.style.width  = `${w}px`
    canvas.style.height = `${CANVAS_H}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctxRef.current = ctx
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(0, 0, w, CANVAS_H)
  }, [])

  // Redraw ghost when text/color/size change (and no animation is running)
  const drawGhost = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return
    if (rafRef.current !== null) return
    const W = canvas.clientWidth
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(0, 0, W, CANVAS_H)
    ctx.font = `700 ${sizeRef.current}px ${FONT_FAMILY}`
    ctx.globalAlpha = 0.1
    ctx.fillStyle = colorRef.current
    ctx.fillText(textRef.current, PAD, CANVAS_H * 0.68)
    ctx.globalAlpha = 1
  }, [])

  useEffect(() => { drawGhost() }, [text, color, size, drawGhost])

  const play = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx || !textRef.current.trim()) return

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    playIdRef.current++
    const id = playIdRef.current
    setPlaying(true)

    const W   = canvas.clientWidth
    const H   = CANVAS_H
    const t   = textRef.current
    const c   = colorRef.current
    const sz  = sizeRef.current
    const spd = speedRef.current
    const rgb = hexToRgb(c)

    const font   = `700 ${sz}px ${FONT_FAMILY}`
    ctx.font     = font
    const textW  = ctx.measureText(t).width
    const textX  = PAD
    const textY  = H * 0.68

    // text reveal: duration based on speed slider (px/sec ≈ spd * 4)
    const textDuration = (textW / (spd * 4)) * 1000

    const drawGhostLocal = () => {
      ctx.globalAlpha = 0.1
      ctx.font = font
      ctx.fillStyle = c
      ctx.fillText(t, textX, textY)
      ctx.globalAlpha = 1
    }

    // ── Phase 1: text reveal ──────────────────────────────────────────────
    const startText = performance.now()

    const animateText = (now: number) => {
      if (id !== playIdRef.current) return

      const prog    = Math.min((now - startText) / textDuration, 1)
      const revealX = textX + textW * prog

      ctx.fillStyle = '#0d0d0d'
      ctx.fillRect(0, 0, W, H)
      drawGhostLocal()

      // Revealed text clipped
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, revealX, H)
      ctx.clip()
      ctx.font = font
      ctx.fillStyle = c
      ctx.fillText(t, textX, textY)
      ctx.restore()

      // Wet-ink glow at leading edge
      const gY   = textY - sz * 0.22
      const gR   = sz * 0.45
      const grad = ctx.createRadialGradient(revealX, gY, 0, revealX, gY, gR)
      grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.65)`)
      grad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`)
      grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(revealX, gY, gR, 0, Math.PI * 2)
      ctx.fill()

      if (prog < 1) {
        rafRef.current = requestAnimationFrame(animateText)
      } else {
        rafRef.current = null
        // short pause then flourish
        setTimeout(() => {
          if (id !== playIdRef.current) return
          animateFlourish(performance.now())
        }, 180)
      }
    }

    // ── Phase 2: decorative flourish underline ─────────────────────────
    const flourishDuration = Math.max(400, 700 - spd * 3)

    const animateFlourish = (nowStart: number) => {
      const startFlourish = nowStart

      const frame = (now: number) => {
        if (id !== playIdRef.current) return

        const fp = Math.min((now - startFlourish) / flourishDuration, 1)

        ctx.fillStyle = '#0d0d0d'
        ctx.fillRect(0, 0, W, H)

        // Full text (no ghost needed)
        ctx.font = font
        ctx.fillStyle = c
        ctx.fillText(t, textX, textY)

        // Flourish bezier
        const sx   = textX - 6
        const ex   = textX + textW + 14
        const by   = textY + sz * 0.19
        const tx   = ex + sz * 0.45
        const ty   = by - sz * 0.32
        const cp1x = sx + (ex - sx) * 0.28
        const cp1y = by + sz * 0.16
        const cp2x = sx + (ex - sx) * 0.72
        const cp2y = by - sz * 0.09
        const cp3x = ex + sz * 0.06
        const cp3y = by - sz * 0.07
        const cp4x = tx - sz * 0.18
        const cp4y = ty + sz * 0.12

        // Clip to progress
        const clipRight = sx + (tx - sx) * fp + sz * 0.5
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, clipRight, H)
        ctx.clip()

        ctx.beginPath()
        ctx.moveTo(sx, by)
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, by)
        ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, tx, ty)
        ctx.strokeStyle = c
        ctx.lineWidth   = Math.max(sz * 0.04, 1.5)
        ctx.lineCap     = 'round'
        ctx.stroke()
        ctx.restore()

        if (fp < 1) {
          rafRef.current = requestAnimationFrame(frame)
        } else {
          rafRef.current = null
          setPlaying(false)
        }
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(animateText)
  }, [])

  return (
    <>
      <header className="mb-6">
        <h1 className="font-mono text-lg font-semibold text-zinc-100 mb-2">signature</h1>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          텍스트를 흘려 쓰는 서명 애니메이션. 잉크가 번지듯 획이 나타나고, 끝에 장식선이 이어진다.
        </p>
      </header>

      <div className="mb-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 36))}
          placeholder="your signature..."
          spellCheck={false}
          className="w-full bg-transparent border border-zinc-800 focus:border-zinc-600 outline-none font-mono text-sm text-zinc-200 px-3 py-2.5 transition-colors rounded-sm"
        />
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded-sm mb-6 select-none"
        style={{ height: CANVAS_H, background: '#0d0d0d', display: 'block' }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 mb-6">
        <div>
          <Slider label="size"  value={size}  min={32} max={92} onChange={setSize}  unit="px" />
          <Slider label="speed" value={speed} min={10} max={100} onChange={setSpeed} />
        </div>
        <div>
          <ColorPalette color={color} onChange={setColor} label="ink color" />
        </div>
      </div>

      <button
        onClick={play}
        disabled={!text.trim() || playing}
        className="px-6 py-2.5 text-[11px] font-mono border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-orange-400/60 text-orange-300 hover:border-orange-400 hover:text-orange-200"
      >
        {playing ? 'writing...' : '▶  play'}
      </button>
    </>
  )
}
