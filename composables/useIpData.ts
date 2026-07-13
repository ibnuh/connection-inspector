import { ref, computed } from 'vue'
import type { IpApiResponse, RiskInfo, ServerViewData } from '@/types'
import { scoreIpRisk, ipStatusFromInfo } from '@/utils/ip'

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
      const start = performance.now()
      const res = await fetch('https://api.ipapi.is/')
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const data = (await res.json()) as IpApiResponse
      const end = performance.now()
      data.client_rtt_ms = Math.round(end - start)
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
