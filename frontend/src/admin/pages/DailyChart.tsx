import { useId } from 'react'
import type { DailyCount } from '../types'

const WIDTH = 560
const HEIGHT = 220
const PAD = { top: 16, right: 12, bottom: 34, left: 32 }

function niceMax(value: number): number {
  if (value <= 4) return 4
  const step = Math.pow(10, Math.floor(Math.log10(value)))
  return Math.ceil(value / step) * step
}

const dayLabel = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' })

// Gráfico de barras en SVG: sin librerías. La tabla oculta da la misma información a lectores de pantalla.
export default function DailyChart({ data }: { data: DailyCount[] }) {
  const titleId = useId()
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const max = niceMax(Math.max(0, ...data.map((item) => item.count)))
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const slot = innerWidth / Math.max(1, data.length)
  const barWidth = Math.min(28, slot * 0.62)
  const ticks = [0, max / 2, max]

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={titleId}
        className="h-auto w-full"
      >
        <title id={titleId}>
          {`Solicitudes por día en los últimos ${data.length} días. Total: ${total}.`}
        </title>
        {ticks.map((tick) => {
          const y = PAD.top + innerHeight - (tick / max) * innerHeight
          return (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#E6DAFB" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#475569">
                {tick}
              </text>
            </g>
          )
        })}
        {data.map((item, index) => {
          const height = (item.count / max) * innerHeight
          const x = PAD.left + slot * index + (slot - barWidth) / 2
          const label = dayLabel.format(new Date(`${item.date}T00:00:00Z`))
          return (
            <g key={item.date}>
              <rect
                x={x}
                y={PAD.top + innerHeight - Math.max(height, item.count > 0 ? 3 : 0)}
                width={barWidth}
                height={Math.max(height, item.count > 0 ? 3 : 0)}
                rx="6"
                fill={item.count > 0 ? '#A98BE0' : '#E6DAFB'}
              >
                <title>{`${label}: ${item.count}`}</title>
              </rect>
              {item.count > 0 && (
                <text x={x + barWidth / 2} y={PAD.top + innerHeight - height - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
                  {item.count}
                </text>
              )}
              {(index % 2 === 0 || index === data.length - 1) && (
                <text x={x + barWidth / 2} y={HEIGHT - 12} textAnchor="middle" fontSize="10.5" fill="#475569">
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className="sr-only">
        <ul>
          {data.map((item) => (
            <li key={item.date}>
              {dayLabel.format(new Date(`${item.date}T00:00:00Z`))}: {item.count}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
