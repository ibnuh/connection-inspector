import { describe, expect, it } from 'vitest'
import {
  formatConnectionTransport,
  formatEffectiveType,
  formatConnectionSummary,
  formatIpNetworkContext
} from '@/utils/connection'

describe('formatConnectionTransport', () => {
  it('labels wifi and ethernet', () => {
    expect(formatConnectionTransport('wifi')).toBe('Wi‑Fi')
    expect(formatConnectionTransport('ethernet')).toBe('Ethernet')
    expect(formatConnectionTransport('cellular')).toBe('Cellular')
  })

  it('handles missing', () => {
    expect(formatConnectionTransport(null)).toBe('Not reported')
  })
})

describe('formatEffectiveType', () => {
  it('does not present 4g as bare cellular radio', () => {
    expect(formatEffectiveType('4g')).toBe('4G-class (fast)')
    expect(formatEffectiveType('4g')).not.toBe('4G')
  })

  it('labels slower classes', () => {
    expect(formatEffectiveType('3g')).toBe('3G-class')
    expect(formatEffectiveType('slow-2g')).toBe('Slow 2G-class')
  })
})

describe('formatConnectionSummary', () => {
  it('prefers transport over effectiveType', () => {
    expect(formatConnectionSummary({ transport: 'wifi', effectiveType: '4g' })).toBe('Wi‑Fi')
  })

  it('falls back to effectiveType when transport missing', () => {
    expect(formatConnectionSummary({ transport: null, effectiveType: '4g' })).toBe(
      '4G-class (fast)'
    )
  })
})

describe('formatIpNetworkContext', () => {
  it('uses IP flags only', () => {
    expect(formatIpNetworkContext({ isMobile: true })).toBe('Mobile carrier IP')
    expect(formatIpNetworkContext({ isDatacenter: true })).toBe('Datacenter / hosting IP')
    expect(formatIpNetworkContext({})).toBe('Residential / other IP')
  })
})
