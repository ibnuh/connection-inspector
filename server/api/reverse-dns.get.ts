import { defineEventHandler, getQuery, getRequestIP } from 'h3'
import { Resolver, promises as dns } from 'node:dns'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ipParam = typeof query.ip === 'string' ? query.ip.trim() : ''
  const resolverParam = typeof query.resolver === 'string' ? query.resolver.trim() : ''

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
    let hostnames: string[]

    if (resolverParam) {
      const resolver = new Resolver()
      resolver.setServers([resolverParam])
      hostnames = await new Promise<string[]>((resolve, reject) => {
        resolver.reverse(ip, (err, records) => {
          if (err) return reject(err)
          resolve(records)
        })
      })
    } else {
      hostnames = await dns.reverse(ip)
    }

    return {
      ok: true,
      ip,
      resolver: resolverParam || null,
      hostnames
    }
  } catch (error) {
    return {
      ok: false,
      ip,
      resolver: resolverParam || null,
      error: (error as Error).message || 'Reverse DNS lookup failed.'
    }
  }
})



