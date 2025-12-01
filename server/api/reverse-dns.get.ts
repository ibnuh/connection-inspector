import { defineEventHandler, getQuery, getRequestIP } from 'h3'
import { promises as dns } from 'node:dns'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ipParam = typeof query.ip === 'string' ? query.ip.trim() : ''

  const ip =
    ipParam ||
    getRequestIP(event, { xForwardedFor: true }) ||
    (event.node.req.socket as any)?.remoteAddress ||
    ''

  if (!ip) {
    return {
      ok: false,
      ip: null,
      error: 'No IP available for reverse DNS lookup.'
    }
  }

  try {
    const hostnames = await dns.reverse(ip)
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


