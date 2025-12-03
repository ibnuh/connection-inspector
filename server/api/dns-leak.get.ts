import { defineEventHandler, getQuery, readBody } from 'h3'

interface DnsServerInfo {
  guid: string
  ip: string
  hostname?: string
  country?: string
  city?: string
  asn?: number
  org?: string
}

interface DnsLeakApiResponse {
  servers: Array<{
    guid: string
    ip: string
    hostname?: string
    country?: string
    city?: string
    asn?: number
    org?: string
  }>
}

export default defineEventHandler(async (event): Promise<DnsLeakApiResponse> => {
  const body = await readBody(event).catch(() => null)
  const queries = body?.queries as string[] | undefined

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid queries array'
    })
  }

  try {
    // Call dnsleaktest.com API to get DNS server information
    const response = await fetch('https://www.dnsleaktest.com/api/v1/servers-for-result', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ queries })
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `DNS leak test API returned ${response.status}`
      })
    }

    const data = await response.json() as DnsLeakApiResponse
    return data
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: (error as Error).message || 'Failed to fetch DNS leak test results'
    })
  }
})
