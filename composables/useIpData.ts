import { ref, computed } from 'vue'
import type { IpApiResponse, RiskInfo, ServerViewData } from '@/types'
import {
  scoreIpRisk,
  ipStatusFromInfo,
  normalizeIpQueryResponse,
  normalizeIpApiIsResponse,
  IPQUERY_URL,
  IPAPI_URL
} from '@/utils/ip'

/**
 * Fetch IP info from the primary provider (ipquery.io, same one
 * Flow.Launcher.Plugin.IPDetails uses) with api.ipapi.is as fallback.
 * Returns the first payload that normalizes to a usable result.
 */
export async function fetchIpInfoWithFallback(
  fetchFn: typeof fetch = fetch
): Promise<IpApiResponse> {
  const providers = [
    { name: 'ipquery.io', url: IPQUERY_URL, normalize: normalizeIpQueryResponse },
    { name: 'api.ipapi.is', url: IPAPI_URL, normalize: normalizeIpApiIsResponse }
  ] as const

  const failures: string[] = []
  for (const provider of providers) {
    try {
      const start = performance.now()
      const res = await fetchFn(provider.url)
      if (!res.ok) {
        throw new Error(`request failed with status ${res.status}`)
      }
      const data = provider.normalize(await res.json())
      if (!data?.ip) {
        throw new Error('returned an unexpected payload')
      }
      data.client_rtt_ms = Math.round(performance.now() - start)
      return data
    } catch (err) {
      failures.push(`${provider.name} (${err instanceof Error ? err.message : 'unknown error'})`)
    }
  }
  throw new Error(`all providers failed: ${failures.join('; ')}`)
}

/**
 * Composable for managing IP data, risk assessment, server view comparison, and reverse DNS.
 */
export function useIpData() {
  const ipInfo = ref<IpApiResponse | null>(null)
  const ipError = ref<string | null>(null)
  const loadingIp = ref(true)
  const lastIp = ref<string | null>(null)

  const serverViewLoading = ref(false)
  const serverViewError = ref<string | null>(null)
  const serverViewData = ref<ServerViewData | null>(null)

  const reverseDnsLoading = ref(false)
  const reverseDnsError = ref<string | null>(null)
  const reverseDnsHostnames = ref<string[] | null>(null)

  const riskInfo = computed<RiskInfo>(() => scoreIpRisk(ipInfo.value))
  const ipRiskScore = computed(() => riskInfo.value.score)
  const ipRiskBand = computed(() => riskInfo.value.band)

  const status = computed(() => ipStatusFromInfo(ipInfo.value))
  const ipStatusLabel = computed(() => status.value.label)
  const ipStatusTone = computed(() => status.value.tone)

  async function fetchIpInfo() {
    loadingIp.value = true
    ipError.value = null
    try {
      const data = await fetchIpInfoWithFallback()
      ipInfo.value = data
      lastIp.value = data.ip ?? lastIp.value
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      ipError.value = `Unable to fetch IP information: ${message}`
    } finally {
      loadingIp.value = false
    }
  }

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
          ...(ipInfo.value?.ip ? { ip: ipInfo.value.ip } : {})
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
    ipStatusLabel,
    ipStatusTone,
    ipRiskScore,
    ipRiskBand,
    riskInfo,
    fetchIpInfo,
    runServerViewCheck,
    runReverseDnsLookup
  }
}
