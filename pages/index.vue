<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type AbuseContact = {
  name?: string
  address?: string
  email?: string
  phone?: string
}

type DatacenterInfo = {
  datacenter?: string
  network?: string
  country?: string
  region?: string
  city?: string
}

type CompanyInfo = {
  name?: string
  abuser_score?: unknown
  domain?: string
  type?: string
  network?: string
  whois?: string
}

type AsnInfo = {
  asn?: number
  abuser_score?: unknown
  route?: string
  descr?: string
  country?: string
  active?: boolean
  org?: string
  domain?: string
  abuse?: string
  type?: string
  created?: string
  updated?: string
  rir?: string
  whois?: string
}

type LocationInfo = {
  is_eu_member?: boolean
  calling_code?: string
  currency_code?: string
  continent?: string
  country?: string
  country_code?: string
  state?: string
  city?: string
  latitude?: number
  longitude?: number
  zip?: string
  timezone?: string
  local_time?: string
  local_time_unix?: number
  is_dst?: boolean
}

type IpApiResponse = {
  ip?: string
  rir?: string
  is_bogon?: boolean
  is_mobile?: boolean
  is_satellite?: boolean
  is_crawler?: boolean
  is_datacenter?: boolean
  is_tor?: boolean
  is_proxy?: boolean
  is_vpn?: boolean
  is_abuser?: boolean
  datacenter?: DatacenterInfo
  company?: CompanyInfo
  abuse?: AbuseContact
  asn?: AsnInfo
  location?: LocationInfo
  elapsed_ms?: number
  client_rtt_ms?: number
}

const ipInfo = ref<IpApiResponse | null>(null)
const ipError = ref<string | null>(null)
const loadingIp = ref(true)
const lastIp = ref<string | null>(null)

const userAgent = ref<string | null>(null)
const platform = ref<string | null>(null)
const languages = ref<string[]>([])
const online = ref<boolean | null>(null)
const doNotTrack = ref<string | null>(null)
const cookiesEnabled = ref<boolean | null>(null)
const localStorageEnabled = ref<boolean | null>(null)
const timezone = ref<string | null>(null)

const screenWidth = ref<number | null>(null)
const screenHeight = ref<number | null>(null)
const devicePixelRatio = ref<number | null>(null)

const colorDepth = ref<number | null>(null)
const hardwareConcurrency = ref<number | null>(null)
const maxTouchPoints = ref<number | null>(null)

// Network Information API (best-effort, not available in all browsers)
const connectionType = ref<string | null>(null)
const connectionDownlink = ref<number | null>(null)
const connectionRtt = ref<number | null>(null)
const connectionSaveData = ref<boolean | null>(null)

// Feature / API support matrix
const supportsServiceWorker = ref<boolean | null>(null)
const supportsNotifications = ref<boolean | null>(null)
const supportsClipboard = ref<boolean | null>(null)
const supportsGeolocation = ref<boolean | null>(null)
const supportsWebRTC = ref<boolean | null>(null)
const supportsWebGL = ref<boolean | null>(null)
const supportsWebGPU = ref<boolean | null>(null)
const supportsIndexedDB = ref<boolean | null>(null)

// Storage estimation
const storageQuota = ref<number | null>(null)
const storageUsage = ref<number | null>(null)

// Permissions status (best-effort)
const permissionGeolocation = ref<string | null>(null)
const permissionNotifications = ref<string | null>(null)
const permissionCamera = ref<string | null>(null)
const permissionMicrophone = ref<string | null>(null)
const permissionClipboardRead = ref<string | null>(null)

const permissionLastChecked = ref<Record<string, string>>({})

// UI toggles
const showRawIpPayload = ref(false)

// Export / share state
const copySummaryStatus = ref<'idle' | 'copied' | 'error'>('idle')
const copyDebugStatus = ref<'idle' | 'copied' | 'error'>('idle')

// Server-view comparison
const serverViewLoading = ref(false)
const serverViewError = ref<string | null>(null)
const serverViewData = ref<{
  ip: string | null
  httpVersion?: string
  headers?: {
    'user-agent'?: string
    'accept-language'?: string
    'x-forwarded-for'?: string | string[]
  }
} | null>(null)

// Reverse DNS
const reverseDnsLoading = ref(false)
const reverseDnsError = ref<string | null>(null)
const reverseDnsHostnames = ref<string[] | null>(null)
const reverseDnsResolver = ref<string>('')

// Privacy / fingerprint hints
const privacyNotes = computed(() => {
  const notes: string[] = []
  if (languages.value.length > 1) {
    notes.push('Multiple languages reported, which can increase fingerprint uniqueness.')
  }
  if (doNotTrack.value === '1' || doNotTrack.value === 'yes') {
    notes.push('Do Not Track is enabled.')
  }
  if (cookiesEnabled.value === false || localStorageEnabled.value === false) {
    notes.push('Some storage mechanisms are disabled; this may indicate a privacy-focused setup.')
  }
  if (supportsWebRTC.value === false) {
    notes.push('WebRTC APIs appear unavailable, which can reduce IP-leak surface.')
  }
  return notes
})

const fingerprintScore = computed<number | null>(() => {
  // Very rough, client-only heuristic; values are arbitrary and for demo purposes only.
  let score = 0

  if (languages.value.length > 1) score += 15
  if (gpuRenderer.value) score += 15
  if (supportsWebRTC.value) score += 10
  if (supportsNotifications.value) score += 5
  if (supportsClipboard.value) score += 5
  if (supportsIndexedDB.value) score += 5
  if (!doNotTrack.value) score += 5

  if (ipInfo.value?.location?.timezone && timezone.value && ipInfo.value.location.timezone !== timezone.value) {
    score += 10
  }

  if (score === 0) return 5
  return Math.max(0, Math.min(100, score))
})

const fingerprintBand = computed<'Low' | 'Medium' | 'High' | 'Unknown'>(() => {
  const s = fingerprintScore.value
  if (s == null) return 'Unknown'
  if (s < 30) return 'Low'
  if (s < 70) return 'Medium'
  return 'High'
})

const clockSkewMinutes = computed<number | null>(() => {
  const remote = ipInfo.value?.location?.local_time
  if (!remote) return null
  const remoteDate = new Date(remote)
  if (Number.isNaN(remoteDate.getTime())) return null
  const localDate = new Date()
  const diffMs = localDate.getTime() - remoteDate.getTime()
  return Math.round(diffMs / 60000)
})

const isHttps = computed(() => typeof window !== 'undefined' && window.location.protocol === 'https:')

async function runServerViewCheck() {
  serverViewError.value = null
  serverViewData.value = null
  serverViewLoading.value = true
  try {
    const res = await $fetch<{
      ip: string | null
      httpVersion?: string
      headers?: {
        'user-agent'?: string
        'accept-language'?: string
        'x-forwarded-for'?: string | string[]
      }
    }>('/api/server-info')
    serverViewData.value = res
  } catch (err) {
    serverViewError.value = (err as Error).message || 'Server view check failed.'
  } finally {
    serverViewLoading.value = false
  }
}

// GPU / WebGL renderer info
const gpuRenderer = ref<string | null>(null)
const gpuVendor = ref<string | null>(null)

// Connection / session history
const onlineEvents = ref<{ at: string; online: boolean }[]>([])

// Developer diagnostics
function logDiagnosticsToConsole() {
  // Intentionally verbose: this is for developers using the browser console.
  // eslint-disable-next-line no-console
  console.log('[Connection Inspector] snapshot', {
    ip: ipInfo.value,
    browser: {
      userAgent: userAgent.value,
      platform: platform.value,
      languages: languages.value
    },
    screen: {
      width: screenWidth.value,
      height: screenHeight.value,
      devicePixelRatio: devicePixelRatio.value
    },
    connection: {
      type: connectionType.value,
      downlink: connectionDownlink.value,
      rtt: connectionRtt.value,
      saveData: connectionSaveData.value
    },
    risk: {
      score: ipRiskScore.value,
      band: ipRiskBand.value
    }
  })
}

const jsEnabled = computed(() => true)

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

function formatAbuserScore(score: unknown): string {
  if (score == null) return 'Unknown'
  if (typeof score === 'number') return score.toString()
  if (typeof score === 'string') return score
  try {
    return JSON.stringify(score)
  } catch {
    return 'Unknown'
  }
}

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

const ipRiskBand = computed<'Low' | 'Medium' | 'High' | 'Unknown'>(() => {
  const s = ipRiskScore.value
  if (s == null) return 'Unknown'
  if (s < 30) return 'Low'
  if (s < 70) return 'Medium'
  return 'High'
})

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
      onlineEvents.value.push({
        at: new Date().toLocaleTimeString(),
        online: !!online.value
      })
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

function buildSnapshotSummary() {
  return {
    ip: ipInfo.value,
    browser: {
      userAgent: userAgent.value,
      platform: platform.value,
      languages: languages.value,
      online: online.value,
      doNotTrack: doNotTrack.value,
      cookiesEnabled: cookiesEnabled.value,
      timezone: timezone.value
    },
    screen: {
      width: screenWidth.value,
      height: screenHeight.value,
      devicePixelRatio: devicePixelRatio.value,
      colorDepth: colorDepth.value,
      hardwareConcurrency: hardwareConcurrency.value,
      maxTouchPoints: maxTouchPoints.value
    },
    connection: {
      type: connectionType.value,
      downlink: connectionDownlink.value,
      rtt: connectionRtt.value,
      saveData: connectionSaveData.value
    },
    storage: {
      localStorageEnabled: localStorageEnabled.value,
      quota: storageQuota.value,
      usage: storageUsage.value
    },
    features: {
      serviceWorker: supportsServiceWorker.value,
      notifications: supportsNotifications.value,
      clipboard: supportsClipboard.value,
      geolocation: supportsGeolocation.value,
      webRTC: supportsWebRTC.value,
      webGL: supportsWebGL.value,
      webGPU: supportsWebGPU.value,
      indexedDB: supportsIndexedDB.value
    },
    permissions: {
      geolocation: permissionGeolocation.value,
      notifications: permissionNotifications.value,
      camera: permissionCamera.value,
      microphone: permissionMicrophone.value,
      clipboardRead: permissionClipboardRead.value
    },
    risk: {
      score: ipRiskScore.value,
      band: ipRiskBand.value
    },
    meta: {
      generatedAt: new Date().toISOString()
    }
  }
}

async function copySummaryToClipboard() {
  copySummaryStatus.value = 'idle'
  const summary = buildSnapshotSummary()

  const text = JSON.stringify(summary, null, 2)

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      copySummaryStatus.value = 'copied'
      setTimeout(() => {
        copySummaryStatus.value = 'idle'
      }, 2000)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      copySummaryStatus.value = 'copied'
      setTimeout(() => {
        copySummaryStatus.value = 'idle'
      }, 2000)
    }
  } catch {
    copySummaryStatus.value = 'error'
    setTimeout(() => {
      copySummaryStatus.value = 'idle'
    }, 3000)
  }
}

function buildDebugSnippet() {
  const ip = ipInfo.value?.ip ?? 'Unknown IP'
  const locParts: string[] = []
  if (ipInfo.value?.location?.city) locParts.push(ipInfo.value.location.city)
  if (ipInfo.value?.location?.state) locParts.push(ipInfo.value.location.state)
  if (ipInfo.value?.location?.country) locParts.push(ipInfo.value.location.country)
  const location = locParts.join(', ') || 'Unknown location'

  const asn = ipInfo.value?.asn?.asn != null ? `AS${ipInfo.value.asn.asn}` : 'Unknown ASN'
  const org = ipInfo.value?.asn?.org ?? ipInfo.value?.company?.name ?? 'Unknown org'

  const riskFlags: string[] = []
  if (ipInfo.value?.is_tor) riskFlags.push('Tor')
  if (ipInfo.value?.is_vpn) riskFlags.push('VPN')
  if (ipInfo.value?.is_proxy) riskFlags.push('Proxy')
  if (ipInfo.value?.is_datacenter) riskFlags.push('Datacenter')
  if (ipInfo.value?.is_bogon) riskFlags.push('Bogon')

  const riskLine = riskFlags.length ? riskFlags.join(', ') : 'None reported'

  const browserLine = userAgent.value || 'Unknown browser'

  const screenLine =
    screenWidth.value && screenHeight.value
      ? `${screenWidth.value}x${screenHeight.value} @ ${devicePixelRatio.value ?? 1}x`
      : 'Unknown'

  const parts = [
    `IP: ${ip} (${location})`,
    `ASN/Org: ${asn} • ${org}`,
    `Risk flags: ${riskLine} • Gauge: ${ipRiskBand.value} (${ipRiskScore.value ?? 'n/a'}/100)`,
    `Browser: ${browserLine}`,
    `Screen: ${screenLine}`,
    `Timezone: ${timezone.value ?? 'Unknown'} • Languages: ${languages.value.join(', ') || 'Unknown'}`,
    `Generated at: ${new Date().toISOString()}`
  ]

  return parts.join('\n')
}

async function copyDebugSnippet() {
  copyDebugStatus.value = 'idle'
  const text = buildDebugSnippet()

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      copyDebugStatus.value = 'copied'
      setTimeout(() => {
        copyDebugStatus.value = 'idle'
      }, 2000)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      copyDebugStatus.value = 'copied'
      setTimeout(() => {
        copyDebugStatus.value = 'idle'
      }, 2000)
    }
  } catch {
    copyDebugStatus.value = 'error'
    setTimeout(() => {
      copyDebugStatus.value = 'idle'
    }, 3000)
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

function downloadSnapshotJson() {
  const summary = buildSnapshotSummary()
  const blob = new Blob([JSON.stringify(summary, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  a.href = url
  a.download = `connection-inspector-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function markPermissionChecked(name: string, state: string | null) {
  if (!state) return
  permissionLastChecked.value = {
    ...permissionLastChecked.value,
    [name]: `${state} @ ${new Date().toLocaleTimeString()}`
  }
}

async function requestGeolocationPermission() {
  if (!navigator.geolocation) return
  try {
    await new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (err) => reject(err),
        { maximumAge: 0, timeout: 10000 }
      )
    })
    permissionGeolocation.value = 'granted'
  } catch {
    permissionGeolocation.value = 'denied'
  } finally {
    markPermissionChecked('geolocation', permissionGeolocation.value)
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return
  try {
    const result = await Notification.requestPermission()
    permissionNotifications.value = result
  } catch {
    permissionNotifications.value = 'denied'
  } finally {
    markPermissionChecked('notifications', permissionNotifications.value)
  }
}

async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach((t) => t.stop())
    permissionCamera.value = 'granted'
  } catch {
    permissionCamera.value = 'denied'
  } finally {
    markPermissionChecked('camera', permissionCamera.value)
  }
}

async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    permissionMicrophone.value = 'granted'
  } catch {
    permissionMicrophone.value = 'denied'
  } finally {
    markPermissionChecked('microphone', permissionMicrophone.value)
  }
}

async function requestClipboardReadPermission() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      await navigator.clipboard.readText()
      permissionClipboardRead.value = 'granted'
    } else {
      permissionClipboardRead.value = 'unavailable'
    }
  } catch {
    permissionClipboardRead.value = 'denied'
  } finally {
    markPermissionChecked('clipboard-read', permissionClipboardRead.value)
  }
}

onMounted(() => {
  // Browser basics
  userAgent.value = navigator.userAgent
  platform.value = navigator.platform
  languages.value = (navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language]
  ).filter(Boolean)

  online.value = navigator.onLine
  doNotTrack.value =
    (navigator as Navigator & { doNotTrack?: string }).doNotTrack ??
    (window as Window & { doNotTrack?: string }).doNotTrack ??
    null
  cookiesEnabled.value = navigator.cookieEnabled
  timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null

  onlineEvents.value.push({
    at: new Date().toLocaleTimeString(),
    online: !!online.value
  })

  // Storage
  try {
    const key = '__connection_inspector_test__'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    localStorageEnabled.value = true
  } catch {
    localStorageEnabled.value = false
  }

  if ('storage' in navigator && typeof (navigator as Navigator & { storage?: StorageManager }).storage?.estimate === 'function') {
    ;(navigator as Navigator & { storage: StorageManager }).storage
      .estimate()
      .then((estimate) => {
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

  // Screen & device
  screenWidth.value = window.screen.width
  screenHeight.value = window.screen.height
  devicePixelRatio.value = window.devicePixelRatio || 1

  colorDepth.value = window.screen.colorDepth
  hardwareConcurrency.value = (navigator as Navigator & { hardwareConcurrency?: number })
    .hardwareConcurrency ?? null
  maxTouchPoints.value = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? null

  // Network Information API (if supported)
  type AnyConnection = {
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
    addEventListener?: (type: string, listener: () => void) => void
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

  // Feature / API support
  supportsServiceWorker.value = 'serviceWorker' in navigator
  supportsNotifications.value = 'Notification' in window
  supportsClipboard.value = !!navigator.clipboard
  supportsGeolocation.value = 'geolocation' in navigator
  supportsWebRTC.value = 'RTCPeerConnection' in window || 'mozRTCPeerConnection' in window || 'webkitRTCPeerConnection' in window
  supportsWebGL.value = (() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      return !!gl
    } catch {
      return false
    }
  })()
  supportsWebGPU.value = 'gpu' in navigator
  supportsIndexedDB.value = 'indexedDB' in window

  // Permissions (if supported)
  const navWithPermissions = navigator as Navigator & {
    permissions?: {
      query: (permissionDesc: { name: PermissionName | string }) => Promise<PermissionStatus>
    }
  }

  if (navWithPermissions.permissions) {
    const safeQuery = async (name: PermissionName | string, target: typeof permissionGeolocation) => {
      try {
        const status = await navWithPermissions.permissions!.query({ name })
        target.value = status.state
      } catch {
        target.value = 'unavailable'
      }
    }

    void safeQuery('geolocation', permissionGeolocation)
    void safeQuery('notifications', permissionNotifications)
    void safeQuery('camera', permissionCamera)
    void safeQuery('microphone', permissionMicrophone)
    void safeQuery('clipboard-read', permissionClipboardRead)
  } else {
    permissionGeolocation.value = 'unavailable'
    permissionNotifications.value = 'unavailable'
    permissionCamera.value = 'unavailable'
    permissionMicrophone.value = 'unavailable'
    permissionClipboardRead.value = 'unavailable'
  }

  // GPU / WebGL renderer (best-effort)
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        const vendor = gl.getParameter(
          (debugInfo as any).UNMASKED_VENDOR_WEBGL
        ) as string
        const renderer = gl.getParameter(
          (debugInfo as any).UNMASKED_RENDERER_WEBGL
        ) as string
        gpuVendor.value = vendor || null
        gpuRenderer.value = renderer || null
      } else {
        gpuRenderer.value = gl.getParameter(gl.RENDERER) as string
        gpuVendor.value = gl.getParameter(gl.VENDOR) as string
      }
    }
  } catch {
    gpuRenderer.value = null
    gpuVendor.value = null
  }

  // Online/offline event history
  window.addEventListener('online', () => {
    online.value = true
    onlineEvents.value.push({
      at: new Date().toLocaleTimeString(),
      online: true
    })
  })
  window.addEventListener('offline', () => {
    online.value = false
    onlineEvents.value.push({
      at: new Date().toLocaleTimeString(),
      online: false
    })
  })

  fetchIpInfo()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Top summary (IP + quick browser summary) -->
    <ConnectionOverview
      :loading-ip="loadingIp"
      :ip-info="ipInfo"
      :ip-error="ipError"
      :is-https="isHttps"
      :ip-status-label="ipStatusLabel"
      :ip-status-tone="ipStatusTone"
      :ip-risk-score="ipRiskScore"
      :ip-risk-band="ipRiskBand"
      :user-agent="userAgent"
      :cookies-enabled="cookiesEnabled"
      :online="online"
      :timezone="timezone"
      :languages="languages"
      :do-not-track="doNotTrack"
      :supports-service-worker="supportsServiceWorker"
      :supports-notifications="supportsNotifications"
      :supports-clipboard="supportsClipboard"
      :supports-geolocation="supportsGeolocation"
      :supports-web-r-t-c="supportsWebRTC"
      :supports-web-g-l="supportsWebGL"
      :supports-web-g-p-u="supportsWebGPU"
      :supports-indexed-d-b="supportsIndexedDB"
      :online-events="onlineEvents"
      :permission-geolocation="permissionGeolocation"
      :permission-notifications="permissionNotifications"
      :permission-camera="permissionCamera"
      :permission-microphone="permissionMicrophone"
      :permission-clipboard-read="permissionClipboardRead"
      :permission-last-checked="permissionLastChecked"
      :server-view-loading="serverViewLoading"
      :server-view-error="serverViewError"
      :server-view-data="serverViewData"
      :copy-summary-status="copySummaryStatus"
      :copy-debug-status="copyDebugStatus"
      :request-geolocation-permission="requestGeolocationPermission"
      :request-notification-permission="requestNotificationPermission"
      :request-camera-permission="requestCameraPermission"
      :request-microphone-permission="requestMicrophonePermission"
      :request-clipboard-read-permission="requestClipboardReadPermission"
      :run-server-view-check="runServerViewCheck"
      :copy-summary-to-clipboard="copySummaryToClipboard"
      :download-snapshot-json="downloadSnapshotJson"
      :copy-debug-snippet="copyDebugSnippet"
    />

    <!-- Detailed sections -->
    <section class="grid gap-4 md:grid-cols-2">
      <!-- Network / IP details -->
      <NetworkIpDetails
        :loading-ip="loadingIp"
        :ip-info="ipInfo"
        :connection-type="connectionType"
        :connection-downlink="connectionDownlink"
        :connection-rtt="connectionRtt"
        :connection-save-data="connectionSaveData"
        :reverse-dns-loading="reverseDnsLoading"
        :reverse-dns-error="reverseDnsError"
        :reverse-dns-hostnames="reverseDnsHostnames"
        :fetch-ip-info="fetchIpInfo"
        :run-reverse-dns-lookup="runReverseDnsLookup"
      />

      <!-- Screen & device details -->
      <ScreenDeviceDetails
        :screen-width="screenWidth"
        :screen-height="screenHeight"
        :device-pixel-ratio="devicePixelRatio"
        :color-depth="colorDepth"
        :hardware-concurrency="hardwareConcurrency"
        :max-touch-points="maxTouchPoints"
        :platform="platform"
        :gpu-renderer="gpuRenderer"
        :gpu-vendor="gpuVendor"
        :local-storage-enabled="localStorageEnabled"
        :storage-quota="storageQuota"
        :storage-usage="storageUsage"
        :languages="languages"
        :cookies-enabled="cookiesEnabled"
        :do-not-track="doNotTrack"
        :privacy-notes="privacyNotes"
        :fingerprint-band="fingerprintBand"
        :fingerprint-score="fingerprintScore"
        :log-diagnostics-to-console="logDiagnosticsToConsole"
      />
    </section>
  </div>
</template>


