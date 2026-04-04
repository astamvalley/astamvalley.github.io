'use client'

import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 28
const PADDING = 24
const BLOCK_W = 110
const BLOCK_H = 130
const TEXT = `Drag the orange block to watch text flow around it in real time. This uses layoutNextLine() — the iterator API that gives each line its own maximum width. Lines that overlap the floating element are laid out narrower. Lines that don't get the full column width. No DOM. No CSS floats. No reflow. Just arithmetic at sixty frames per second, one line at a time.`

export default function FlowPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blockY = useRef(50)
  const dragging = useRef(false)
  const dragOffsetY = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    ctx.font = FONT
    const prepared = prepareWithSegments(TEXT, FONT)
    let animId: number

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      ctx.font = FONT

      const blockX = w - PADDING - BLOCK_W
      const bY = blockY.current

      // Draw floating block
      ctx.fillStyle = 'rgba(251, 146, 60, 0.07)'
      ctx.fillRect(blockX, bY, BLOCK_W, BLOCK_H)
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.35)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.strokeRect(blockX, bY, BLOCK_W, BLOCK_H)
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(251, 146, 60, 0.4)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('drag', blockX + BLOCK_W / 2, bY + BLOCK_H / 2 - 6)
      ctx.fillText('me', blockX + BLOCK_W / 2, bY + BLOCK_H / 2 + 8)
      ctx.textAlign = 'left'
      ctx.font = FONT

      // Flow text around block using layoutNextLine
      let cursor = { segmentIndex: 0, graphemeIndex: 0 }
      let y = PADDING + LINE_HEIGHT

      while (true) {
        const lineTop = y - LINE_HEIGHT + 4
        const lineBottom = y - 4
        const overlapsBlock = lineBottom > bY && lineTop < bY + BLOCK_H

        const maxW = overlapsBlock ? blockX - PADDING - 8 : w - PADDING * 2

        const line = layoutNextLine(prepared, cursor, maxW)
        if (line === null) break

        ctx.fillStyle = 'rgba(228, 228, 231, 0.85)'
        ctx.fillText(line.text, PADDING, y)

        cursor = line.end
        y += LINE_HEIGHT

        if (y > h + LINE_HEIGHT) break
      }

      animId = requestAnimationFrame(draw)
    }

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const blockX = canvas.offsetWidth - PADDING - BLOCK_W
      const bY = blockY.current
      if (mx >= blockX && mx <= blockX + BLOCK_W && my >= bY && my <= bY + BLOCK_H) {
        dragging.current = true
        dragOffsetY.current = my - bY
        canvas.style.cursor = 'grabbing'
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const rect = canvas.getBoundingClientRect()
      const my = e.clientY - rect.top
      const maxY = canvas.offsetHeight - BLOCK_H - PADDING
      blockY.current = Math.max(PADDING, Math.min(maxY, my - dragOffsetY.current))
    }

    const onMouseUp = () => {
      dragging.current = false
      canvas.style.cursor = 'default'
    }

    const onMouseMoveCanvas = (e: MouseEvent) => {
      if (dragging.current) return
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const blockX = canvas.offsetWidth - PADDING - BLOCK_W
      const bY = blockY.current
      const over = mx >= blockX && mx <= blockX + BLOCK_W && my >= bY && my <= bY + BLOCK_H
      canvas.style.cursor = over ? 'grab' : 'default'
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMoveCanvas)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    draw()

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMoveCanvas)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-zinc-800 bg-zinc-900/40"
        style={{ height: 370 }}
      />

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            <code className="text-orange-300/80 font-mono">layoutNextLine()</code>는 줄마다 다른 너비를
            지정할 수 있는 이터레이터 API다. 매 프레임, 각 라인의 y 위치가 블록과 겹치면
            좁은 너비로, 겹치지 않으면 전체 너비로 레이아웃한다.
            커서는{' '}<code className="text-orange-300/80 font-mono">line.end</code>로 다음 줄로 넘어간다.
            DOM reflow 없이 블록 드래그에 즉각 반응한다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`let cursor = { segmentIndex: 0, graphemeIndex: 0 }
let y = PADDING + LINE_HEIGHT

while (true) {
  // 이 라인이 블록과 겹치는지 확인
  const overlaps = lineBottom > blockY && lineTop < blockY + BLOCK_H
  const maxW = overlaps ? blockX - PADDING - 8 : fullWidth

  const line = layoutNextLine(prepared, cursor, maxW)
  if (line === null) break  // 텍스트 소진

  ctx.fillText(line.text, PADDING, y)
  cursor = line.end  // 다음 줄 시작점
  y += LINE_HEIGHT
}`}</pre>
        </div>
      </div>
    </div>
  )
}
