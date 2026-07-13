import { describe, expect, it } from 'vitest'
import {
  isValidIPv4,
  isValidIPv6,
  isPrivateIP,
  toReverseDnsName,
  scoreIpRisk,
  ipStatusFromInfo,
  evaluateWebRTCExposure,
  expandIPv6,
  normalizeIp,
  isSameIp,
  parseAbuserScoreNumber
} from '@/utils/ip'
import type { IpApiResponse } from '@/types'

describe('isValidIPv4', () => {
  it('accepts normal addresses', () => {
    expect(isValidIPv4('1.2.3.4')).toBe(true)
    expect(isValidIPv4('255.255.255.255')).toBe(true)
  })

  it('rejects out of range and malformed', () => {
    expect(isValidIPv4('1.2.3.256')).toBe(false)
    expect(isValidIPv4('1.2.3')).toBe(false)
    expect(isValidIPv4('abc')).toBe(false)
  })
})

describe('isValidIPv6 / reverse', () => {
  it('accepts compressed and full forms', () => {
    expect(isValidIPv6('2001:db8::1')).toBe(true)
    expect(isValidIPv6('::1')).toBe(true)
    expect(isValidIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true)
  })

  it('builds ip6.arpa names', () => {
    const name = toReverseDnsName('2001:db8::1')
    expect(name).toContain('ip6.arpa')
    expect(name?.startsWith('1.0.0.0.')).toBe(true)
  })

  it('builds in-addr.arpa for IPv4', () => {
    expect(toReverseDnsName('1.2.3.4')).toBe('4.3.2.1.in-addr.arpa')
  })

  it('expands IPv6', () => {
    expect(expandIPv6('2001:db8::1')).toBe('2001:0db8:0000:0000:0000:0000:0000:0001')
  })
})

describe('normalizeIp / isSameIp', () => {
  it('unwraps IPv4-mapped IPv6', () => {
    expect(normalizeIp('::ffff:8.8.8.8')).toBe('8.8.8.8')
    expect(isSameIp('::ffff:8.8.8.8', '8.8.8.8')).toBe(true)
  })

  it('compares expanded IPv6', () => {
    expect(isSameIp('2001:db8::1', '2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true)
  })

  it('strips zone ids', () => {
    expect(normalizeIp('fe80::1%eth0')).toBe(expandIPv6('fe80::1'))
  })
})

describe('isPrivateIP', () => {
  it('detects private ranges including CGNAT', () => {
    expect(isPrivateIP('10.0.0.1')).toBe(true)
    expect(isPrivateIP('192.168.1.1')).toBe(true)
    expect(isPrivateIP('172.16.0.1')).toBe(true)
    expect(isPrivateIP('100.64.1.1')).toBe(true)
    expect(isPrivateIP('8.8.8.8')).toBe(false)
  })
})

describe('parseAbuserScoreNumber', () => {
  it('parses ratios and decimals', () => {
    expect(parseAbuserScoreNumber('1/100')).toBeCloseTo(0.01)
    expect(parseAbuserScoreNumber('0.12')).toBeCloseTo(0.12)
    expect(parseAbuserScoreNumber(0.5)).toBe(0.5)
  })
})

describe('scoreIpRisk', () => {
  it('returns unknown for null', () => {
    expect(scoreIpRisk(null)).toEqual({ score: null, band: 'Unknown' })
  })

  it('scores clean IP as zero low', () => {
    const info: IpApiResponse = { ip: '1.1.1.1' }
    const result = scoreIpRisk(info)
    expect(result.score).toBe(0)
    expect(result.band).toBe('Low')
  })

  it('scores abuser + tor high', () => {
    const info: IpApiResponse = {
      ip: '1.1.1.1',
      is_abuser: true,
      is_tor: true
    }
    const result = scoreIpRisk(info)
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.band).toBe('High')
  })

  it('scores vpn alone as medium-low warning territory', () => {
    const info: IpApiResponse = { ip: '1.1.1.1', is_vpn: true }
    const result = scoreIpRisk(info)
    expect(result.score).toBe(12)
    expect(result.band).toBe('Low')
  })
})

describe('ipStatusFromInfo', () => {
  it('prioritizes abuse over vpn', () => {
    expect(ipStatusFromInfo({ is_abuser: true, is_vpn: true }).label).toBe('Abuse-listed')
  })

  it('labels vpn without calling it abuse', () => {
    expect(ipStatusFromInfo({ is_vpn: true }).label).toBe('VPN')
    expect(ipStatusFromInfo({ is_vpn: true }).tone).toBe('warning')
  })

  it('labels tor exit', () => {
    expect(ipStatusFromInfo({ is_tor: true }).label).toBe('Tor exit')
  })
})

describe('evaluateWebRTCExposure', () => {
  it('flags local exposure', () => {
    const r = evaluateWebRTCExposure(['192.168.1.5'], [], '1.2.3.4')
    expect(r.hasLocalExposure).toBe(true)
    expect(r.hasLeak).toBe(true)
  })

  it('flags public mismatch', () => {
    const r = evaluateWebRTCExposure([], ['9.9.9.9'], '1.2.3.4')
    expect(r.hasPublicMismatch).toBe(true)
    expect(r.hasLeak).toBe(true)
    expect(r.mismatchedPublicIps).toContain('9.9.9.9')
  })

  it('is clean when public matches egress and no local', () => {
    const r = evaluateWebRTCExposure([], ['1.2.3.4'], '1.2.3.4')
    expect(r.hasLeak).toBe(false)
    expect(r.matchingPublicIps).toContain('1.2.3.4')
  })

  it('treats IPv4-mapped match as same egress', () => {
    const r = evaluateWebRTCExposure([], ['::ffff:1.2.3.4'], '1.2.3.4')
    expect(r.hasPublicMismatch).toBe(false)
    expect(r.hasLeak).toBe(false)
  })

  it('does not treat public ICE alone as leak without egress', () => {
    const r = evaluateWebRTCExposure([], ['9.9.9.9'], null)
    expect(r.hasLeak).toBe(false)
    expect(r.hasPublicMismatch).toBe(false)
  })
})
