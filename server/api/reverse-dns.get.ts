import { defineEventHandler, getQuery, getRequestIP } from 'h3'
import { isValidIP, toReverseDnsName } from '../utils/ip'

interface DohAnswer {
  name?: string
  type?: number
  TTL?: number
  data?: string
}

interface DohResponse {
  Status?: number
  Answer?: DohAnswer[]
}

const PTR_TYPE = 12

function extractPtrHostnames(data: DohResponse): string[] {
  if (!data.Answer || data.Answer.length === 0) {
    return []
  }
  return data.Answer.filter(record => record.type === PTR_TYPE && typeof record.data === 'string')
    .map(record => (record.data as string).replace(/\.$/, ''))
    .filter(Boolean)
}

async function fetchPtrRecords(reverseDomain: string): Promise<string[]> {
  const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(reverseDomain)}&type=PTR`

  try {
    const response = await fetch(dohUrl, {
      headers: {
        Accept: 'application/dns-json'
      }
    })

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.statusText}`)
    }

    const data = (await response.json()) as DohResponse
    return extractPtrHostnames(data)
  } catch (error) {
    try {
      const fallbackUrl = `https://dns.google/resolve?name=${encodeURIComponent(reverseDomain)}&type=PTR`
      const fallbackResponse = await fetch(fallbackUrl)
      const fallbackData = (await fallbackResponse.json()) as DohResponse
      return extractPtrHostnames(fallbackData)
    } catch {
      throw error
    }
  }
}

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const ipParam = typeof query.ip === 'string' ? query.ip.trim() : ''

  // Prefer explicit IP; otherwise trust platform-forwarded headers (Cloudflare).
  const headerIp = getRequestIP(event, { xForwardedFor: true }) || null
  const socket = event.node.req.socket as { remoteAddress?: string } | null
  const socketIp = socket?.remoteAddress ?? null
  const ip = ipParam || headerIp || socketIp || ''

  if (!ip) {
    return {
      ok: false,
      ip: null,
      error: 'No IP available for reverse DNS lookup.'
    }
  }

  if (!isValidIP(ip)) {
    return {
      ok: false,
      ip,
      error: 'Invalid IP address format.'
    }
  }

  const reverseDomain = toReverseDnsName(ip)
  if (!reverseDomain) {
    return {
      ok: false,
      ip,
      error: 'Unable to build reverse DNS name for this IP.'
    }
  }

  try {
    const hostnames = await fetchPtrRecords(reverseDomain)
    return {
      ok: true,
      ip,
      hostnames
    }
  } catch (error) {
    return {
      ok: false,
      ip,
      error: (error as Error).message || 'Reverse DNS lookup failed.'
    }
  }
})
