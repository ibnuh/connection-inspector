import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  normalizeIpQueryResponse,
  normalizeIpApiIsResponse,
  parseAsnNumber,
  scoreIpRisk
} from '@/utils/ip'
import { fetchIpInfoWithFallback } from '@/composables/useIpData'
import type { IpApiResponse } from '@/types'

const IPQUERY_GOOGLE: unknown = {
  ip: '8.8.8.8',
  isp: { asn: 'AS15169', org: 'Google LLC', isp: 'Google LLC' },
  location: {
    country: 'United States',
    country_code: 'US',
    city: 'Mountain View',
    state: 'California',
    zipcode: '94043',
    latitude: 37.436,
    longitude: -122.093,
    timezone: 'America/Los_Angeles',
    localtime: '2026-10-04T20:43:22'
  },
  risk: {
    is_mobile: false,
    is_vpn: false,
    is_tor: false,
    is_proxy: false,
    is_datacenter: true,
    risk_score: 20
  }
}

const IPQUERY_SELF: unknown = {
  ip: '14.100.70.52',
  isp: {
    asn: 'AS9506',
    org: 'Singapore Telecommunications Ltd, Magix Services',
    isp: 'SINGTEL MOBILE Singapore'
  },
  location: {
    country: 'Singapore',
    country_code: 'SG',
    city: 'Singapore (Orchard)',
    state: '',
    zipcode: '238896',
    latitude: 1.3134,
    longitude: 103.8301,
    timezone: 'Asia/Singapore',
    localtime: '2026-10-05T11:43:21'
  },
  risk: {
    is_mobile: true,
    is_vpn: false,
    is_tor: false,
    is_proxy: false,
    is_datacenter: false,
    risk_score: 0
  }
}

const IPQUERY_BOGON: unknown = {
  ip: '192.168.1.1',
  isp: { asn: 'AS0', org: '', isp: '' },
  location: {
    country: '',
    country_code: '',
    city: '',
    state: '',
    zipcode: '',
    latitude: 0.014,
    longitude: -0.008,
    timezone: '',
    localtime: '2026-10-05T03:43:43'
  },
  risk: {
    is_mobile: false,
    is_vpn: false,
    is_tor: false,
    is_proxy: false,
    is_datacenter: false,
    risk_score: 0
  }
}

const IPAPI_FLAT: unknown = {
  ip: '14.100.70.52',
  is_bogon: false,
  company: 'SingNET Broadband',
  asn: 'AS9506 Singapore Telecommunications Ltd, Magix Services',
  city: 'Singapore',
  region: 'Singapore',
  country: 'Singapore',
  lat: 1.28999,
  lon: 103.85028,
  timezone: 'Asia/Singapore',
  docs: 'https://ipapi.is/free-tier.html?ref=api'
}

describe('parseAsnNumber', () => {
  it('parses provider variants and rejects unknowns', () => {
    expect(parseAsnNumber(64500)).toBe(64500)
    expect(parseAsnNumber('AS15169')).toBe(15169)
    expect(parseAsnNumber('AS9506 Singapore Telecommunications Ltd')).toBe(9506)
    expect(parseAsnNumber('AS0')).toBeUndefined()
    expect(parseAsnNumber(0)).toBeUndefined()
    expect(parseAsnNumber('garbage')).toBeUndefined()
    expect(parseAsnNumber(null)).toBeUndefined()
  })
})

describe('normalizeIpQueryResponse', () => {
  it('maps a datacenter lookup into the app shape', () => {
    const out = normalizeIpQueryResponse(IPQUERY_GOOGLE)
    expect(out?.provider).toBe('ipquery')
    expect(out?.ip).toBe('8.8.8.8')
    expect(out?.asn?.asn).toBe(15169)
    expect(out?.asn?.org).toBe('Google LLC')
    expect(out?.company?.name).toBe('Google LLC')
    expect(out?.location?.city).toBe('Mountain View')
    expect(out?.location?.state).toBe('California')
    expect(out?.location?.zip).toBe('94043')
    expect(out?.location?.local_time).toBe('2026-10-04T20:43:22')
    expect(out?.is_datacenter).toBe(true)
    expect(out?.is_mobile).toBe(false)
    expect(out?.risk_score).toBe(20)
  })

  it('drops empty-string fields', () => {
    const out = normalizeIpQueryResponse(IPQUERY_SELF)
    expect(out?.location?.state).toBeUndefined()
    expect(out?.is_mobile).toBe(true)
    expect(out?.company?.name).toBe('SINGTEL MOBILE Singapore')
    expect(out?.asn?.asn).toBe(9506)
  })

  it('nulls junk coords and identity on unknown/bogon lookups', () => {
    const out = normalizeIpQueryResponse(IPQUERY_BOGON)
    expect(out?.ip).toBe('192.168.1.1')
    expect(out?.asn).toBeUndefined()
    expect(out?.company).toBeUndefined()
    expect(out?.location?.latitude).toBeUndefined()
    expect(out?.location?.longitude).toBeUndefined()
    expect(out?.location?.country).toBeUndefined()
  })

  it('rejects error bodies', () => {
    expect(normalizeIpQueryResponse('IP address notanip not found')).toBeNull()
    expect(normalizeIpQueryResponse({})).toBeNull()
    expect(normalizeIpQueryResponse(null)).toBeNull()
    expect(normalizeIpQueryResponse({ ip: 123 })).toBeNull()
  })
})

describe('normalizeIpApiIsResponse', () => {
  it('maps the anonymous flat payload', () => {
    const out = normalizeIpApiIsResponse(IPAPI_FLAT)
    expect(out?.provider).toBe('ipapi')
    expect(out?.ip).toBe('14.100.70.52')
    expect(out?.company?.name).toBe('SingNET Broadband')
    expect(out?.asn?.asn).toBe(9506)
    expect(out?.asn?.org).toBe('Singapore Telecommunications Ltd, Magix Services')
    expect(out?.location?.city).toBe('Singapore')
    expect(out?.location?.state).toBe('Singapore')
    expect(out?.location?.latitude).toBeCloseTo(1.28999)
    expect(out?.location?.longitude).toBeCloseTo(103.85028)
    expect(out?.is_bogon).toBe(false)
  })

  it('passes through legacy keyed payloads', () => {
    const legacy = {
      ip: '203.0.113.10',
      is_vpn: true,
      location: { city: 'X', country: 'Y' },
      asn: { asn: 64500, org: 'Test' }
    }
    const out = normalizeIpApiIsResponse(legacy)
    expect(out?.provider).toBe('ipapi')
    expect(out?.is_vpn).toBe(true)
    expect(out?.asn?.asn).toBe(64500)
  })

  it('rejects payloads without an ip', () => {
    expect(normalizeIpApiIsResponse({})).toBeNull()
    expect(normalizeIpApiIsResponse(null)).toBeNull()
  })
})

describe('scoreIpRisk with provider risk_score', () => {
  it('adds ipquery risk weight on top of flags', () => {
    const dc = normalizeIpQueryResponse(IPQUERY_GOOGLE) as IpApiResponse
    const { score, band } = scoreIpRisk(dc)
    // datacenter 8 + risk 20 * 0.2 = 12
    expect(score).toBe(12)
    expect(band).toBe('Low')
  })

  it('scales a max provider score to a capped contribution', () => {
    const { score } = scoreIpRisk({ ip: '9.9.9.9', risk_score: 100 })
    expect(score).toBe(20)
  })

  it('ignores absent risk_score (legacy payloads unchanged)', () => {
    expect(scoreIpRisk({ ip: '1.1.1.1' })).toEqual({ score: 0, band: 'Low' })
  })
})

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body
  } as Response
}

describe('fetchIpInfoWithFallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the primary provider when it answers', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(IPQUERY_GOOGLE))
    const out = await fetchIpInfoWithFallback(fetchFn as typeof fetch)
    expect(out.provider).toBe('ipquery')
    expect(out.ip).toBe('8.8.8.8')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(typeof out.client_rtt_ms).toBe('number')
  })

  it('falls back to api.ipapi.is when ipquery fails', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(jsonResponse(IPAPI_FLAT))
    const out = await fetchIpInfoWithFallback(fetchFn as typeof fetch)
    expect(out.provider).toBe('ipapi')
    expect(out.ip).toBe('14.100.70.52')
    expect(out.asn?.asn).toBe(9506)
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('throws mentioning both providers when all fail', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({}, false, 500))
    await expect(fetchIpInfoWithFallback(fetchFn as typeof fetch)).rejects.toThrow(
      /all providers failed.*ipquery\.io.*api\.ipapi\.is/
    )
  })
})
