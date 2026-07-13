/**
 * Display formatting helpers for UI values that must stay inside tight cards.
 */

/** Format devicePixelRatio (often a float like 2.200000047683716) for display. */
export function formatDevicePixelRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return 'Unknown'
  }
  // Prefer short form: 2, 2.5, 2.2 — avoid float noise
  const rounded = Math.round(value * 100) / 100
  return Number(rounded.toFixed(2)).toString()
}

/** Format a finite number with max fraction digits; returns fallback when missing. */
export function formatNumber(
  value: number | null | undefined,
  options?: { maxFractionDigits?: number; fallback?: string }
): string {
  const fallback = options?.fallback ?? 'Unknown'
  if (value == null || !Number.isFinite(value)) {
    return fallback
  }
  const digits = options?.maxFractionDigits ?? 2
  const rounded = Number(value.toFixed(digits))
  return String(rounded)
}

/** Format downlink Mbps. */
export function formatMbps(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return 'Unknown'
  }
  return `${formatNumber(value, { maxFractionDigits: 2 })} Mbps`
}

/** Format milliseconds. */
export function formatMs(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return 'Unknown'
  }
  return `${Math.round(value)} ms`
}

/** Compact storage size from bytes. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) {
    return 'Unknown'
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
