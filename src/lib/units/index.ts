import type { Unit } from '../packing'

export function toMm(value: number, unit: Unit) {
  if (!Number.isFinite(value)) return 0
  return unit === 'cm' ? value * 10 : value
}

export function fromMm(mm: number, unit: Unit) {
  if (!Number.isFinite(mm)) return 0
  return unit === 'cm' ? mm / 10 : mm
}

export function formatLength(mm: number, unit: Unit) {
  const v = fromMm(mm, unit)
  const rounded = unit === 'cm' ? Math.round(v * 10) / 10 : Math.round(v)
  const s = Number.isFinite(rounded) ? String(rounded) : '0'
  return s
}

