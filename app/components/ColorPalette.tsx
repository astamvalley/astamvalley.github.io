'use client'

export const PALETTE = [
  { label: 'ivory',    value: '#f0ead6' },
  { label: 'gold',     value: '#d4a853' },
  { label: 'ember',    value: '#e05a2b' },
  { label: 'sky',      value: '#5b9bd5' },
  { label: 'sage',     value: '#7aab84' },
  { label: 'lavender', value: '#9b8ec4' },
  { label: 'white',    value: '#ffffff' },
]

export default function ColorPalette({
  color,
  onChange,
  label = 'color',
}: {
  color: string
  onChange: (value: string) => void
  label?: string
}) {
  return (
    <div className="mb-4">
      <span className="text-[11px] font-mono text-zinc-500 block mb-2.5">{label}</span>
      <div className="flex gap-2.5 flex-wrap">
        {PALETTE.map((c) => (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            title={c.label}
            className="w-6 h-6 rounded-full border-2 transition-all"
            style={{
              background:  c.value,
              borderColor: color === c.value ? '#fb923c' : '#3f3f46',
              transform:   color === c.value ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
