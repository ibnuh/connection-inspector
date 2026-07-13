import { describe, expect, it } from 'vitest'
import {
  isValidIPv4,
  isValidIPv6,
  isPrivateIP,
  toReverseDnsName,
  scoreIpRisk,
  ipStatusFromInfo,
  evaluateWebRTCExposure,
  expandIPv6
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

describe('isPrivateIP', () => {
  it('detects private ranges', () => {
    expect(isPrivateIP('10.0.0.1')).toBe(true)
    expect(isPrivateIP('192.168.1.1')).toBe(true)
    expect(isPrivateIP('172.16.0.1')).toBe(true)
    expect(isPrivateIP('8.8.8.8')).toBe(false)
  })
})

describe('scoreIpRisk', () => {
  it('returns unknown for null', () => {
    expect(scoreIpRisk(null)).toEqual({ score: null, band: 'Unknown' })
  })

  it('scores normal low', () => {
    const info: IpApiResponse = { ip: '1.1.1.1' }
    const result = scoreIpRisk(info)
    expect(result.score).toBe(5)
    expect(result.band).toBe('Low')
  })

  it('scores abuser + tor high', () => {
    const info: IpApiResponse = {
      ip: '1.1.1.1',
      is_abuser: true,
      is_tor: true
    }
    const result = scoreIpRisk(info)
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.band).toBe('High')
  })

  it('scores vpn as medium-ish', () => {
    const info: IpApiResponse = { ip: '1.1.1.1', is_vpn: true }
    const result = scoreIpRisk(info)
    expect(result.band).toBe('Low')
    expect(result.score).toBe(10)
  })
})

describe('ipStatusFromInfo', () => {
  it('uses anonymizer wording for vpn', () => {
    expect(ipStatusFromInfo({ is_vpn: true }).label).toBe('Anonymizer signals')
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
  })

  it('is clean when public matches egress and no local', () => {
    const r = evaluateWebRTCExposure([], ['1.2.3.4'], '1.2.3.4')
    expect(r.hasLeak).toBe(false)
  })
})
