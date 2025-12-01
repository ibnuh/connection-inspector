import { defineEventHandler, getRequestIP } from 'h3'

export default defineEventHandler((event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || null
  const { headers, httpVersion } = event.node.req

  return {
    ip,
    httpVersion,
    headers: {
      'user-agent': headers['user-agent'],
      'accept-language': headers['accept-language'],
      'x-forwarded-for': headers['x-forwarded-for']
    }
  }
})


