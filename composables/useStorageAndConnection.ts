import { ref, computed } from 'vue'
import type { StorageInfo, ConnectionInfo, WebSocketConnectivity, IPv6Connectivity } from '@/types'

export function useStorageAndConnection() {
  // Storage state
  const localStorageEnabled = ref<boolean | null>(null)
  const sessionStorageEnabled = ref<boolean | null>(null)
  const storageQuota = ref<number | null>(null)
  const storageUsage = ref<number | null>(null)

  // Connection state
  const connectionType = ref<string | null>(null)
  const connectionDownlink = ref<number | null>(null)
  const connectionRtt = ref<number | null>(null)
  const connectionSaveData = ref<boolean | null>(null)

  // NEW: WebSocket connectivity
  const webSocketSupported = ref<boolean | null>(null)
  const webSocketCanConnect = ref<boolean | null>(null)
  const webSocketLatency = ref<number | null>(null)
  const webSocketError = ref<string | null>(null)

  // NEW: IPv6 connectivity
  const ipv6Supported = ref<boolean | null>(null)
  const ipv6CanConnect = ref<boolean | null>(null)

  // Computed
  const storageInfo = computed<StorageInfo>(() => ({
    localStorageEnabled: localStorageEnabled.value,
    sessionStorageEnabled: sessionStorageEnabled.value,
    quota: storageQuota.value,
    usage: storageUsage.value
  }))

  const connectionInfo = computed<ConnectionInfo>(() => ({
    type: connectionType.value,
    downlink: connectionDownlink.value,
    rtt: connectionRtt.value,
    saveData: connectionSaveData.value
  }))

  const webSocketConnectivity = computed<WebSocketConnectivity>(() => ({
    supported: webSocketSupported.value,
    canConnect: webSocketCanConnect.value,
    latency: webSocketLatency.value,
    error: webSocketError.value
  }))

  const ipv6Connectivity = computed<IPv6Connectivity>(() => ({
    supported: ipv6Supported.value,
    canConnect: ipv6CanConnect.value,
    testUrl: 'https://ipv6.google.com'
  }))

  // Detection
  function detectStorage() {
    try {
      const key = '__connection_inspector_test__'
      window.localStorage.setItem(key, '1')
      window.localStorage.removeItem(key)
      localStorageEnabled.value = true
    } catch {
      localStorageEnabled.value = false
    }

    try {
      const key = '__session_storage_test__'
      sessionStorage.setItem(key, '1')
      sessionStorage.removeItem(key)
      sessionStorageEnabled.value = true
    } catch {
      sessionStorageEnabled.value = false
    }

    if (
      'storage' in navigator &&
      typeof (navigator as Navigator & { storage?: StorageManager }).storage?.estimate ===
        'function'
    ) {
      ;(navigator as Navigator & { storage: StorageManager }).storage
        .estimate()
        .then(estimate => {
          if (typeof estimate.quota === 'number') {
            storageQuota.value = estimate.quota
          }
          if (typeof estimate.usage === 'number') {
            storageUsage.value = estimate.usage
          }
        })
        .catch(() => {
          storageQuota.value = null
          storageUsage.value = null
        })
    }
  }

  function detectConnection() {
    type AnyConnection = {
      effectiveType?: string
      downlink?: number
      rtt?: number
      saveData?: boolean
      addEventListener?: (type: string, listener: () => void) => void
      removeEventListener?: (type: string, listener: () => void) => void
    }

    const navWithConnection = navigator as Navigator & {
      connection?: AnyConnection
      mozConnection?: AnyConnection
      webkitConnection?: AnyConnection
    }

    const connection: AnyConnection | undefined =
      navWithConnection.connection ||
      navWithConnection.mozConnection ||
      navWithConnection.webkitConnection

    const applyConnection = () => {
      if (!connection) return
      connectionType.value = connection.effectiveType ?? null
      connectionDownlink.value = connection.downlink ?? null
      connectionRtt.value = connection.rtt ?? null
      connectionSaveData.value = connection.saveData ?? null
    }

    applyConnection()
    if (connection?.addEventListener) {
      connection.addEventListener('change', applyConnection)
    }
  }

  function detectAll() {
    detectStorage()
    detectConnection()
  }

  // NEW: Detect WebSocket connectivity
  async function detectWebSocketConnectivity(): Promise<void> {
    webSocketSupported.value = 'WebSocket' in window

    if (!webSocketSupported.value) {
      webSocketCanConnect.value = false
      return
    }

    try {
      // Try to connect to a public echo server
      const ws = new WebSocket('wss://echo.websocket.org/')
      const startTime = performance.now()

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 5000)

        ws.onopen = () => {
          clearTimeout(timeout)
          const endTime = performance.now()
          webSocketLatency.value = Math.round(endTime - startTime)
          webSocketCanConnect.value = true
          webSocketError.value = null
          ws.close()
          resolve()
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('WebSocket connection failed'))
        }
      })
    } catch (err) {
      webSocketCanConnect.value = false
      webSocketError.value = (err as Error).message
    }
  }

  /**
   * Best-effort IPv6 reachability probe.
   * no-cors yields opaque responses, so success only means the browser did not
   * surface a network error (weak signal).
   */
  function detectIPv6Connectivity(): void {
    ipv6Supported.value = typeof window !== 'undefined'
    const ipv6TestUrl = 'https://ipv6.google.com/favicon.ico'

    fetch(ipv6TestUrl, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
      .then(() => {
        // Opaque success: request left the browser without a hard network failure
        ipv6CanConnect.value = true
      })
      .catch(() => {
        ipv6CanConnect.value = false
      })
  }

  return {
    // State
    localStorageEnabled,
    sessionStorageEnabled,
    storageQuota,
    storageUsage,
    connectionType,
    connectionDownlink,
    connectionRtt,
    connectionSaveData,
    // NEW state
    webSocketSupported,
    webSocketCanConnect,
    webSocketLatency,
    webSocketError,
    ipv6Supported,
    ipv6CanConnect,
    // Computed
    storageInfo,
    connectionInfo,
    webSocketConnectivity,
    ipv6Connectivity,
    // Actions
    detectAll,
    detectStorage,
    detectConnection,
    detectWebSocketConnectivity,
    detectIPv6Connectivity
  }
}
