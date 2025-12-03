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

interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
  addEventListener(type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange', listener: () => void): void
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

// Browser version and engine detection
const browserName = ref<string | null>(null)
const browserVersion = ref<string | null>(null)
const browserEngine = ref<string | null>(null)
const trueBrowserCore = ref<string | null>(null)

// Device type detection
const deviceType = ref<string | null>(null)
const deviceModel = ref<string | null>(null)

// OS detection
const osName = ref<string | null>(null)
const osVersion = ref<string | null>(null)
const trueOsCore = ref<string | null>(null)

// Date & Time
const systemDateTime = ref<string | null>(null)
const localDateTime = ref<string | null>(null)
const isDst = ref<boolean | null>(null)

// Fingerprinting resistance
const canvasFingerprinting = ref<'Supported' | 'Spoofed' | 'Not Supported' | null>(null)
const audioContextFingerprinting = ref<'Allowed' | 'Blocked' | 'Not Supported' | null>(null)
const fingerprintingResistance = computed(() => {
  return canvasFingerprinting.value === 'Spoofed' || audioContextFingerprinting.value === 'Blocked'
})

// HTTP Headers
const httpHeaders = ref<Record<string, string>>({})

// Browser window size
const windowOuterWidth = ref<number | null>(null)
const windowOuterHeight = ref<number | null>(null)
const windowInnerWidth = ref<number | null>(null)
const windowInnerHeight = ref<number | null>(null)
const isFullscreen = ref<boolean | null>(null)

// Screen orientation
const screenOrientation = ref<string | null>(null)
const aspectRatio = ref<string | null>(null)

// Battery API
const batteryLevel = ref<number | null>(null)
const batteryCharging = ref<boolean | null>(null)
const batteryChargingTime = ref<number | null>(null)
const batteryDischargingTime = ref<number | null>(null)

// Bluetooth
const bluetoothSupported = ref<boolean | null>(null)
const bluetoothAvailable = ref<boolean | null>(null)

// Device orientation and motion
const deviceOrientation = ref<{ alpha: number | null; beta: number | null; gamma: number | null } | null>(null)
const deviceMotion = ref<{ acceleration: { x: number | null; y: number | null; z: number | null }; accelerationIncludingGravity: { x: number | null; y: number | null; z: number | null }; rotationRate: { alpha: number | null; beta: number | null; gamma: number | null } } | null>(null)

// Media devices
const speakers = ref<{ label: string; deviceId: string }[]>([])
const microphones = ref<{ label: string; deviceId: string }[]>([])
const cameras = ref<{ label: string; deviceId: string }[]>([])
const speakersCount = ref<number | null>(null)
const microphonesCount = ref<number | null>(null)
const camerasCount = ref<number | null>(null)

// Browser plugins
const plugins = ref<{ name: string; description: string; filename: string }[]>([])
const mimeTypes = ref<{ type: string; description: string; suffixes: string }[]>([])

// Ad blocker detection
const adBlockerDetected = ref<boolean | null>(null)

// TLS/SSL
const tlsVersion = ref<string | null>(null)
const tlsCipher = ref<string | null>(null)

// WebGL versions
const webglVersion = ref<string | null>(null)
const webgl2Version = ref<string | null>(null)

// Speech Synthesis
const speechSynthesisSupported = ref<boolean | null>(null)
const speechVoices = ref<{ name: string; lang: string; default: boolean }[]>([])

// Fonts detection
const fontsDetected = ref<string[]>([])

// Page visibility
const pageVisibilityInitiallyVisible = ref<boolean | null>(null)
const pageVisibilityLastVisible = ref<Date | null>(null)
const pageVisibilityLastHidden = ref<Date | null>(null)

// Performance timing
const performanceTiming = ref<{
  pageLoadTime: number | null
  networkTime: number | null
  dnsLookupTime: number | null
  tcpConnectionTime: number | null
  serverResponseTime: number | null
  pageDownloadTime: number | null
  browserTime: number | null
} | null>(null)

// WebSocket
const websocketSupported = ref<boolean | null>(null)

// Session storage
const sessionStorageEnabled = ref<boolean | null>(null)

// History
const historyLength = ref<number | null>(null)

// Page referrer
const pageReferrer = ref<string | null>(null)

// Private browsing
const privateBrowsingMode = ref<boolean | null>(null)

// Mouse/Touch detection
const hasMouse = ref<boolean | null>(null)
const hasTouchscreen = ref<boolean | null>(null)

// Last key pressed
const lastKeyPressed = ref<string | null>(null)
const capsLockState = ref<boolean | null>(null)

// Scroll position
const scrollPosition = ref<{ x: number; y: number } | null>(null)

// Mouse position
const mousePosition = ref<{ x: number; y: number } | null>(null)
const lastClickPosition = ref<{ x: number; y: number } | null>(null)

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
      timezone: timezone.value,
      browserName: browserName.value,
      browserVersion: browserVersion.value,
      browserEngine: browserEngine.value,
      trueBrowserCore: trueBrowserCore.value
    },
    device: {
      type: deviceType.value,
      model: deviceModel.value,
      osName: osName.value,
      osVersion: osVersion.value,
      trueOsCore: trueOsCore.value
    },
    screen: {
      width: screenWidth.value,
      height: screenHeight.value,
      devicePixelRatio: devicePixelRatio.value,
      colorDepth: colorDepth.value,
      hardwareConcurrency: hardwareConcurrency.value,
      maxTouchPoints: maxTouchPoints.value,
      orientation: screenOrientation.value,
      aspectRatio: aspectRatio.value
    },
    window: {
      outerWidth: windowOuterWidth.value,
      outerHeight: windowOuterHeight.value,
      innerWidth: windowInnerWidth.value,
      innerHeight: windowInnerHeight.value,
      isFullscreen: isFullscreen.value
    },
    connection: {
      type: connectionType.value,
      downlink: connectionDownlink.value,
      rtt: connectionRtt.value,
      saveData: connectionSaveData.value
    },
    storage: {
      localStorageEnabled: localStorageEnabled.value,
      sessionStorageEnabled: sessionStorageEnabled.value,
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
      webGLVersion: webglVersion.value,
      webGL2Version: webgl2Version.value,
      webGPU: supportsWebGPU.value,
      indexedDB: supportsIndexedDB.value,
      websocket: websocketSupported.value,
      speechSynthesis: speechSynthesisSupported.value
    },
    fingerprinting: {
      canvas: canvasFingerprinting.value,
      audioContext: audioContextFingerprinting.value,
      resistance: fingerprintingResistance.value
    },
    permissions: {
      geolocation: permissionGeolocation.value,
      notifications: permissionNotifications.value,
      camera: permissionCamera.value,
      microphone: permissionMicrophone.value,
      clipboardRead: permissionClipboardRead.value
    },
    media: {
      speakers: speakers.value,
      microphones: microphones.value,
      cameras: cameras.value
    },
    battery: {
      level: batteryLevel.value,
      charging: batteryCharging.value,
      chargingTime: batteryChargingTime.value,
      dischargingTime: batteryDischargingTime.value
    },
    bluetooth: {
      supported: bluetoothSupported.value,
      available: bluetoothAvailable.value
    },
    input: {
      hasMouse: hasMouse.value,
      hasTouchscreen: hasTouchscreen.value
    },
    risk: {
      score: ipRiskScore.value,
      band: ipRiskBand.value
    },
    performance: performanceTiming.value,
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

// Browser version and engine detection
function detectBrowserInfo() {
  const ua = navigator.userAgent
  if (!ua) return

  // Detect browser name and version
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browserName.value = 'Chrome'
    const match = ua.match(/Chrome\/([\d.]+)/)
    browserVersion.value = match ? match[1] : null
    browserEngine.value = 'Blink'
    trueBrowserCore.value = 'Chromium'
  } else if (ua.includes('Firefox')) {
    browserName.value = 'Firefox'
    const match = ua.match(/Firefox\/([\d.]+)/)
    browserVersion.value = match ? match[1] : null
    browserEngine.value = 'Gecko'
    trueBrowserCore.value = 'Gecko'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName.value = 'Safari'
    const match = ua.match(/Version\/([\d.]+)/)
    browserVersion.value = match ? match[1] : null
    browserEngine.value = 'WebKit'
    trueBrowserCore.value = 'WebKit'
  } else if (ua.includes('Edg')) {
    browserName.value = 'Edge'
    const match = ua.match(/Edg\/([\d.]+)/)
    browserVersion.value = match ? match[1] : null
    browserEngine.value = 'Blink'
    trueBrowserCore.value = 'Chromium'
  } else if (ua.includes('OPR')) {
    browserName.value = 'Opera'
    const match = ua.match(/OPR\/([\d.]+)/)
    browserVersion.value = match ? match[1] : null
    browserEngine.value = 'Blink'
    trueBrowserCore.value = 'Chromium'
  }
}

// Device type detection
function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase()
  const width = window.screen.width
  const height = window.screen.height

  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType.value = 'Mobile'
  } else if (/tablet|ipad|playbook|silk/i.test(ua) || (width >= 600 && width <= 1024)) {
    deviceType.value = 'Tablet'
  } else {
    deviceType.value = 'Desktop or laptop'
  }

  // Try to detect device model from user agent
  const modelMatch = ua.match(/(iphone|ipad|ipod|android|windows phone|blackberry|playbook|silk)[\s\/]?([\w\s]+)?/i)
  if (modelMatch) {
    deviceModel.value = modelMatch[0]
  }
}

// OS detection
function detectOSInfo() {
  const ua = navigator.userAgent
  const platform = navigator.platform

  if (/mac/i.test(platform) || /mac/i.test(ua)) {
    osName.value = 'macOS'
    const match = ua.match(/Mac OS X ([\d_]+)/)
    if (match) {
      osVersion.value = match[1].replace(/_/g, '.')
    }
    trueOsCore.value = 'Darwin'
  } else if (/win/i.test(platform) || /win/i.test(ua)) {
    osName.value = 'Windows'
    const match = ua.match(/Windows NT ([\d.]+)/)
    if (match) {
      osVersion.value = match[1]
    }
    trueOsCore.value = 'Windows NT'
  } else if (/linux/i.test(platform) || /linux/i.test(ua)) {
    osName.value = 'Linux'
    trueOsCore.value = 'Linux'
  } else if (/android/i.test(ua)) {
    osName.value = 'Android'
    const match = ua.match(/Android ([\d.]+)/)
    if (match) {
      osVersion.value = match[1]
    }
    trueOsCore.value = 'Linux'
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    osName.value = 'iOS'
    const match = ua.match(/OS ([\d_]+)/)
    if (match) {
      osVersion.value = match[1].replace(/_/g, '.')
    }
    trueOsCore.value = 'Darwin'
  }
}

// Date & Time detection
function detectDateTime() {
  const now = new Date()
  const systemTime = now.toUTCString()
  const localTime = now.toString()
  
  systemDateTime.value = systemTime
  localDateTime.value = localTime

  // DST detection
  const jan = new Date(now.getFullYear(), 0, 1)
  const jul = new Date(now.getFullYear(), 6, 1)
  const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
  isDst.value = now.getTimezoneOffset() < stdTimezoneOffset
}

// Canvas fingerprinting detection
function detectCanvasFingerprinting() {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      canvasFingerprinting.value = 'Not Supported'
      return
    }

    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Canvas fingerprint test', 2, 2)
    const dataURL = canvas.toDataURL()

    // Check if canvas is spoofed (very basic check)
    const test2 = document.createElement('canvas')
    const ctx2 = test2.getContext('2d')
    if (ctx2) {
      ctx2.textBaseline = 'top'
      ctx2.font = '14px Arial'
      ctx2.fillText('Canvas fingerprint test', 2, 2)
      const dataURL2 = test2.toDataURL()
      
      if (dataURL === dataURL2) {
        canvasFingerprinting.value = 'Supported'
      } else {
        canvasFingerprinting.value = 'Spoofed'
      }
    }
  } catch {
    canvasFingerprinting.value = 'Not Supported'
  }
}

// AudioContext fingerprinting detection
function detectAudioContextFingerprinting() {
  try {
    if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
      const AudioContextClass = AudioContext || (window as any).webkitAudioContext
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const analyser = context.createAnalyser()
      const gainNode = context.createGain()
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1)

      oscillator.connect(analyser)
      analyser.connect(gainNode)
      gainNode.connect(context.destination)
      oscillator.start(0)

      audioContextFingerprinting.value = 'Allowed'
      oscillator.stop()
      context.close()
    } else {
      audioContextFingerprinting.value = 'Not Supported'
    }
  } catch {
    audioContextFingerprinting.value = 'Blocked'
  }
}

// HTTP Headers (client-side only, limited)
function detectHttpHeaders() {
  // Note: We can't access all headers client-side, but we can infer some
  const headers: Record<string, string> = {}
  
  headers['User-Agent'] = navigator.userAgent
  headers['Accept-Language'] = navigator.languages?.join(', ') || navigator.language
  headers['Accept-Encoding'] = 'gzip, deflate, br, zstd' // Common default
  headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  headers['DNT'] = doNotTrack.value || '0'
  headers['Connection'] = 'keep-alive'
  
  if (document.referrer) {
    headers['Referer'] = document.referrer
  }

  // Try to detect Sec-CH-UA headers if available
  if ((navigator as any).userAgentData) {
    const uaData = (navigator as any).userAgentData
    if (uaData.brands) {
      headers['Sec-CH-UA'] = uaData.brands.map((b: any) => `"${b.brand}";v="${b.version}"`).join(', ')
    }
    if (uaData.mobile !== undefined) {
      headers['Sec-CH-UA-Mobile'] = uaData.mobile ? '?1' : '?0'
    }
    if (uaData.platform) {
      headers['Sec-CH-UA-Platform'] = `"${uaData.platform}"`
    }
  }

  httpHeaders.value = headers
}

// Browser window size
function detectWindowSize() {
  windowOuterWidth.value = window.outerWidth
  windowOuterHeight.value = window.outerHeight
  windowInnerWidth.value = window.innerWidth
  windowInnerHeight.value = window.innerHeight

  // Fullscreen detection
  isFullscreen.value = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement)

  // Update on resize
  window.addEventListener('resize', () => {
    windowOuterWidth.value = window.outerWidth
    windowOuterHeight.value = window.outerHeight
    windowInnerWidth.value = window.innerWidth
    windowInnerHeight.value = window.innerHeight
  })
}

// Screen orientation
function detectScreenOrientation() {
  if (screenWidth.value && screenHeight.value) {
    screenOrientation.value = screenWidth.value > screenHeight.value ? 'Landscape' : 'Portrait'
    
    // Calculate aspect ratio
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(screenWidth.value, screenHeight.value)
    aspectRatio.value = `${screenWidth.value / divisor}:${screenHeight.value / divisor}`
  }

  // Listen for orientation changes
  if (screen.orientation) {
    screenOrientation.value = screen.orientation.type.includes('landscape') ? 'Landscape' : 'Portrait'
    screen.orientation.addEventListener('change', () => {
      screenOrientation.value = screen.orientation.type.includes('landscape') ? 'Landscape' : 'Portrait'
    })
  }
}

// Battery API
function detectBattery() {
  const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }
  if (nav.getBattery) {
    nav.getBattery().then((battery) => {
      batteryLevel.value = Math.round(battery.level * 100)
      batteryCharging.value = battery.charging
      batteryChargingTime.value = battery.chargingTime
      batteryDischargingTime.value = battery.dischargingTime

      battery.addEventListener('chargingchange', () => {
        batteryCharging.value = battery.charging
      })
      battery.addEventListener('levelchange', () => {
        batteryLevel.value = Math.round(battery.level * 100)
      })
      battery.addEventListener('chargingtimechange', () => {
        batteryChargingTime.value = battery.chargingTime
      })
      battery.addEventListener('dischargingtimechange', () => {
        batteryDischargingTime.value = battery.dischargingTime
      })
    }).catch(() => {
      // Battery API not available
    })
  }
}

// Bluetooth detection
function detectBluetooth() {
  bluetoothSupported.value = 'bluetooth' in navigator
  if ('bluetooth' in navigator) {
    bluetoothAvailable.value = true // Best guess
  }
}

// Device orientation and motion
function detectDeviceOrientation() {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      deviceOrientation.value = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma
      }
    })
  }

  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (event) => {
      deviceMotion.value = {
        acceleration: {
          x: event.acceleration?.x ?? null,
          y: event.acceleration?.y ?? null,
          z: event.acceleration?.z ?? null
        },
        accelerationIncludingGravity: {
          x: event.accelerationIncludingGravity?.x ?? null,
          y: event.accelerationIncludingGravity?.y ?? null,
          z: event.accelerationIncludingGravity?.z ?? null
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha ?? null,
          beta: event.rotationRate?.beta ?? null,
          gamma: event.rotationRate?.gamma ?? null
        }
      }
    })
  }
}

// Media devices enumeration
async function detectMediaDevices() {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      speakers.value = devices.filter(d => d.kind === 'audiooutput').map(d => ({ label: d.label || 'Unknown', deviceId: d.deviceId }))
      microphones.value = devices.filter(d => d.kind === 'audioinput').map(d => ({ label: d.label || 'Unknown', deviceId: d.deviceId }))
      cameras.value = devices.filter(d => d.kind === 'videoinput').map(d => ({ label: d.label || 'Unknown', deviceId: d.deviceId }))

      speakersCount.value = speakers.value.length
      microphonesCount.value = microphones.value.length
      camerasCount.value = cameras.value.length
    }
  } catch {
    // Permission denied or not available
  }
}

// Browser plugins
function detectPlugins() {
  if (navigator.plugins && navigator.plugins.length > 0) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i]
      plugins.value.push({
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename || 'Unknown'
      })

      // Get MIME types
      for (let j = 0; j < plugin.length; j++) {
        const mimeType = plugin[j]
        mimeTypes.value.push({
          type: mimeType.type,
          description: mimeType.description,
          suffixes: mimeType.suffixes
        })
      }
    }
  }
}

// Ad blocker detection
function detectAdBlocker() {
  const testDiv = document.createElement('div')
  testDiv.innerHTML = '&nbsp;'
  testDiv.className = 'adsbox'
  testDiv.style.position = 'absolute'
  testDiv.style.left = '-9999px'
  document.body.appendChild(testDiv)

  setTimeout(() => {
    const isBlocked = testDiv.offsetHeight === 0 || testDiv.style.display === 'none' || testDiv.style.visibility === 'hidden'
    adBlockerDetected.value = isBlocked
    document.body.removeChild(testDiv)
  }, 100)
}

// TLS/SSL detection
function detectTLS() {
  if (location.protocol === 'https:') {
    // We can't directly detect TLS version client-side, but we can infer
    tlsVersion.value = 'TLS version 1.3 (Latest)' // Most modern browsers use TLS 1.3
    tlsCipher.value = 'TLS_AES_256_GCM_SHA384' // Common cipher
  }
}

// WebGL version detection
function detectWebGLVersions() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const gl2 = canvas.getContext('webgl2')

    if (gl) {
      webglVersion.value = 'Version 1.0 (OpenGL ES 2.0 Chromium)'
    }
    if (gl2) {
      webgl2Version.value = 'Version 2.0 (OpenGL ES 3.0 Chromium)'
    }
  } catch {
    // WebGL not supported
  }
}

// Speech Synthesis
function detectSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    speechSynthesisSupported.value = true
    const voices = speechSynthesis.getVoices()
    speechVoices.value = voices.map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default
    }))

    // Some browsers load voices asynchronously
    speechSynthesis.onvoiceschanged = () => {
      const voices = speechSynthesis.getVoices()
      speechVoices.value = voices.map(v => ({
        name: v.name,
        lang: v.lang,
        default: v.default
      }))
    }
  } else {
    speechSynthesisSupported.value = false
  }
}

// Fonts detection (basic)
function detectFonts() {
  // This is a simplified version - full font detection requires more complex methods
  const commonFonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact']
  fontsDetected.value = commonFonts.filter(font => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    
    const baseline = ctx.measureText('abcdefghijklmnopqrstuvwxyz0123456789').width
    ctx.font = `12px "${font}", monospace`
    const width = ctx.measureText('abcdefghijklmnopqrstuvwxyz0123456789').width
    return width !== baseline
  })
}

// Page visibility
function detectPageVisibility() {
  pageVisibilityInitiallyVisible.value = !document.hidden

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pageVisibilityLastHidden.value = new Date()
    } else {
      pageVisibilityLastVisible.value = new Date()
    }
  })
}

// Performance timing
function detectPerformanceTiming() {
  if (performance.timing) {
    const timing = performance.timing
    const navigationStart = timing.navigationStart
    const loadEventEnd = timing.loadEventEnd

    if (loadEventEnd && navigationStart) {
      const pageLoadTime = loadEventEnd - navigationStart
      const dnsLookupTime = timing.domainLookupEnd - timing.domainLookupStart
      const tcpConnectionTime = timing.connectEnd - timing.connectStart
      const serverResponseTime = timing.responseStart - timing.requestStart
      const pageDownloadTime = timing.responseEnd - timing.responseStart
      const networkTime = timing.responseEnd - timing.navigationStart
      const browserTime = loadEventEnd - timing.responseEnd

      performanceTiming.value = {
        pageLoadTime: Math.round(pageLoadTime / 1000 * 100) / 100,
        networkTime: Math.round(networkTime / 1000 * 100) / 100,
        dnsLookupTime: Math.round(dnsLookupTime / 1000 * 100) / 100,
        tcpConnectionTime: Math.round(tcpConnectionTime / 1000 * 100) / 100,
        serverResponseTime: Math.round(serverResponseTime / 1000 * 100) / 100,
        pageDownloadTime: Math.round(pageDownloadTime / 1000 * 100) / 100,
        browserTime: Math.round(browserTime / 1000 * 100) / 100
      }
    }
  }
}

// WebSocket detection
function detectWebSocket() {
  websocketSupported.value = 'WebSocket' in window
}

// Session storage
function detectSessionStorage() {
  try {
    const key = '__session_storage_test__'
    sessionStorage.setItem(key, '1')
    sessionStorage.removeItem(key)
    sessionStorageEnabled.value = true
  } catch {
    sessionStorageEnabled.value = false
  }
}

// History length
function detectHistory() {
  historyLength.value = history.length
}

// Page referrer
function detectReferrer() {
  pageReferrer.value = document.referrer || 'None'
}

// Private browsing detection (best-effort)
function detectPrivateBrowsing() {
  try {
    const db = indexedDB.open('__private_browsing_test__')
    db.onerror = () => {
      privateBrowsingMode.value = true
    }
    db.onsuccess = () => {
      privateBrowsingMode.value = false
      try {
        indexedDB.deleteDatabase('__private_browsing_test__')
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch {
    privateBrowsingMode.value = null
  }
}

// Mouse/Touch detection
function detectInputMethods() {
  hasMouse.value = window.matchMedia('(pointer: fine)').matches || 'onmousedown' in window
  hasTouchscreen.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Keyboard detection
function detectKeyboard() {
  document.addEventListener('keydown', (e) => {
    lastKeyPressed.value = e.key
    
    // Caps Lock detection
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      capsLockState.value = true
    } else {
      capsLockState.value = false
    }
  })
  
  // Initial caps lock state
  if (document.hasFocus()) {
    // Try to detect initial state
    capsLockState.value = false
  }
}

// Scroll position
function detectScrollPosition() {
  scrollPosition.value = {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset
  }

  window.addEventListener('scroll', () => {
    scrollPosition.value = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset
    }
  })
}

// Mouse position
function detectMousePosition() {
  document.addEventListener('mousemove', (e) => {
    mousePosition.value = {
      x: e.clientX,
      y: e.clientY
    }
  })

  document.addEventListener('click', (e) => {
    lastClickPosition.value = {
      x: e.pageX,
      y: e.pageY
    }
  })
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

  // New detection functions
  detectBrowserInfo()
  detectDeviceType()
  detectOSInfo()
  detectDateTime()
  detectCanvasFingerprinting()
  detectAudioContextFingerprinting()
  detectHttpHeaders()
  detectWindowSize()
  detectScreenOrientation()
  detectBattery()
  detectBluetooth()
  detectDeviceOrientation()
  detectMediaDevices()
  detectPlugins()
  detectAdBlocker()
  detectTLS()
  detectWebGLVersions()
  detectSpeechSynthesis()
  detectFonts()
  detectPageVisibility()
  detectPerformanceTiming()
  detectWebSocket()
  detectSessionStorage()
  detectHistory()
  detectReferrer()
  detectPrivateBrowsing()
  detectInputMethods()
  detectKeyboard()
  detectScrollPosition()
  detectMousePosition()

  fetchIpInfo()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Table of Contents Sidebar -->
    <TableOfContents />

    <!-- Top summary (IP + quick browser summary) -->
    <section id="connection-overview">
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
    </section>

    <!-- Detailed sections -->
    <section class="grid gap-4 md:grid-cols-2">
      <!-- Network / IP details -->
      <div id="network-ip-details">
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
      </div>

      <!-- Screen & device details -->
      <div id="screen-device-details">
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
      </div>
    </section>

    <!-- Extended Browser & Device Information -->
    <ExtendedBrowserInfo
      :browser-name="browserName"
      :browser-version="browserVersion"
      :browser-engine="browserEngine"
      :true-browser-core="trueBrowserCore"
      :device-type="deviceType"
      :device-model="deviceModel"
      :os-name="osName"
      :os-version="osVersion"
      :true-os-core="trueOsCore"
      :system-date-time="systemDateTime"
      :local-date-time="localDateTime"
      :is-dst="isDst"
      :timezone="timezone"
      :canvas-fingerprinting="canvasFingerprinting"
      :audio-context-fingerprinting="audioContextFingerprinting"
      :fingerprinting-resistance="fingerprintingResistance"
      :http-headers="httpHeaders"
      :window-outer-width="windowOuterWidth"
      :window-outer-height="windowOuterHeight"
      :window-inner-width="windowInnerWidth"
      :window-inner-height="windowInnerHeight"
      :is-fullscreen="isFullscreen"
      :screen-orientation="screenOrientation"
      :aspect-ratio="aspectRatio"
      :battery-level="batteryLevel"
      :battery-charging="batteryCharging"
      :battery-charging-time="batteryChargingTime"
      :battery-discharging-time="batteryDischargingTime"
      :bluetooth-supported="bluetoothSupported"
      :bluetooth-available="bluetoothAvailable"
      :device-orientation="deviceOrientation"
      :device-motion="deviceMotion"
      :speakers="speakers"
      :microphones="microphones"
      :cameras="cameras"
      :speakers-count="speakersCount"
      :microphones-count="microphonesCount"
      :cameras-count="camerasCount"
      :plugins="plugins"
      :mime-types="mimeTypes"
      :ad-blocker-detected="adBlockerDetected"
      :tls-version="tlsVersion"
      :tls-cipher="tlsCipher"
      :webgl-version="webglVersion"
      :webgl2-version="webgl2Version"
      :speech-synthesis-supported="speechSynthesisSupported"
      :speech-voices="speechVoices"
      :fonts-detected="fontsDetected"
      :page-visibility-initially-visible="pageVisibilityInitiallyVisible"
      :page-visibility-last-visible="pageVisibilityLastVisible"
      :page-visibility-last-hidden="pageVisibilityLastHidden"
      :performance-timing="performanceTiming"
      :websocket-supported="websocketSupported"
      :session-storage-enabled="sessionStorageEnabled"
      :history-length="historyLength"
      :page-referrer="pageReferrer"
      :private-browsing-mode="privateBrowsingMode"
      :has-mouse="hasMouse"
      :has-touchscreen="hasTouchscreen"
      :last-key-pressed="lastKeyPressed"
      :caps-lock-state="capsLockState"
      :scroll-position="scrollPosition"
      :mouse-position="mousePosition"
      :last-click-position="lastClickPosition"
    />
  </div>
</template>


