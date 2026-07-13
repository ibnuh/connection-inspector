import { describe, expect, it } from 'vitest'
import { scoreIpRisk, ipStatusFromInfo } from '@/utils/ip'
import type { IpApiResponse } from '@/types'

/**
 * Risk scoring is pure in utils/ip; useIpData wraps these helpers.
 * These tests lock the product semantics for the score used in the UI.
 */
describe('useIpData risk helpers', () => {
  const base: IpApiResponse = {
    ip: '203.0.113.10',
    is_bogon: false,
    is_mobile: false,
    is_satellite: false,
    is_crawler: false,
    is_datacenter: false,
    is_tor: false,
    is_proxy: false,
    is_vpn: false,
    is_abuser: false,
    company: {
      name: 'Test Company',
      abuser_score: 0.01
    },
    asn: {
      asn: 64500,
      abuser_score: 0.02,
      org: 'Test ASN'
    }
  }

  it('computes low band for clean IP with small abuser scores', () => {
    const { score, band } = scoreIpRisk(base)
    expect(score).not.toBeNull()
    if (score != null) {
      expect(score).toBeLessThan(30)
    }
    expect(band).toBe('Low')
  })

  it('elevates score for vpn + datacenter', () => {
    const { score, band } = scoreIpRisk({
      ...base,
      is_vpn: true,
      is_datacenter: true
    })
    expect(score).toBeGreaterThanOrEqual(20)
    expect(['Low', 'Medium', 'High']).toContain(band)
  })

  it('labels anonymizer signals for proxy/tor/vpn', () => {
    expect(ipStatusFromInfo({ ...base, is_proxy: true }).tone).toBe('danger')
    expect(ipStatusFromInfo({ ...base, is_tor: true }).label).toBe('Anonymizer signals')
  })

  it('labels datacenter as warning', () => {
    const status = ipStatusFromInfo({ ...base, is_datacenter: true })
    expect(status.tone).toBe('warning')
    expect(status.label).toContain('Datacenter')
  })
})
