import { ref } from 'vue'

export interface DnsServerInfo {
  ip_address: string
  hostname: string | null
  isp: string
  organization: string
  country: string
  country_code: string
  city: string
  dnssec: boolean
}

export function useDnsLeakTest() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const servers = ref<DnsServerInfo[]>([])
  const testId = ref<string>('')
  
  async function runDnsLeakTest() {
    loading.value = true
    error.value = null
    servers.value = []
    
    try {
      // Generate unique test ID
      testId.value = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      
      // Create unique subdomains to query different DNS servers
      const queries = [
        `${testId.value}-1.example.com`,
        `${testId.value}-2.example.com`,
        `${testId.value}-3.example.com`
      ]
      
      const response = await $fetch<{ servers: DnsServerInfo[] }>('/api/dns-leak', {
        method: 'POST',
        body: { queries }
      })
      
      servers.value = response.servers
    } catch (err) {
      error.value = (err as Error).message || 'DNS leak test failed'
    } finally {
      loading.value = false
    }
  }
  
  function clearResults() {
    servers.value = []
    error.value = null
    testId.value = ''
  }
  
  return {
    loading,
    error,
    servers,
    testId,
    runDnsLeakTest,
    clearResults
  }
}
