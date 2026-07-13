/**
 * Pure IP helpers: validation, reverse DNS names, private ranges, risk scoring.
 */

import type { IpApiResponse, RiskBand, RiskInfo } from '@/types'

export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) {
    return false
  }
  return parts.every(part => {
    if (!/^\d{1,3}$/.test(part)) {
      return false
    }
    const n = Number(part)
    return n >= 0 && n <= 255
  })
}

/** Accept common IPv6 forms including compressed notation (no IPv4-mapped). */
export function isValidIPv6(ip: string): boolean {
  if (!ip || ip.includes('.')) {
    return false
  }

  // Strip zone id (fe80::1%eth0)
  const bare = ip.split('%')[0]
  if (bare.split('::').length > 2) {
    return false
  }

  const full = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  const compressed =
    /^((?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4})?::((?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4})?$/

  if (full.test(bare)) {
    return true
  }
  if (!compressed.test(bare)) {
    return false
  }

  const [left, right] = bare.split('::')
  const leftCount = left ? left.split(':').filter(Boolean).length : 0
  const rightCount = right ? right.split(':').filter(Boolean).length : 0
  return leftCount + rightCount <= 7
}

export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip)
}

/**
 * Normalize an IP for equality checks.
 * - Strips zone IDs
 * - Lowercases IPv6
 * - Expands IPv6
 * - Unwraps IPv4-mapped IPv6 (::ffff:a.b.c.d)
 */
export function normalizeIp(ip: string | null | undefined): string | null {
  if (!ip) {
    return null
  }
  let value = ip.trim().toLowerCase()
  if (value.startsWith('[') && value.endsWith(']')) {
    value = value.slice(1, -1)
  }
  value = value.split('%')[0]

  const v4Mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (v4Mapped) {
    return isValidIPv4(v4Mapped[1]) ? v4Mapped[1] : null
  }

  if (isValidIPv4(value)) {
    return value
  }

  if (isValidIPv6(value)) {
    return expandIPv6(value)
  }

  return null
}

export function isSameIp(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeIp(a)
  const nb = normalizeIp(b)
  if (!na || !nb) {
    return false
  }
  return na === nb
}

export function isPrivateIP(ip: string): boolean {
  const n = normalizeIp(ip) ?? ip

  if (isValidIPv4(n)) {
    const parts = n.split('.').map(Number)
    const [a, b] = parts
    if (a === 10) {
      return true
    }
    if (a === 172 && b >= 16 && b <= 31) {
      return true
    }
    if (a === 192 && b === 168) {
      return true
    }
    if (a === 127) {
      return true
    }
    if (a === 169 && b === 254) {
      return true
    }
    if (a === 0) {
      return true
    }
    // CGNAT 100.64.0.0/10
    if (a === 100 && b >= 64 && b <= 127) {
      return true
    }
    return false
  }

  const privatePatterns = [/^fc/i, /^fd/i, /^fe80:/i, /^::1$/, /^::$/]
  return privatePatterns.some(re => re.test(n))
}

/** Build reverse DNS query name (in-addr.arpa or ip6.arpa). */
export function toReverseDnsName(ip: string): string | null {
  if (isValidIPv4(ip)) {
    return `${ip.split('.').reverse().join('.')}.in-addr.arpa`
  }

  if (!isValidIPv6(ip)) {
    return null
  }

  const expanded = expandIPv6(ip)
  if (!expanded) {
    return null
  }

  const nibbles = expanded.replace(/:/g, '').toLowerCase().split('').reverse().join('.')
  return `${nibbles}.ip6.arpa`
}

export function expandIPv6(ip: string): string | null {
  const bare = ip.split('%')[0]
  if (!isValidIPv6(bare)) {
    return null
  }

  let full = bare
  if (full.includes('::')) {
    const [left, right] = full.split('::')
    const leftParts = left ? left.split(':').filter(Boolean) : []
    const rightParts = right ? right.split(':').filter(Boolean) : []
    const missing = 8 - leftParts.length - rightParts.length
    const middles = Array.from({ length: missing }, () => '0')
    full = [...leftParts, ...middles, ...rightParts].join(':')
  }

  const parts = full.split(':')
  if (parts.length !== 8) {
    return null
  }

  return parts.map(p => p.padStart(4, '0')).join(':')
}

/**
 * Parse abuser_score from ipapi.is.
 * Accepts numbers, "0.12", and ratio forms like "1/100".
 */
export function parseAbuserScoreNumber(score: unknown): number | null {
  if (score == null) {
    return null
  }
  if (typeof score === 'number') {
    return Number.isFinite(score) ? score : null
  }
  if (typeof score === 'string') {
    const ratio = score.match(/^\s*([\d.]+)\s*\/\s*([\d.]+)\s*$/)
    if (ratio) {
      const num = Number(ratio[1])
      const den = Number(ratio[2])
      if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
        return num / den
      }
    }
    const match = score.match(/-?[\d.]+/)
    if (!match) {
      return null
    }
    const n = Number(match[0])
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Heuristic risk score (0-100) from ipapi.is-style flags.
 * Higher = more abuse / anonymizer / hosting signals.
 * VPN alone is medium-low; abuser/tor are high.
 */
export function scoreIpRisk(info: IpApiResponse | null | undefined): RiskInfo {
  if (!info) {
    return { score: null, band: 'Unknown' }
  }

  let score = 0

  if (info.is_abuser) {
    score += 55
  }
  if (info.is_tor) {
    score += 25
  }
  if (info.is_proxy) {
    score += 15
  }
  if (info.is_vpn) {
    score += 12
  }
  if (info.is_datacenter) {
    score += 8
  }
  if (info.is_bogon) {
    score += 35
  }
  if (info.is_crawler) {
    score += 5
  }

  const asnScore = parseAbuserScoreNumber(info.asn?.abuser_score)
  if (asnScore != null) {
    // Treat scores in 0..1 as fractions; larger raw values scale down
    const normalized = asnScore > 1 ? Math.min(asnScore / 100, 1) : asnScore
    score += Math.min(Math.round(normalized * 40), 20)
  }

  const companyScore = parseAbuserScoreNumber(info.company?.abuser_score)
  if (companyScore != null) {
    const normalized = companyScore > 1 ? Math.min(companyScore / 100, 1) : companyScore
    score += Math.min(Math.round(normalized * 40), 20)
  }

  // Clean residential-like IPs stay near zero, not an artificial floor of 5
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  let band: RiskBand = 'High'
  if (clamped < 25) {
    band = 'Low'
  } else if (clamped < 60) {
    band = 'Medium'
  }

  return { score: clamped, band }
}

export function ipStatusFromInfo(info: IpApiResponse | null | undefined): {
  label: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
} {
  if (!info) {
    return { label: 'Unknown', tone: 'neutral' }
  }

  // Most severe first; do not lump VPN with abuse
  if (info.is_abuser) {
    return { label: 'Abuse-listed', tone: 'danger' }
  }
  if (info.is_bogon) {
    return { label: 'Bogon / invalid', tone: 'warning' }
  }
  if (info.is_tor) {
    return { label: 'Tor exit', tone: 'danger' }
  }
  if (info.is_proxy && info.is_vpn) {
    return { label: 'VPN / proxy', tone: 'warning' }
  }
  if (info.is_proxy) {
    return { label: 'Proxy', tone: 'warning' }
  }
  if (info.is_vpn) {
    return { label: 'VPN', tone: 'warning' }
  }
  if (info.is_datacenter) {
    return { label: 'Datacenter / hosting', tone: 'warning' }
  }
  if (info.is_crawler) {
    return { label: 'Crawler', tone: 'neutral' }
  }
  if (info.is_mobile) {
    return { label: 'Mobile network', tone: 'success' }
  }
  return { label: 'Residential / normal', tone: 'success' }
}

/**
 * WebRTC exposure classification.
 * - Local/private ICE addresses = local network exposure
 * - Public ICE addresses that differ from egress = public IP mismatch (true leak signal)
 * - Matching public ICE to egress is expected for many STUN paths, not a leak
 */
export function evaluateWebRTCExposure(
  localIps: string[],
  publicIps: string[],
  egressIp: string | null | undefined
): {
  hasLocalExposure: boolean
  hasPublicMismatch: boolean
  hasLeak: boolean
  matchingPublicIps: string[]
  mismatchedPublicIps: string[]
} {
  const egress = normalizeIp(egressIp)
  const matchingPublicIps: string[] = []
  const mismatchedPublicIps: string[] = []

  for (const raw of publicIps) {
    const n = normalizeIp(raw)
    if (!n) {
      continue
    }
    if (egress && n === egress) {
      matchingPublicIps.push(raw)
    } else if (egress) {
      mismatchedPublicIps.push(raw)
    } else {
      // No egress to compare: report as mismatched only if clearly public
      mismatchedPublicIps.push(raw)
    }
  }

  const hasLocalExposure = localIps.some(ip => isPrivateIP(ip))
  const hasPublicMismatch = mismatchedPublicIps.length > 0 && !!egress
  // Without egress, local exposure is still meaningful; bare public ICE alone is inconclusive
  const hasLeak = hasLocalExposure || hasPublicMismatch

  return {
    hasLocalExposure,
    hasPublicMismatch,
    hasLeak,
    matchingPublicIps,
    mismatchedPublicIps
  }
}
