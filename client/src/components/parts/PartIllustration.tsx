import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Shapes the drawings come in. Each part maps to one (see illustrations.ts). */
export type IllustrationKind =
  | 'board'
  | 'module'
  | 'gas'
  | 'pir'
  | 'ultrasonic'
  | 'probe'
  | 'dht'
  | 'radio'
  | 'radio-rod'
  | 'display'
  | 'battery'
  | 'brick'
  | 'servo'
  | 'stepper'
  | 'stepper-round'
  | 'relay'
  | 'rfid'
  | 'ethernet'

export interface IllustrationSpec {
  kind: IllustrationKind
  /** PCB / body colour. */
  color: string
  /** Short text printed on the drawing, e.g. "BME280". */
  label: string
  /** Display style for kind "display". */
  screen?: 'oled' | 'lcd' | 'tft' | 'epaper' | 'matrix' | 'segment'
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

function Pins({ x, y, count, gap = 7, vertical = false }: { x: number; y: number; count: number; gap?: number; vertical?: boolean }) {
  return (
    <g fill="#d4b35a">
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={vertical ? x : x + i * gap} y={vertical ? y + i * gap : y} width={3.5} height={3.5} rx={0.6} />
      ))}
    </g>
  )
}

function Label({ x, y, text, size = 9, color = '#ffffff' }: { x: number; y: number; text: string; size?: number; color?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontSize={size} fontWeight={600} fill={color}>
      {text}
    </text>
  )
}

function Chip({ x, y, w = 22, h = 22 }: { x: number; y: number; w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={1.5} fill="#1f2328" stroke="#3b4048" strokeWidth={0.8} />
}

/** A small breakout board: coloured PCB, header pins along the bottom, label on top. */
function Pcb({ x, y, w, h, color, pins, children }: { x: number; y: number; w: number; h: number; color: string; pins: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={color} />
      <circle cx={x + 6} cy={y + 6} r={2.6} fill="#0003" />
      <circle cx={x + w - 6} cy={y + 6} r={2.6} fill="#0003" />
      {children}
      <Pins x={x + (w - (pins - 1) * 7 - 3.5) / 2} y={y + h - 8} count={pins} />
    </g>
  )
}

function Drawing({ spec }: { spec: IllustrationSpec }) {
  const { kind, color, label } = spec
  switch (kind) {
    case 'board':
      return (
        <g>
          <rect x={14} y={34} width={132} height={52} rx={4} fill={color} />
          <Pins x={22} y={37} count={17} />
          <Pins x={22} y={79.5} count={17} />
          <rect x={4} y={50} width={14} height={20} rx={2} fill="#c9ced6" />
          <Chip x={66} y={46} w={30} h={28} />
          <Label x={81} y={63} text={label} size={7} />
        </g>
      )
    case 'module':
      return (
        <Pcb x={40} y={22} w={80} h={76} color={color} pins={Math.min(8, Math.max(4, Math.round(label.length / 1.5)))}>
          <Chip x={66} y={34} w={28} h={24} />
          <Label x={80} y={76} text={label} />
        </Pcb>
      )
    case 'gas':
      return (
        <Pcb x={38} y={20} w={84} h={82} color={color} pins={4}>
          <circle cx={80} cy={50} r={22} fill="#b7bcc4" />
          <circle cx={80} cy={50} r={17} fill="none" stroke="#8a9099" strokeWidth={1.2} strokeDasharray="2 2" />
          <circle cx={80} cy={50} r={10} fill="none" stroke="#8a9099" strokeWidth={1.2} strokeDasharray="2 2" />
          <Label x={80} y={86} text={label} />
        </Pcb>
      )
    case 'pir':
      return (
        <g>
          <rect x={34} y={30} width={92} height={70} rx={4} fill={color} />
          <path d="M48 64 a32 32 0 0 1 64 0 Z" fill="#f4f4f2" />
          <path d="M56 64 a24 24 0 0 1 48 0" fill="none" stroke="#d9d9d4" strokeWidth={1.5} />
          <path d="M66 64 a14 14 0 0 1 28 0" fill="none" stroke="#d9d9d4" strokeWidth={1.5} />
          <Label x={80} y={86} text={label} />
        </g>
      )
    case 'ultrasonic':
      return (
        <g>
          <rect x={14} y={34} width={132} height={56} rx={4} fill={color} />
          {[46, 114].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy={60} r={22} fill="#c9ced6" />
              <circle cx={cx} cy={60} r={16} fill="#3a3f47" />
              <circle cx={cx} cy={60} r={12} fill="none" stroke="#5b616b" strokeWidth={1} strokeDasharray="1.5 1.5" />
            </g>
          ))}
          <Label x={80} y={84} text={label} size={8} />
          <Pins x={66} y={36} count={4} />
        </g>
      )
    case 'probe':
      return (
        <g>
          <path d="M20 82 C 50 82, 60 46, 92 46" fill="none" stroke="#1f2328" strokeWidth={5} strokeLinecap="round" />
          <rect x={90} y={39} width={52} height={14} rx={7} fill="#c9ced6" stroke="#9aa1ab" />
          <Label x={58} y={100} text={label} color="#4b5563" />
        </g>
      )
    case 'dht':
      return (
        <g>
          <rect x={50} y={16} width={60} height={70} rx={4} fill={color} />
          <g fill="#0002">
            {Array.from({ length: 4 }, (_, r) =>
              Array.from({ length: 3 }, (_, c) => <rect key={`${r}-${c}`} x={58 + c * 16} y={24 + r * 12} width={12} height={7} rx={1} />),
            )}
          </g>
          <Label x={80} y={80} text={label} size={8} color="#1f2328" />
          <g fill="#c9ced6">
            {[60, 70, 80, 90].map((x) => (
              <rect key={x} x={x} y={86} width={3} height={18} />
            ))}
          </g>
        </g>
      )
    case 'radio':
    case 'radio-rod':
      return (
        <g>
          <Pcb x={28} y={30} w={86} h={66} color={color} pins={6}>
            <rect x={44} y={42} width={40} height={26} rx={2} fill="#c9ced6" />
            <Label x={64} y={84} text={label} size={8} />
            {kind === 'radio' && <path d="M92 40 h14 v8 h-14 v8 h14 v8 h-14" fill="none" stroke="#d4b35a" strokeWidth={2} />}
          </Pcb>
          {kind === 'radio-rod' && (
            <g>
              <rect x={114} y={56} width={10} height={10} fill="#d4b35a" />
              <rect x={124} y={16} width={8} height={56} rx={4} fill="#1f2328" />
            </g>
          )}
        </g>
      )
    case 'display': {
      const s = spec.screen ?? 'oled'
      const glass = { oled: '#0b0d10', lcd: '#3d6fd6', tft: '#14161a', epaper: '#e8e6df', matrix: '#141414', segment: '#141414' }[s]
      return (
        <g>
          <rect x={22} y={22} width={116} height={78} rx={4} fill={color} />
          <Pins x={58} y={25} count={6} />
          <rect x={32} y={34} width={96} height={52} rx={2} fill={glass} />
          {s === 'oled' && <Label x={80} y={64} text={label} size={9} color="#59b8ff" />}
          {s === 'lcd' && <Label x={80} y={64} text={label} size={9} color="#e6f0ff" />}
          {s === 'epaper' && <Label x={80} y={64} text={label} size={9} color="#1f2328" />}
          {s === 'tft' && (
            <g>
              <rect x={38} y={40} width={26} height={18} fill="#f97316" />
              <rect x={68} y={40} width={26} height={18} fill="#22c55e" />
              <rect x={98} y={40} width={24} height={18} fill="#3b82f6" />
              <Label x={80} y={76} text={label} size={8} />
            </g>
          )}
          {s === 'matrix' && (
            <g fill="#ef4444">
              {Array.from({ length: 6 }, (_, r) => Array.from({ length: 12 }, (_, c) => <circle key={`${r}-${c}`} cx={38 + c * 7.8} cy={40 + r * 8} r={2.4} opacity={(r + c) % 3 ? 1 : 0.35} />))}
            </g>
          )}
          {s === 'segment' && <Label x={80} y={70} text="12:34" size={22} color="#ef4444" />}
          {(s === 'matrix' || s === 'segment') && <Label x={80} y={96} text={label} size={7} />}
        </g>
      )
    }
    case 'battery':
      return (
        <g>
          <rect x={30} y={44} width={100} height={36} rx={6} fill={color} />
          <rect x={130} y={54} width={6} height={16} rx={1.5} fill="#c9ced6" />
          <rect x={30} y={44} width={16} height={36} rx={6} fill="#0002" />
          <Label x={86} y={66} text={label} size={9} />
        </g>
      )
    case 'brick':
      return (
        <g>
          <rect x={46} y={30} width={68} height={50} rx={3} fill={color} />
          <Label x={80} y={60} text={label} size={8} color="#facc15" />
          <g fill="#c9ced6">
            {[56, 68, 92, 104].map((x) => (
              <rect key={x} x={x} y={80} width={3} height={14} />
            ))}
          </g>
        </g>
      )
    case 'servo':
      return (
        <g>
          <rect x={18} y={50} width={124} height={12} rx={3} fill={color} />
          <rect x={36} y={36} width={88} height={52} rx={4} fill={color} />
          <circle cx={58} cy={36} r={12} fill={color} />
          <circle cx={58} cy={36} r={5} fill="#f4f4f2" />
          <path d="M58 28 L 102 32 L 102 40 L 58 44 Z" fill="#f4f4f2" />
          <Label x={86} y={74} text={label} size={9} />
          <path d="M124 76 C 136 80, 140 96, 150 100" fill="none" stroke="#f97316" strokeWidth={3} />
        </g>
      )
    case 'stepper':
      return (
        <g>
          <rect x={42} y={22} width={76} height={76} rx={8} fill="#2b2f36" />
          <rect x={48} y={28} width={64} height={64} rx={4} fill="#3a3f47" />
          <circle cx={80} cy={60} r={14} fill="#c9ced6" />
          <circle cx={80} cy={60} r={4} fill="#6b7280" />
          <Label x={80} y={108} text={label} size={8} color="#4b5563" />
        </g>
      )
    case 'stepper-round':
      return (
        <g>
          <circle cx={74} cy={60} r={36} fill={color} />
          <rect x={30} y={56} width={88} height={8} rx={3} fill={color} />
          <circle cx={74} cy={44} r={8} fill="#c9ced6" />
          <rect x={102} y={46} width={30} height={30} rx={3} fill="#2563eb" />
          <Label x={74} y={74} text={label} size={8} />
        </g>
      )
    case 'relay':
      return (
        <Pcb x={22} y={26} w={116} h={72} color={color} pins={4}>
          <rect x={34} y={36} width={38} height={30} rx={2} fill="#1d4ed8" />
          <rect x={88} y={36} width={38} height={30} rx={2} fill="#1d4ed8" />
          <Label x={80} y={82} text={label} size={8} />
        </Pcb>
      )
    case 'rfid':
      return (
        <Pcb x={30} y={18} w={100} h={86} color={color} pins={8}>
          <rect x={40} y={28} width={80} height={52} rx={6} fill="none" stroke="#d4b35a" strokeWidth={2} />
          <rect x={47} y={35} width={66} height={38} rx={4} fill="none" stroke="#d4b35a" strokeWidth={2} />
          <Label x={80} y={58} text={label} size={8} />
        </Pcb>
      )
    case 'ethernet':
      return (
        <Pcb x={26} y={26} w={108} h={72} color={color} pins={6}>
          <rect x={86} y={34} width={42} height={38} rx={2} fill="#c9ced6" />
          <rect x={96} y={44} width={22} height={18} fill="#3a3f47" />
          <Chip x={44} y={40} w={26} h={24} />
          <Label x={57} y={82} text={label} size={8} />
        </Pcb>
      )
  }
}

/** Original drawing of a part, used when there's no freely licensed photo. */
export function PartIllustration({ spec, className }: { spec: IllustrationSpec; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn('h-full w-full', className)} role="img" aria-label={`Drawing of ${spec.label}`}>
      <Drawing spec={spec} />
    </svg>
  )
}
