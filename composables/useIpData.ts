import { ref, computed } from 'vue'
import type { IpApiResponse, RiskBand, RiskInfo, ServerViewData } from '@/types'

/**
 * Composable for managing IP data, risk assessment, server view comparison, and reverse DNS.
 * Fetches IP information from ipapi.is API and provides computed risk metrics.
 */
export function useIpData() {
  // State
  const ipInfo = ref<IpApiResponse | null>(null)
  const ipError = ref<string | null>(null)
  const loadingIp = ref(true)
  const lastIp = ref<string | null>(null)
  
  // Server view comparison
  const serverViewLoading = ref(false)
  const serverViewError = ref<string | null>(null)
  const serverViewData = ref<ServerViewData | null>(null)
  
  // Reverse DNS
  const reverseDnsLoading = ref(false)
  const reverseDnsError = ref<string | null>(null)
  const reverseDnsHostnames = ref<string[] | null>(null)
  const reverseDnsResolver = ref<string>('')
  
  // Computed
  const ipStatusLabel = computed(() => {
    if (!ipInfo.value) return 'Unknown'
    if (ipInfo.value.is_abuser || ipInfo.value.is_tor || ipInfo.value.is_proxy || ipInfo.value.is_vpn) {
      return 'High risk / Likely blocked'
    }
    if (ipInfo.value.is_datacenter) {
      return 'Datacenter / Hosting'
    }
    if (ipInfo.value.is_bogon) {
      return 'Bogon / Invalid'
    }
    return 'Normal'
  })
  
  const ipStatusTone = computed<'success' | 'warning' | 'danger' | 'neutral'>(() => {
    if (!ipInfo.value) return 'neutral'
    if (ipInfo.value.is_abuser || ipInfo.value.is_tor || ipInfo.value.is_proxy || ipInfo.value.is_vpn) {
      return 'danger'
    }
    if (ipInfo.value.is_datacenter || ipInfo.value.is_bogon) {
      return 'warning'
    }
    return 'success'
  })
  
  const ipRiskScore = computed<number | null>(() => {
    const info = ipInfo.value
    if (!info) return null
    
    let score = 0
    
    if (info.is_abuser) score += 50
    if (info.is_tor) score += 20
    if (info.is_proxy) score += 10
    if (info.is_vpn) score += 10
    if (info.is_datacenter) score += 10
    if (info.is_bogon) score += 30
    
    const asnScore = parseAbuserScoreNumber(info.asn?.abuser_score)
    if (asnScore != null) {
      score += Math.min(asnScore * 50, 20)
    }
    
    const companyScore = parseAbuserScoreNumber(info.company?.abuser_score)
    if (companyScore != null) {
      score += Math.min(companyScore * 50, 20)
    }
    
    if (score === 0) return 5
    return Math.max(0, Math.min(100, Math.round(score)))
  })
  
  const ipRiskBand = computed<RiskBand>(() => {
    const s = ipRiskScore.value
    if (s == null) return 'Unknown'
    if (s < 30) return 'Low'
    if (s < 70) return 'Medium'
    return 'High'
  })
  
  const riskInfo = computed<RiskInfo>(() => ({
    score: ipRiskScore.value,
    band: ipRiskBand.value
  }))
  
  // Helper functions
  function parseAbuserScoreNumber(score: unknown): number | null {
    if (score == null) return null
    if (typeof score === 'number') return score
    if (typeof score === 'string') {
      const match = score.match(/[\d.]+/)
      if (!match) return null
      const n = Number(match[0])
      return Number.isFinite(n) ? n : null
    }
    return null
  }
  
  // Actions
  /**
   * Fetches IP information from the ipapi.is API.
   * Updates ipInfo with the response and calculates client RTT.
   */
  async function fetchIpInfo() {
    loadingIp.value = true
    ipError.value = null
    try {
      const start = performance.now()
      const res = await fetch('https://api.ipapi.is/')
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const data = (await res.json()) as IpApiResponse
      ipInfo.value = data
      const end = performance.now()
      
      if (ipInfo.value?.ip && lastIp.value && lastIp.value !== ipInfo.value.ip) {
        // IP changed - could emit an event here if needed
      }
      
      lastIp.value = ipInfo.value?.ip ?? lastIp.value
      
      if (ipInfo.value) {
        ;(ipInfo.value as IpApiResponse & { client_rtt_ms?: number }).client_rtt_ms = Math.round(end - start)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      ipError.value = `Unable to fetch IP information: ${message}`
    } finally {
      loadingIp.value = false
    }
  }
  
  /**
   * Fetches server-side view of the connection from the API.
   * Used to detect header rewriting and proxy intermediaries.
   */
  async function runServerViewCheck() {
    serverViewError.value = null
    serverViewData.value = null
    serverViewLoading.value = true
    try {
      const res = await $fetch<ServerViewData>('/api/server-info')
      serverViewData.value = res
    } catch (err) {
      serverViewError.value = (err as Error).message || 'Server view check failed.'
    } finally {
      serverViewLoading.value = false
    }
  }
  
  /**
   * Performs a reverse DNS lookup for the current IP address.
   * Uses the server API to query DNS PTR records via Cloudflare DoH.
   */
  async function runReverseDnsLookup() {
    reverseDnsError.value = null
    reverseDnsHostnames.value = null
    reverseDnsLoading.value = true
    try {
      const res = await $fetch<{
        ok: boolean
        ip: string | null
        hostnames?: string[]
        error?: string
      }>('/api/reverse-dns', {
        params: {
          ...(ipInfo.value?.ip ? { ip: ipInfo.value.ip } : {}),
          ...(reverseDnsResolver.value.trim() ? { resolver: reverseDnsResolver.value.trim() } : {})
        }
      })
      
      if (!res.ok) {
        reverseDnsError.value = res.error || 'Reverse DNS lookup failed.'
        return
      }
      
      reverseDnsHostnames.value = res.hostnames ?? []
    } catch (err) {
      reverseDnsError.value = (err as Error).message || 'Reverse DNS lookup failed.'
    } finally {
      reverseDnsLoading.value = false
    }
  }
  
  return {
    // State
    ipInfo,
    ipError,
    loadingIp,
    lastIp,
    serverViewLoading,
    serverViewError,
    serverViewData,
    reverseDnsLoading,
    reverseDnsError,
    reverseDnsHostnames,
    reverseDnsResolver,
    // Computed
    ipStatusLabel,
    ipStatusTone,
    ipRiskScore,
    ipRiskBand,
    riskInfo,
    // Actions
    fetchIpInfo,
    runServerViewCheck,
    runReverseDnsLookup
  }
}
