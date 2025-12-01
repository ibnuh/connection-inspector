import { defineEventHandler, getRequestIP } from 'h3'

export default defineEventHandler((event) => {
  const { headers, httpVersion, socket } = event.node.req

  // Best-effort IP detection: trust X-Forwarded-For when present, otherwise fall back to socket address.
  const headerIp =
    getRequestIP(event, { xForwardedFor: true }) ||
    null
  const socketIp = (socket as any)?.remoteAddress ?? null

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



