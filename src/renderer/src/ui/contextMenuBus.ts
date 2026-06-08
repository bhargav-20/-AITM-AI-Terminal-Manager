import type { MouseEvent } from 'react'

export interface MenuItem {
  label?: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  separator?: boolean
  checked?: boolean
  colorSwatch?: string
  submenu?: MenuItem[]
}

type OpenFn = (x: number, y: number, items: MenuItem[]) => void

let opener: OpenFn | null = null

export function registerContextMenu(fn: OpenFn | null): void {
  opener = fn
}

export function openContextMenu(e: MouseEvent, items: MenuItem[]): void {
  e.preventDefault()
  e.stopPropagation()
  if (items.length) opener?.(e.clientX, e.clientY, items)
}
