import { defineEventHandler, readBody, createError } from 'h3'
import type { DnsServerInfo } from '../../types'

const MAX_QUERIES = 8
const MAX_QUERY_LENGTH = 253

function isDnsServerInfo(value: unknown): value is DnsServerInfo {
  if (!value || typeof value !== 'object') {
    return false
  }
  const v = value as Record<string, unknown>
  return typeof v.ip_address === 'string'
}

export default defineEventHandler(async (event): Promise<{ servers: DnsServerInfo[] }> => {
  const body = await readBody(event).catch(() => null)

  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must be a JSON object with a queries array'
    })
  }

  const queries = (body as { queries?: unknown }).queries

  if (!Array.isArray(queries) || queries.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid queries array'
    })
  }

  if (queries.length > MAX_QUERIES) {
    throw createError({
      statusCode: 400,
      statusMessage: `Too many queries (max ${MAX_QUERIES})`
    })
  }

  const normalized: string[] = []
  for (const q of queries) {
    if (typeof q !== 'string' || !q.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Each query must be a non-empty string'
      })
    }
    if (q.length > MAX_QUERY_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: `Query exceeds max length of ${MAX_QUERY_LENGTH}`
      })
    }
    normalized.push(q.trim())
  }

  try {
    const response = await fetch('https://www.dnsleaktest.com/api/v1/servers-for-result', {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ queries: normalized })
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `DNS resolver info API returned ${response.status}`
      })
    }

    const data: unknown = await response.json()
    if (!Array.isArray(data)) {
      throw createError({
        statusCode: 502,
        statusMessage: 'DNS resolver info API returned an unexpected payload'
      })
    }

    const servers = data.filter(isDnsServerInfo)
    return { servers }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: (error as Error).message || 'Failed to fetch DNS resolver info'
    })
  }
})
