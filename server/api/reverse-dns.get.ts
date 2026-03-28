import { defineEventHandler, getQuery, getRequestIP } from 'h3'

// Cloudflare Workers-compatible reverse DNS lookup using DNS over HTTPS
async function reverseDnsLookup(ip: string, resolver?: string): Promise<string[]> {
  // Use Cloudflare's DNS over HTTPS API or Google's public DNS
  const dnsServer = resolver || '1.1.1.1'
  
  // Convert IP to reverse DNS format (e.g., 1.2.3.4 -> 4.3.2.1.in-addr.arpa)
  const parts = ip.split('.').reverse()
  const reverseDomain = parts.join('.') + '.in-addr.arpa'
  
  // Use Cloudflare's DNS over HTTPS API
  const dohUrl = `https://cloudflare-dns.com/dns-query?name=${reverseDomain}&type=PTR`
  
  try {
    const response = await fetch(dohUrl, {
      headers: {
        'Accept': 'application/dns-json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.Answer && data.Answer.length > 0) {
      return data.Answer
        .filter((record: any) => record.type === 12) // PTR record type
        .map((record: any) => record.data.replace(/\.$/, '')) // Remove trailing dot
    }
    
    return []
  } catch (error) {
    // Fallback: try using a simpler approach with a public DNS API
    try {
      const fallbackUrl = `https://dns.google/resolve?name=${reverseDomain}&type=PTR`
      const fallbackResponse = await fetch(fallbackUrl)
      const fallbackData = await fallbackResponse.json()
      
      if (fallbackData.Answer && fallbackData.Answer.length > 0) {
        return fallbackData.Answer
          .filter((record: any) => record.type === 12)
          .map((record: any) => record.data.replace(/\.$/, ''))
      }
    } catch {
      // Ignore fallback errors
    }
    
    throw error
  }
}

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

  // Validate IP format (IPv4 or IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/
  
  const isIPv4 = ipv4Regex.test(ip)
  const isIPv6 = ipv6Regex.test(ip)
  
  if (!isIPv4 && !isIPv6) {
    return {
      ok: false,
      ip,
      resolver: resolverParam || null,
      error: 'Invalid IP address format.'
    }
  }

  try {
    const hostnames = await reverseDnsLookup(ip, resolverParam || undefined)

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



