'use client'

import { useEffect, useRef, useState } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '15px monospace'
const LINE_HEIGHT = 26
const PADDING = 20
const MIN_WIDTH = 120
const TEXT = `Reflow happens instantly. Drag the handle to change the text box width and watch the layout recalculate in real time — no DOM reflow, no layout thrashing. Just pure font metrics computed directly from the browser's text engine. This is what makes pretext fast enough to use on every animation frame.`

export default function ReflowPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [textWidth, setTextWidth] = useState(400)
  const [lineCount, setLineCount] = useState(0)
  const [height, setHeight] = useState(0)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    ctx.font = FONT
    const prepared = prepareWithSegments(TEXT, FONT)
    const maxW = Math.min(textWidth, canvas.offsetWidth - PADDING * 2)
    const { lines, lineCount: lc, height: h } = layoutWithLines(prepared, maxW, LINE_HEIGHT)

    setLineCount(lc)
    setHeight(Math.round(h))

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    // draw text box border
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(PADDING - 4, PADDING - 4, maxW + 8, h + 8)
    ctx.setLineDash([])

    // draw lines
    lines.forEach((line, i) => {
      ctx.fillStyle = 'rgba(228, 228, 231, 0.85)'
      ctx.font = FONT
      ctx.fillText(line.text, PADDING, PADDING + LINE_HEIGHT + i * LINE_HEIGHT)
    })

    // draw drag handle
    const handleX = PADDING + maxW + 12
    const handleY = PADDING + h / 2
    ctx.fillStyle = 'rgba(251, 146, 60, 0.8)'
    ctx.beginPath()
    ctx.arc(handleX, handleY, 5, 0, Math.PI * 2)
    ctx.fill()

    // drag handle line
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PADDING + maxW + 4, PADDING - 4)
    ctx.lineTo(PADDING + maxW + 4, PADDING + h + 4)
    ctx.stroke()
  }, [textWidth])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = textWidth
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const maxAllowed = canvas.offsetWidth - PADDING * 2 - 20
      const newW = Math.max(MIN_WIDTH, Math.min(maxAllowed, startW.current + (e.clientX - startX.current)))
      setTextWidth(newW)
    }
    const onUp = () => { dragging.current = false }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div>
      <div className="relative select-none">
        <canvas
          ref={canvasRef}
          className="w-full rounded border border-zinc-800 bg-zinc-900/40"
          style={{ height: 340 }}
        />
        {/* invisible drag target overlay */}
        <div
          onMouseDown={onMouseDown}
          className="absolute top-0 cursor-col-resize"
          style={{
            left: PADDING + textWidth + 4,
            width: 24,
            top: 0,
            bottom: 0,
          }}
        />
      </div>

      <div className="flex gap-6 mt-4">
        <p className="text-xs font-mono text-zinc-600">
          width <span className="text-orange-300/70">{textWidth}px</span>
        </p>
        <p className="text-xs font-mono text-zinc-600">
          lines <span className="text-orange-300/70">{lineCount}</span>
        </p>
        <p className="text-xs font-mono text-zinc-600">
          height <span className="text-orange-300/70">{height}px</span>
        </p>
      </div>

      <div className="mt-10 space-y-8">
        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">이 실험에 대해</p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
            오렌지 핸들을 드래그하면 텍스트 너비가 바뀌고, 매 픽셀마다{' '}
            <code className="text-orange-300/80 font-mono">layoutWithLines()</code>가 호출된다.
            DOM reflow가 전혀 없기 때문에 너비 변화에 따른 라인 수, 높이 변화가 즉각적으로 반영된다.
            이것이 pretext를 만든 핵심 이유다.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest mb-4">핵심 코드</p>
          <pre className="text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded p-4 overflow-x-auto leading-relaxed">{`// prepare는 한 번만 — 텍스트 변경 시에만 재호출
const prepared = prepareWithSegments(text, font)

// layout은 width가 바뀔 때마다 호출 (~0.09ms)
const { lines, lineCount, height } = layoutWithLines(
  prepared,
  newWidth,
  lineHeight
)

// DOM 접근 없이 바로 Canvas에 렌더링
lines.forEach((line, i) => {
  ctx.fillText(line.text, x, y + i * lineHeight)
})`}</pre>
        </div>
      </div>
    </div>
  )
}
