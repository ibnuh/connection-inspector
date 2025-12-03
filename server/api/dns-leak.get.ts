import { defineEventHandler, getQuery } from 'h3'
import { promises as dns, Resolver } from 'node:dns'

interface DnsQueryResult {
  domain: string
  ip: string | null
  error?: string
}

interface DnsLeakResult {
  ok: boolean
  queries: DnsQueryResult[]
  systemDnsServers: string[]
  leakDetected: boolean
  resolverCount: number
  note?: string
  error?: string
}

// Generate random subdomains for testing
function generateTestDomain(): string {
  const random = Math.random().toString(36).substring(2, 15)
  return `test-${random}.dnsleaktest.com`
}

// Get DNS resolver servers being used by the system
function getDnsServers(): string[] {
  try {
    const resolver = new Resolver()
    return resolver.getServers()
  } catch {
    return []
  }
}

export default defineEventHandler(async (event): Promise<DnsLeakResult> => {
  const query = getQuery(event)
  const count = query.count ? parseInt(query.count as string, 10) : 10

  if (count < 1 || count > 50) {
    return {
      ok: false,
      queries: [],
      systemDnsServers: [],
      leakDetected: false,
      resolverCount: 0,
      error: 'Query count must be between 1 and 50'
    }
  }

  try {
    const queries: DnsQueryResult[] = []
    
    // Get system DNS servers
    const systemDnsServers = getDnsServers()
    
    // Perform multiple DNS queries to test DNS resolution
    for (let i = 0; i < count; i++) {
      const testDomain = generateTestDomain()
      
      try {
        // Try IPv4 first, then IPv6
        let addresses: string[] | string | null = null
        try {
          addresses = await dns.resolve4(testDomain)
        } catch {
          try {
            addresses = await dns.resolve6(testDomain)
          } catch {
            addresses = null
          }
        }

        if (addresses) {
          const ip = Array.isArray(addresses) ? addresses[0] : addresses
          queries.push({
            domain: testDomain,
            ip
          })
        } else {
          queries.push({
            domain: testDomain,
            ip: null,
            error: 'No addresses found'
          })
        }
      } catch (error) {
        queries.push({
          domain: testDomain,
          ip: null,
          error: (error as Error).message || 'DNS query failed'
        })
      }
    }

    // A leak is detected if we have multiple different DNS servers configured
    // Note: This shows server-side DNS configuration. For client-side DNS leak testing,
    // the browser would need to make requests to domains that log DNS server IPs.
    const leakDetected = systemDnsServers.length > 1

    return {
      ok: true,
      queries,
      systemDnsServers,
      leakDetected,
      resolverCount: systemDnsServers.length,
      note: systemDnsServers.length === 0 
        ? 'Could not detect DNS servers. This test shows server-side DNS configuration.'
        : 'This shows the DNS servers configured on the server. For client-side DNS leak detection, requests would be made from your browser.'
    }
  } catch (error) {
    return {
      ok: false,
      queries: [],
      systemDnsServers: [],
      leakDetected: false,
      resolverCount: 0,
      error: (error as Error).message || 'DNS leak test failed'
    }
  }
})

