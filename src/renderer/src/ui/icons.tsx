interface IconProps {
  size?: number
  className?: string
}

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export const PinIcon = ({ size = 13, className }: IconProps): React.JSX.Element => (
  <svg {...base(size)} className={className}>
    <path d="M9.5 2 14 6.5l-3 1-2.5 2.5L7 13 3 9l2-1.5L7.5 5l1-3Z" />
    <path d="m3 13 2.8-2.8" />
  </svg>
)

export const PinFilledIcon = ({ size = 13, className }: IconProps): React.JSX.Element => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M9.4 1.6 14.4 6.6l-3.2 1L8.6 10.2 7 13.4 2.6 9l3.2-1.6 2.6-2.6 1-3.2Z" />
    <path d="m2.4 13.6 2.9-2.9" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export const CloseIcon = ({ size = 13, className }: IconProps): React.JSX.Element => (
  <svg {...base(size)} className={className}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
)

export const PlusIcon = ({ size = 13, className }: IconProps): React.JSX.Element => (
  <svg {...base(size)} className={className}>
    <path d="M8 3v10M3 8h10" />
  </svg>
)

export const ChevronIcon = ({ size = 12, className }: IconProps): React.JSX.Element => (
  <svg {...base(size)} className={className}>
    <path d="m6 4 4 4-4 4" />
  </svg>
)

export const SparkIcon = ({ size = 13, className }: IconProps): React.JSX.Element => (
  <svg {...base(size)} className={className}>
    <path d="M8 1.5 9.4 6 14 7.4 9.4 8.8 8 13.4 6.6 8.8 2 7.4 6.6 6 8 1.5Z" />
  </svg>
)
