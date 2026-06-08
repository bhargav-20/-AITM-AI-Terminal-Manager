interface LogoProps {
  size?: number
}

/** App logo — terminal prompt + AI spark on the blue→violet accent squircle. */
export function Logo({ size = 18 }: LogoProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" aria-hidden>
      <defs>
        <linearGradient id="atm-logo" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6ea8fe" />
          <stop offset="0.55" stopColor="#7c8bf5" />
          <stop offset="1" stopColor="#b48ef0" />
        </linearGradient>
      </defs>
      <rect x="112" y="112" width="800" height="800" rx="192" fill="url(#atm-logo)" />
      <path
        d="M388 392 L524 512 L388 632"
        fill="none"
        stroke="#fff"
        strokeWidth="68"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="556" y="600" width="176" height="54" rx="27" fill="#fff" />
      <g transform="translate(704 360) scale(7) translate(-8 -8)" fill="#fff" fillOpacity="0.95">
        <path d="M8 1.5 9.4 6 14 7.4 9.4 8.8 8 13.4 6.6 8.8 2 7.4 6.6 6 8 1.5Z" />
      </g>
    </svg>
  )
}
