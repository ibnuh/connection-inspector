/**
 * Network Information API helpers.
 *
 * Important: `effectiveType` is a *performance class* (how fast the browser thinks
 * the link is), not the physical radio. Chrome often reports "4g" on desktop Wi‑Fi.
 * Prefer `type` (wifi | ethernet | cellular | …) for transport when available.
 */

export type ConnectionTransport =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown'

export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g'

export interface ConnectionSnapshotFields {
  /** Physical/logical transport from navigator.connection.type */
  transport: string | null
  /** Performance class from navigator.connection.effectiveType */
  effectiveType: string | null
  downlink: number | null
  rtt: number | null
  saveData: boolean | null
  apiAvailable: boolean
}

const TRANSPORT_LABELS: Record<string, string> = {
  bluetooth: 'Bluetooth',
  cellular: 'Cellular',
  ethernet: 'Ethernet',
  none: 'None',
  wifi: 'Wi‑Fi',
  wimax: 'WiMAX',
  other: 'Other',
  unknown: 'Unknown'
}

/** Labels for effectiveType — always framed as performance class, not radio. */
const EFFECTIVE_TYPE_LABELS: Record<string, string> = {
  'slow-2g': 'Slow 2G-class',
  '2g': '2G-class',
  '3g': '3G-class',
  '4g': '4G-class (fast)'
}

export function formatConnectionTransport(type: string | null | undefined): string {
  if (!type) {
    return 'Not reported'
  }
  const key = type.toLowerCase()
  return TRANSPORT_LABELS[key] ?? type
}

/**
 * Human label for effectiveType. Never returns bare "4G" without class context.
 */
export function formatEffectiveType(effectiveType: string | null | undefined): string {
  if (!effectiveType) {
    return 'Not reported'
  }
  const key = effectiveType.toLowerCase()
  return EFFECTIVE_TYPE_LABELS[key] ?? `${effectiveType} (performance class)`
}

/**
 * Primary user-facing connection summary.
 * Prefer real transport; fall back to effectiveType with honest wording.
 */
export function formatConnectionSummary(input: {
  transport?: string | null
  effectiveType?: string | null
}): string {
  const transport = input.transport?.toLowerCase() ?? null
  if (transport && transport !== 'unknown' && transport !== 'other') {
    return formatConnectionTransport(transport)
  }
  if (input.effectiveType) {
    return formatEffectiveType(input.effectiveType)
  }
  if (transport) {
    return formatConnectionTransport(transport)
  }
  return 'Not reported'
}

/** IP-derived network context (ipapi flags), not browser NetInfo. */
export function formatIpNetworkContext(flags: {
  isMobile?: boolean | null
  isDatacenter?: boolean | null
  isSatellite?: boolean | null
}): string {
  if (flags.isSatellite) {
    return 'Satellite IP'
  }
  if (flags.isMobile) {
    return 'Mobile carrier IP'
  }
  if (flags.isDatacenter) {
    return 'Datacenter / hosting IP'
  }
  return 'Residential / other IP'
}

export function normalizeConnectionTypeValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }
  return value.trim().toLowerCase()
}
