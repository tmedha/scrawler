import type { ReactNode } from 'react'

interface IconProps {
  size?: number
}

function base(children: ReactNode, size = 18) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function SelectIcon({ size }: IconProps) {
  return base(<path d="M5 3l4.5 17 2.3-6.9L18.5 11 5 3z" />, size)
}

export function PenIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5z" />
      <path d="M13 6l5 5" />
    </>,
    size
  )
}

export function EraserIcon({ size }: IconProps) {
  return base(
    <>
      <rect x="6.5" y="4.5" width="9" height="15" rx="2" transform="rotate(35 11 12)" />
      <path d="M6 20h13" />
    </>,
    size
  )
}

export function LineIcon({ size }: IconProps) {
  return base(<path d="M4 20L20 4" />, size)
}

export function ArrowIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M4 20L20 4" />
      <path d="M20 11V4h-7" />
    </>,
    size
  )
}

export function RectangleIcon({ size }: IconProps) {
  return base(<rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />, size)
}

export function EllipseIcon({ size }: IconProps) {
  return base(<ellipse cx="12" cy="12" rx="8.5" ry="6.5" />, size)
}

export function TextIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M4 6h16" />
      <path d="M12 6v14" />
    </>,
    size
  )
}

export function LaserIcon({ size }: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
    </>,
    size
  )
}

export function UndoIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M8 7L4 11l4 4" />
      <path d="M4 11h11a5 5 0 010 10h-2" />
    </>,
    size
  )
}

export function RedoIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M16 7l4 4-4 4" />
      <path d="M20 11H9a5 5 0 000 10h2" />
    </>,
    size
  )
}

export function FitContentIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M4 9V5a1 1 0 011-1h4" />
      <path d="M20 9V5a1 1 0 00-1-1h-4" />
      <path d="M4 15v4a1 1 0 001 1h4" />
      <path d="M20 15v4a1 1 0 01-1 1h-4" />
    </>,
    size
  )
}

export function MinusIcon({ size }: IconProps) {
  return base(<path d="M5 12h14" />, size)
}

export function PlusIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>,
    size
  )
}

export function SearchIcon({ size }: IconProps) {
  return base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>,
    size
  )
}

export function DownloadIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M12 4v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </>,
    size
  )
}

export function ShareIcon({ size }: IconProps) {
  return base(
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4" />
    </>,
    size
  )
}

export function ChevronLeftIcon({ size }: IconProps) {
  return base(<path d="M14.5 5L8 12l6.5 7" />, size)
}

export function ChevronRightIcon({ size }: IconProps) {
  return base(<path d="M9.5 5L16 12l-6.5 7" />, size)
}

export function CloseIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>,
    size
  )
}

export function LinesIcon({ size }: IconProps) {
  return base(
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M6.5 9h11M6.5 12.5h11M6.5 16h7" />
    </>,
    size
  )
}

export function ImageIcon({ size }: IconProps) {
  return base(
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5.5-5.5a1.5 1.5 0 012.1 0L20 20" />
    </>,
    size
  )
}

export function UploadIcon({ size }: IconProps) {
  return base(
    <>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </>,
    size
  )
}
