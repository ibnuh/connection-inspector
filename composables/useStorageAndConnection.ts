import { ref, computed } from 'vue'
import type { StorageInfo, ConnectionInfo, WebSocketConnectivity, IPv6Connectivity } from '@/types'

const WS_ENDPOINTS = ['wss://echo.websocket.events', 'wss://ws.postman-echo.com/raw']

export function useStorageAndConnection() {
  const localStorageEnabled = ref<boolean | null>(null)
  const sessionStorageEnabled = ref<boolean | null>(null)
  const storageQuota = ref<number | null>(null)
  const storageUsage = ref<number | null>(null)

  const connectionType = ref<string | null>(null)
  const connectionDownlink = ref<number | null>(null)
  const connectionRtt = ref<number | null>(null)
  const connectionSaveData = ref<boolean | null>(null)
  const connectionApiAvailable = ref<boolean | null>(null)

  const webSocketSupported = ref<boolean | null>(null)
  const webSocketCanConnect = ref<boolean | null>(null)
  const webSocketLatency = ref<number | null>(null)
  const webSocketError = ref<string | null>(null)
  const webSocketEndpoint = ref<string | null>(null)

  const ipv6Supported = ref<boolean | null>(null)
  const ipv6CanConnect = ref<boolean | null>(null)
  const ipv6Confidence = ref<'high' | 'low' | 'none' | null>(null)

  let connectionChangeHandler: (() => void) | null = null
  let connectionRef: {
    addEventListener?: (type: string, listener: () => void) => void
    removeEventListener?: (type: string, listener: () => void) => void
  } | null = null

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
    testUrl: 'https://ipv6.google.com/favicon.ico'
  }))

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

    connectionApiAvailable.value = !!connection

    if (!connection) {
      connectionType.value = null
      connectionDownlink.value = null
      connectionRtt.value = null
      connectionSaveData.value = null
      return
    }

    const applyConnection = () => {
      connectionType.value = connection.effectiveType ?? null
      connectionDownlink.value =
        typeof connection.downlink === 'number' ? connection.downlink : null
      connectionRtt.value = typeof connection.rtt === 'number' ? connection.rtt : null
      connectionSaveData.value =
        typeof connection.saveData === 'boolean' ? connection.saveData : null
    }

    applyConnection()
    connectionRef = connection
    connectionChangeHandler = applyConnection
    connection.addEventListener?.('change', applyConnection)
  }

  function cleanup() {
    if (connectionRef && connectionChangeHandler) {
      connectionRef.removeEventListener?.('change', connectionChangeHandler)
    }
    connectionChangeHandler = null
    connectionRef = null
  }

  function detectAll() {
    detectStorage()
    detectConnection()
  }

  function tryWebSocket(url: string, timeoutMs = 5000): Promise<number> {
    return new Promise((resolve, reject) => {
      let settled = false
      const ws = new WebSocket(url)
      const start = performance.now()
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true
          try {
            ws.close()
          } catch {
            // ignore
          }
          reject(new Error(`Timeout connecting to ${url}`))
        }
      }, timeoutMs)

      ws.onopen = () => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timer)
        const latency = Math.round(performance.now() - start)
        try {
          ws.close()
        } catch {
          // ignore
        }
        resolve(latency)
      }

      ws.onerror = () => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timer)
        try {
          ws.close()
        } catch {
          // ignore
        }
        reject(new Error(`WebSocket error for ${url}`))
      }
    })
  }

  async function detectWebSocketConnectivity(): Promise<void> {
    webSocketSupported.value = 'WebSocket' in window
    webSocketEndpoint.value = null

    if (!webSocketSupported.value) {
      webSocketCanConnect.value = false
      webSocketError.value = 'WebSocket API not available'
      return
    }

    const errors: string[] = []
    for (const url of WS_ENDPOINTS) {
      try {
        const latency = await tryWebSocket(url)
        webSocketCanConnect.value = true
        webSocketLatency.value = latency
        webSocketError.value = null
        webSocketEndpoint.value = url
        return
      } catch (err) {
        errors.push((err as Error).message)
      }
    }

    webSocketCanConnect.value = false
    webSocketLatency.value = null
    webSocketError.value = errors[errors.length - 1] || 'All WebSocket probes failed'
  }

  /**
   * IPv6 reachability via image load against an IPv6-only host.
   * Confidence is low because CDN/firewall can fail for non-IPv6 reasons.
   * Also sets supported=true if the runtime can represent IPv6 (always true in modern browsers).
   */
  function detectIPv6Connectivity(): Promise<void> {
    ipv6Supported.value = true
    ipv6Confidence.value = null

    return new Promise(resolve => {
      const img = new Image()
      const url = `https://ipv6.google.com/favicon.ico?_=${Date.now()}`
      let settled = false

      const finish = (ok: boolean) => {
        if (settled) {
          return
        }
        settled = true
        ipv6CanConnect.value = ok
        ipv6Confidence.value = 'low'
        resolve()
      }

      const timer = setTimeout(() => {
        img.src = ''
        finish(false)
      }, 4000)

      img.onload = () => {
        clearTimeout(timer)
        finish(true)
      }
      img.onerror = () => {
        clearTimeout(timer)
        finish(false)
      }
      img.src = url
    })
  }

  return {
    localStorageEnabled,
    sessionStorageEnabled,
    storageQuota,
    storageUsage,
    connectionType,
    connectionDownlink,
    connectionRtt,
    connectionSaveData,
    connectionApiAvailable,
    webSocketSupported,
    webSocketCanConnect,
    webSocketLatency,
    webSocketError,
    webSocketEndpoint,
    ipv6Supported,
    ipv6CanConnect,
    ipv6Confidence,
    storageInfo,
    connectionInfo,
    webSocketConnectivity,
    ipv6Connectivity,
    detectAll,
    detectStorage,
    detectConnection,
    detectWebSocketConnectivity,
    detectIPv6Connectivity,
    cleanup
  }
}
