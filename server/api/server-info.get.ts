import { defineEventHandler, getRequestIP } from 'h3'

/**
 * Returns what the edge sees for this request.
 * On Cloudflare Pages, getRequestIP with xForwardedFor trusts platform-forwarded headers.
 */
export default defineEventHandler(event => {
  const { headers, httpVersion, socket } = event.node.req

  const headerIp = getRequestIP(event, { xForwardedFor: true }) || null
  const socketIp =
    socket && typeof socket === 'object' && 'remoteAddress' in socket
      ? ((socket as { remoteAddress?: string }).remoteAddress ?? null)
      : null

  return {
    ip: headerIp || socketIp,
    httpVersion,
    headers: {
      'user-agent': headers['user-agent'],
      'accept-language': headers['accept-language'],
      'x-forwarded-for': headers['x-forwarded-for']
    }
  }
})
