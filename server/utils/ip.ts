/**
 * Server-side IP helpers (duplicated lightly so Nitro does not pull client utils path issues).
 * Keep in sync with utils/ip.ts validation rules.
 */

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
