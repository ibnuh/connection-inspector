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

  if (ip.split('::').length > 2) {
    return false
  }

  const full = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  const compressed =
    /^((?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4})?::((?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{0,4})?$/

  if (full.test(ip)) {
    return true
  }
  if (!compressed.test(ip)) {
    return false
  }

  const [left, right] = ip.split('::')
  const leftCount = left ? left.split(':').filter(Boolean).length : 0
  const rightCount = right ? right.split(':').filter(Boolean).length : 0
  return leftCount + rightCount <= 7
}

export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip)
}

export function isPrivateIP(ip: string): boolean {
  const privatePatterns = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^0\./,
    /^fc00:/i,
    /^fd[0-9a-f]{2}:/i,
    /^fe80:/i,
    /^::1$/i,
    /^::$/i
  ]
  return privatePatterns.some(re => re.test(ip))
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
  if (!isValidIPv6(ip)) {
    return null
  }

  let full = ip
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

export function parseAbuserScoreNumber(score: unknown): number | null {
  if (score == null) {
    return null
  }
  if (typeof score === 'number') {
    return Number.isFinite(score) ? score : null
  }
  if (typeof score === 'string') {
    const match = score.match(/[\d.]+/)
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
 * Higher = more anonymizer / abuse / hosting signals.
 */
export function scoreIpRisk(info: IpApiResponse | null | undefined): RiskInfo {
  if (!info) {
    return { score: null, band: 'Unknown' }
  }

  let score = 0

  if (info.is_abuser) {
    score += 50
  }
  if (info.is_tor) {
    score += 20
  }
  if (info.is_proxy) {
    score += 10
  }
  if (info.is_vpn) {
    score += 10
  }
  if (info.is_datacenter) {
    score += 10
  }
  if (info.is_bogon) {
    score += 30
  }

  const asnScore = parseAbuserScoreNumber(info.asn?.abuser_score)
  if (asnScore != null) {
    score += Math.min(asnScore * 50, 20)
  }

  const companyScore = parseAbuserScoreNumber(info.company?.abuser_score)
  if (companyScore != null) {
    score += Math.min(companyScore * 50, 20)
  }

  if (score === 0) {
    score = 5
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  let band: RiskBand = 'High'
  if (clamped < 30) {
    band = 'Low'
  } else if (clamped < 70) {
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
  if (info.is_abuser || info.is_tor || info.is_proxy || info.is_vpn) {
    return { label: 'Anonymizer signals', tone: 'danger' }
  }
  if (info.is_datacenter) {
    return { label: 'Datacenter / Hosting', tone: 'warning' }
  }
  if (info.is_bogon) {
    return { label: 'Bogon / Invalid', tone: 'warning' }
  }
  return { label: 'Normal', tone: 'success' }
}

/**
 * WebRTC exposure: local LAN IPs always count as exposure.
 * Public ICE IPs that differ from the browser egress IP are a true "leak" signal.
 */
export function evaluateWebRTCExposure(
  localIps: string[],
  publicIps: string[],
  egressIp: string | null | undefined
): {
  hasLocalExposure: boolean
  hasPublicMismatch: boolean
  hasLeak: boolean
} {
  const hasLocalExposure = localIps.length > 0
  const hasPublicMismatch =
    publicIps.length > 0 && !!egressIp && publicIps.some(ip => ip !== egressIp)

  // Without an egress IP, treat unexpected public ICE candidates as a weak leak signal
  const unknownEgressPublic = publicIps.length > 0 && !egressIp

  const hasLeak = hasLocalExposure || hasPublicMismatch || unknownEgressPublic

  return { hasLocalExposure, hasPublicMismatch, hasLeak }
}
