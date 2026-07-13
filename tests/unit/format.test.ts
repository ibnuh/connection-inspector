import { describe, expect, it } from 'vitest'
import {
  formatDevicePixelRatio,
  formatMbps,
  formatMs,
  formatBytes,
  formatNumber
} from '@/utils/format'

describe('formatDevicePixelRatio', () => {
  it('trims float noise', () => {
    expect(formatDevicePixelRatio(2.200000047683716)).toBe('2.2')
  })

  it('keeps clean integers', () => {
    expect(formatDevicePixelRatio(2)).toBe('2')
  })

  it('handles null', () => {
    expect(formatDevicePixelRatio(null)).toBe('Unknown')
  })
})

describe('format helpers', () => {
  it('formats mbps and ms', () => {
    expect(formatMbps(10)).toBe('10 Mbps')
    expect(formatMbps(1.2345)).toBe('1.23 Mbps')
    expect(formatMs(53.7)).toBe('54 ms')
  })

  it('formats bytes', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('formats numbers with max digits', () => {
    expect(formatNumber(1.9999, { maxFractionDigits: 2 })).toBe('2')
  })
})
