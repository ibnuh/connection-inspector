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

async function copySummaryToClipboard() {
  copySummaryStatus.value = 'idle'
  const summary = {
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
    <section
      class="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft backdrop-blur sm:grid-cols-2 sm:gap-6 sm:p-5"
    >
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          <span class="inline-flex h-6 items-center rounded-full bg-slate-800 px-2 text-[0.7rem]">
            Connection
          </span>
          <span class="hidden sm:inline">Overview</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400">IP address</p>
          <p class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
            <span v-if="loadingIp" class="inline-flex items-center gap-2 text-slate-400">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
              Detecting&hellip;
            </span>
            <span v-else-if="ipInfo">
              {{ ipInfo.ip }}
            </span>
            <span v-else class="text-slate-500">
              Unknown
            </span>
          </p>
          <p v-if="ipInfo?.location" class="mt-1 text-xs text-slate-400">
            {{ ipInfo.location.city }},
            {{ ipInfo.location.state }},
            {{ ipInfo.location.country }}
            ({{ ipInfo.location.country_code }})
          </p>
          <p v-else class="mt-1 text-xs text-slate-500">
            Location details may be approximate.
          </p>
        </div>

        <div class="mt-2 flex flex-wrap gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium"
            :class="[
              ipStatusTone === 'success' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
              ipStatusTone === 'warning' && 'border-amber-500/40 bg-amber-500/10 text-amber-300',
              ipStatusTone === 'danger' && 'border-rose-500/40 bg-rose-500/10 text-rose-300',
              ipStatusTone === 'neutral' && 'border-slate-700 bg-slate-800 text-slate-300'
            ]"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="[
                ipStatusTone === 'success' && 'bg-emerald-400',
                ipStatusTone === 'warning' && 'bg-amber-400',
                ipStatusTone === 'danger' && 'bg-rose-400',
                ipStatusTone === 'neutral' && 'bg-slate-500'
              ]"
            />
            <span>{{ ipStatusLabel }}</span>
          </span>
          <span
            v-if="ipInfo?.is_datacenter"
            class="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-sky-300 ring-1 ring-sky-500/40"
          >
            Datacenter IP
          </span>
          <span
            v-if="ipInfo?.is_mobile"
            class="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-300 ring-1 ring-emerald-500/40"
          >
            Mobile network
          </span>
        </div>

        <div class="mt-3 space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span class="font-medium">
              Risk level
              <span v-if="ipRiskBand !== 'Unknown'">
                ({{ ipRiskBand }})
              </span>
            </span>
            <span v-if="ipRiskScore != null" class="tabular-nums text-slate-400">
              {{ ipRiskScore }} / 100
            </span>
            <span v-else class="text-slate-500">
              Not yet available
            </span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              v-if="ipRiskScore != null"
              class="h-full rounded-full transition-all"
              :class="[
                ipRiskBand === 'Low' && 'bg-emerald-400',
                ipRiskBand === 'Medium' && 'bg-amber-400',
                ipRiskBand === 'High' && 'bg-rose-400',
                ipRiskBand === 'Unknown' && 'bg-slate-500'
              ]"
              :style="{ width: `${ipRiskScore}%` }"
            />
          </div>
          <p class="text-[0.7rem] text-slate-500">
            Calculated from Tor / proxy / VPN flags, datacenter status, bogon range, and abuse scores from
            ipapi.is.
          </p>
        </div>

        <p v-if="ipError" class="mt-2 text-xs text-rose-400">
          {{ ipError }}
        </p>
      </div>

      <div class="flex flex-col justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 sm:p-4">
        <div>
          <p class="text-xs font-semibold text-slate-400">Browser</p>
          <p class="mt-1 text-sm font-medium text-slate-50">
            {{ userAgent || 'Detecting browser…' }}
          </p>
        </div>
        <div class="space-y-3 text-xs text-slate-300">
          <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">JS</dt>
              <dd class="mt-0.5 font-medium text-emerald-300">
                Enabled
              </dd>
            </div>
            <div>
              <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Cookies</dt>
              <dd class="mt-0.5 font-medium" :class="cookiesEnabled ? 'text-emerald-300' : 'text-rose-300'">
                {{ cookiesEnabled == null ? 'Unknown' : cookiesEnabled ? 'Enabled' : 'Disabled' }}
              </dd>
            </div>
            <div>
              <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Online</dt>
              <dd class="mt-0.5 font-medium" :class="online ? 'text-emerald-300' : 'text-rose-300'">
                {{ online == null ? 'Unknown' : online ? 'Yes' : 'No' }}
              </dd>
            </div>
            <div>
              <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Timezone</dt>
              <dd class="mt-0.5 font-medium">
                {{ timezone || 'Unknown' }}
              </dd>
            </div>
            <div>
              <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Language</dt>
              <dd class="mt-0.5 font-medium">
                {{ languages.join(', ') || 'Unknown' }}
              </dd>
            </div>
            <div>
              <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">DNT</dt>
              <dd class="mt-0.5 font-medium">
                {{ doNotTrack ?? 'Not reported' }}
              </dd>
            </div>
          </dl>

          <div class="border-t border-slate-800 pt-2">
            <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Feature support
            </p>
            <ul class="grid grid-cols-2 gap-2 text-[0.7rem] sm:grid-cols-3">
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsServiceWorker ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>Service Worker</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsNotifications ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>Notifications</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsClipboard ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>Clipboard API</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsGeolocation ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>Geolocation</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsWebRTC ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>WebRTC</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsWebGL ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>WebGL</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsWebGPU ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>WebGPU</span>
              </li>
              <li class="flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="supportsIndexedDB ? 'bg-emerald-400' : 'bg-slate-600'"
                />
                <span>IndexedDB</span>
              </li>
            <li v-if="onlineEvents.length" class="col-span-2 mt-1 text-[0.7rem] text-slate-400">
              <span class="mr-1 font-medium text-slate-200">
                Session connectivity:
              </span>
              <span
                v-for="(evt, idx) in onlineEvents.slice(-4)"
                :key="`${evt.at}-${idx}`"
                class="inline-flex items-center gap-1 text-[0.7rem]"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="evt.online ? 'bg-emerald-400' : 'bg-rose-400'"
                />
                <span class="text-slate-400">
                  {{ evt.online ? 'online' : 'offline' }} at {{ evt.at }}
                </span>
                <span v-if="idx < onlineEvents.slice(-4).length - 1" class="mx-1 text-slate-700">
                  •
                </span>
              </span>
            </li>
            </ul>
          </div>

          <div class="border-t border-slate-800 pt-2">
            <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Permissions (browser view)
            </p>
            <div class="space-y-1.5 text-[0.7rem]">
              <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="permissionGeolocation === 'granted' ? 'bg-emerald-400' : permissionGeolocation === 'denied' ? 'bg-rose-400' : permissionGeolocation === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                    />
                    <span>Geolocation: {{ permissionGeolocation ?? 'unknown' }}</span>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                    @click="requestGeolocationPermission"
                  >
                    Check
                  </button>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="permissionNotifications === 'granted' ? 'bg-emerald-400' : permissionNotifications === 'denied' ? 'bg-rose-400' : permissionNotifications === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                    />
                    <span>Notifications: {{ permissionNotifications ?? 'unknown' }}</span>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                    @click="requestNotificationPermission"
                  >
                    Check
                  </button>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="permissionCamera === 'granted' ? 'bg-emerald-400' : permissionCamera === 'denied' ? 'bg-rose-400' : permissionCamera === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                    />
                    <span>Camera: {{ permissionCamera ?? 'unknown' }}</span>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                    @click="requestCameraPermission"
                  >
                    Check
                  </button>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="permissionMicrophone === 'granted' ? 'bg-emerald-400' : permissionMicrophone === 'denied' ? 'bg-rose-400' : permissionMicrophone === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                    />
                    <span>Microphone: {{ permissionMicrophone ?? 'unknown' }}</span>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                    @click="requestMicrophonePermission"
                  >
                    Check
                  </button>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="permissionClipboardRead === 'granted' ? 'bg-emerald-400' : permissionClipboardRead === 'denied' ? 'bg-rose-400' : permissionClipboardRead === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                    />
                    <span>Clipboard read: {{ permissionClipboardRead ?? 'unknown' }}</span>
                  </div>
                  <button
                    type="button"
                    class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                    @click="requestClipboardReadPermission"
                  >
                    Check
                  </button>
                </div>
              </div>
              <p class="mt-1 text-[0.65rem] text-slate-500">
                This table reflects the browser&rsquo;s current understanding of permission state. Use
                &ldquo;Check&rdquo; to actively prompt for a permission and refresh the status.
              </p>
              <p
                v-if="Object.keys(permissionLastChecked).length"
                class="text-[0.65rem] text-slate-500"
              >
                Last checked:
                <span
                  v-for="(val, key, idx) in permissionLastChecked"
                  :key="key"
                  class="mr-1"
                >
                  <span class="text-slate-400">{{ key }}:</span>
                  <span class="text-slate-300">{{ val }}</span>
                  <span v-if="idx < Object.keys(permissionLastChecked).length - 1">•</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Detailed sections -->
    <section class="grid gap-4 md:grid-cols-2">
      <!-- Network / IP details -->
      <div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold text-slate-100">
              Network & IP details
            </h2>
            <p class="text-xs text-slate-400">
              Enriched data from
              <a
                href="https://api.ipapi.is/"
                target="_blank"
                rel="noreferrer"
                class="font-medium text-sky-400 underline-offset-4 hover:underline"
              >
                ipapi.is
              </a>
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[0.7rem] font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700"
            @click="fetchIpInfo"
          >
            <span v-if="loadingIp" class="mr-1.5 h-1.5 w-1.5 animate-ping rounded-full bg-sky-400" />
            Refresh
          </button>
        </div>

        <dl class="mt-2 space-y-2 text-xs">
          <div class="flex items-start justify-between gap-4 rounded-lg bg-slate-950/60 px-3 py-2">
            <div>
              <dt class="text-[0.7rem] font-medium text-slate-300">IP type</dt>
              <dd class="mt-0.5 text-[0.72rem] text-slate-400">
                <span v-if="ipInfo">
                  <span v-if="ipInfo.is_datacenter">Datacenter / hosting</span>
                  <span v-else-if="ipInfo.is_mobile">Mobile network</span>
                  <span v-else>Residential or unknown</span>
                  <span v-if="ipInfo.is_bogon"> • Bogon/invalid range</span>
                </span>
                <span v-else>
                  Waiting for IP data&hellip;
                </span>
              </dd>
            </div>
            <div class="text-right text-[0.7rem] text-slate-400">
              <div>
                Proxy:
                <span :class="ipInfo?.is_proxy ? 'text-amber-300' : 'text-slate-300'">
                  {{ ipInfo?.is_proxy ? 'Yes' : 'No' }}
                </span>
              </div>
              <div>
                VPN:
                <span :class="ipInfo?.is_vpn ? 'text-amber-300' : 'text-slate-300'">
                  {{ ipInfo?.is_vpn ? 'Yes' : 'No' }}
                </span>
              </div>
              <div>
                Tor:
                <span :class="ipInfo?.is_tor ? 'text-amber-300' : 'text-slate-300'">
                  {{ ipInfo?.is_tor ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="connectionType || connectionDownlink || connectionRtt || connectionSaveData !== null"
            class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2"
          >
            <dt class="text-[0.7rem] font-medium text-slate-300">Browser connection</dt>
            <dd class="mt-0.5 text-[0.72rem] text-slate-400">
              <span v-if="connectionType">
                Effective type:
                <span class="font-medium text-slate-200">
                  {{ connectionType }}
                </span>
              </span>
              <span v-else>
                Network Information API not reported by this browser.
              </span>
            </dd>
            <dd class="text-[0.7rem] text-slate-500">
              <span v-if="connectionDownlink != null">
                Downlink: {{ connectionDownlink }} Mbps
              </span>
              <span v-if="connectionRtt != null">
                • RTT: {{ connectionRtt }} ms
              </span>
              <span v-if="connectionSaveData != null" class="block">
                Data saver: {{ connectionSaveData ? 'Enabled' : 'Disabled' }}
              </span>
            </dd>
          </div>

          <div class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2">
            <dt class="text-[0.7rem] font-medium text-slate-300">Abuse & risk</dt>
            <dd class="mt-0.5 text-[0.72rem] text-slate-400">
              <span v-if="ipInfo">
                <span v-if="ipInfo.is_abuser">
                  Marked as abusive &mdash; this IP or network has elevated abuse reports.
                </span>
                <span v-else>
                  Not flagged as abusive by ipapi.is, but other providers may still enforce their own checks.
                </span>
              </span>
              <span v-else>
                Waiting for IP data&hellip;
              </span>
            </dd>
            <dd v-if="ipInfo?.asn || ipInfo?.company" class="text-[0.7rem] text-slate-500">
              Abuse scores (ASN / company):
              <span class="font-medium text-slate-300">
                {{ formatAbuserScore(ipInfo?.asn?.abuser_score) }} /
                {{ formatAbuserScore(ipInfo?.company?.abuser_score) }}
              </span>
            </dd>
          </div>

          <div
            v-if="ipInfo?.datacenter || ipInfo?.company || ipInfo?.asn"
            class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2"
          >
            <dt class="text-[0.7rem] font-medium text-slate-300">Provider, ASN & datacenter</dt>
            <dd v-if="ipInfo?.company" class="mt-0.5 text-[0.72rem] text-slate-400">
              {{ ipInfo.company.name || 'Unknown provider' }}
              <span v-if="ipInfo.company.type">
                ({{ ipInfo.company.type }})
              </span>
              <span v-if="ipInfo.company.domain" class="text-slate-500">
                • {{ ipInfo.company.domain }}
              </span>
            </dd>
            <dd v-if="ipInfo?.datacenter" class="text-[0.7rem] text-slate-500">
              Datacenter:
              <span class="font-medium text-slate-300">
                {{ ipInfo.datacenter.datacenter || 'Unknown' }}
              </span>
              <span v-if="ipInfo.datacenter.city">
                • {{ ipInfo.datacenter.city }}
              </span>
              <span v-if="ipInfo.datacenter.country">
                , {{ ipInfo.datacenter.country }}
              </span>
              <span v-if="ipInfo.datacenter.network">
                • {{ ipInfo.datacenter.network }}
              </span>
            </dd>
            <dd v-if="ipInfo?.asn" class="text-[0.7rem] text-slate-500">
              <span>
                ASN {{ ipInfo.asn.asn ?? 'unknown' }} •
              </span>
              <span v-if="ipInfo.asn.descr">
                {{ ipInfo.asn.descr }}
              </span>
              <span v-if="ipInfo.asn.route">
                • {{ ipInfo.asn.route }}
              </span>
            </dd>
          </div>

          <div
            v-if="ipInfo?.abuse || ipInfo?.location"
            class="flex flex-col gap-2 rounded-lg bg-slate-950/60 px-3 py-2"
          >
            <dt class="text-[0.7rem] font-medium text-slate-300">Abuse contact & location</dt>
            <dd v-if="ipInfo?.abuse" class="mt-0.5 text-[0.72rem] text-slate-400">
              <span class="font-medium">
                {{ ipInfo.abuse.name || 'Abuse contact' }}
              </span>
              <span v-if="ipInfo.abuse.email">
                • {{ ipInfo.abuse.email }}
              </span>
              <span v-if="ipInfo.abuse.phone">
                • {{ ipInfo.abuse.phone }}
              </span>
              <span v-if="ipInfo.abuse.address" class="block text-slate-500">
                {{ ipInfo.abuse.address }}
              </span>
            </dd>
            <dd v-if="ipInfo?.location" class="space-y-0.5 text-[0.7rem] text-slate-500">
              <p>
                {{ ipInfo.location.city || 'Unknown city' }},
                {{ ipInfo.location.state || 'Unknown region' }},
                {{ ipInfo.location.country || 'Unknown country' }}
                <span v-if="ipInfo.location.zip">
                  • {{ ipInfo.location.zip }}
                </span>
              </p>
              <p v-if="ipInfo.location.timezone">
                Timezone: {{ ipInfo.location.timezone }}
              </p>
              <p
                v-if="ipInfo.location.latitude != null && ipInfo.location.longitude != null"
                class="flex flex-wrap items-center gap-1.5"
              >
                <span class="text-slate-400">
                  Lat/Lng:
                  <span class="font-medium text-slate-200">
                    {{ ipInfo.location.latitude.toFixed(4) }},
                    {{ ipInfo.location.longitude.toFixed(4) }}
                  </span>
                </span>
                <span class="hidden text-slate-600 sm:inline">•</span>
                <a
                  class="inline-flex items-center gap-1 text-sky-400 underline-offset-4 hover:underline"
                  :href="`https://www.openstreetmap.org/?mlat=${ipInfo.location.latitude}&mlon=${ipInfo.location.longitude}&zoom=10`"
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenStreetMap
                </a>
                <span class="text-slate-600">/</span>
                <a
                  class="inline-flex items-center gap-1 text-sky-400 underline-offset-4 hover:underline"
                  :href="`https://www.google.com/maps/@${ipInfo.location.latitude},${ipInfo.location.longitude},10z`"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Maps
                </a>
              </p>
            </dd>
            <dd v-if="ipInfo?.elapsed_ms != null" class="text-[0.7rem] text-slate-500">
              Lookup latency:
              <span class="font-medium text-slate-300">
                {{ ipInfo.elapsed_ms }} ms
              </span>
              <span v-if="ipInfo.client_rtt_ms != null">
                • client RTT:
                <span class="font-medium text-slate-300">
                  {{ ipInfo.client_rtt_ms }} ms
                </span>
              </span>
            </dd>
          </div>

          <div
            v-if="ipInfo"
            class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2"
          >
            <button
              type="button"
              class="inline-flex items-center justify-between gap-2 text-[0.7rem] font-medium text-slate-300"
              @click="showRawIpPayload = !showRawIpPayload"
            >
              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Raw ipapi.is payload
              </span>
              <span class="text-slate-500">
                {{ showRawIpPayload ? 'Hide' : 'Show' }}
              </span>
            </button>
            <pre
              v-if="showRawIpPayload"
              class="mt-1 max-h-52 overflow-auto rounded-md bg-slate-950 p-2 text-[0.65rem] leading-snug text-slate-300"
            >
{{ JSON.stringify(ipInfo, null, 2) }}
            </pre>
          </div>
        </dl>
      </div>

      <!-- Screen & device details -->
      <div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h2 class="text-sm font-semibold text-slate-100">
              Screen & device
            </h2>
            <p class="text-xs text-slate-400">
              Resolution, pixel density, and basic device capabilities.
            </p>
          </div>
        </div>

        <dl class="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <div class="rounded-lg bg-slate-950/60 px-3 py-2">
            <dt class="text-[0.7rem] font-medium text-slate-300">Resolution</dt>
            <dd class="mt-0.5 text-[0.8rem] text-slate-200">
              <span v-if="screenWidth && screenHeight">
                {{ screenWidth }} × {{ screenHeight }}
              </span>
              <span v-else>
                Unknown
              </span>
            </dd>
          </div>
          <div class="rounded-lg bg-slate-950/60 px-3 py-2">
            <dt class="text-[0.7rem] font-medium text-slate-300">Pixel ratio</dt>
            <dd class="mt-0.5 text-[0.8rem] text-slate-200">
              {{ devicePixelRatio ?? 'Unknown' }}
            </dd>
          </div>
          <div class="rounded-lg bg-slate-950/60 px-3 py-2">
            <dt class="text-[0.7rem] font-medium text-slate-300">Color depth</dt>
            <dd class="mt-0.5 text-[0.8rem] text-slate-200">
              <span v-if="colorDepth">
                {{ colorDepth }}-bit
              </span>
              <span v-else>
                Unknown
              </span>
            </dd>
          </div>
          <div class="rounded-lg bg-slate-950/60 px-3 py-2">
            <dt class="text-[0.7rem] font-medium text-slate-300">CPU threads</dt>
            <dd class="mt-0.5 text-[0.8rem] text-slate-200">
              {{ hardwareConcurrency ?? 'Unknown' }}
            </dd>
          </div>
          <div class="rounded-lg bg-slate-950/60 px-3 py-2">
            <dt class="text-[0.7rem] font-medium text-slate-300">Touch points</dt>
            <dd class="mt-0.5 text-[0.8rem] text-slate-200">
              {{ maxTouchPoints ?? 'Unknown' }}
            </dd>
          </div>
          <div class="rounded-lg bg-slate-950/60 px-3 py-2">
            <dt class="text-[0.7rem] font-medium text-slate-300">Platform</dt>
            <dd class="mt-0.5 text-[0.8rem] text-slate-200">
              {{ platform || 'Unknown' }}
            </dd>
          </div>
        </dl>

        <div class="mt-2 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
          <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            GPU / Renderer (WebGL)
          </p>
          <p class="text-[0.7rem] text-slate-300">
            <span v-if="gpuRenderer">
              {{ gpuRenderer }}
            </span>
            <span v-else>
              Not reported; WebGL renderer is unavailable or blocked.
            </span>
          </p>
          <p v-if="gpuVendor" class="mt-0.5 text-[0.7rem] text-slate-500">
            Vendor:
            <span class="font-medium text-slate-300">
              {{ gpuVendor }}
            </span>
          </p>
          <p class="mt-0.5 text-[0.65rem] text-slate-500">
            This information comes from a lightweight WebGL context and can sometimes differ from the
            underlying physical GPU name.
          </p>
        </div>

        <div class="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
          <p class="mb-1 font-medium text-slate-200">
            Storage & capabilities
          </p>
          <ul class="grid grid-cols-2 gap-2">
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="localStorageEnabled ? 'bg-emerald-400' : 'bg-rose-400'"
              />
              <span>localStorage: {{ localStorageEnabled ? 'Available' : 'Blocked / disabled' }}</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>JavaScript: Enabled</span>
            </li>
            <li v-if="storageQuota != null" class="col-span-2 flex flex-col text-[0.7rem] text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>
                  Storage quota:
                  <span class="font-medium text-slate-200">
                    {{ (storageQuota / (1024 * 1024)).toFixed(1) }} MB
                  </span>
                </span>
              </span>
              <span v-if="storageUsage != null" class="ml-3 mt-0.5 text-slate-500">
                Approx. usage:
                <span class="font-medium text-slate-200">
                  {{ (storageUsage / (1024 * 1024)).toFixed(1) }} MB
                </span>
              </span>
            </li>
            <li v-else class="col-span-2 flex items-center gap-1.5 text-[0.7rem] text-slate-500">
              <span class="h-1.5 w-1.5 rounded-full bg-slate-600" />
              <span>Storage quota: Not reported by this browser.</span>
            </li>
          </ul>
          <div class="mt-2 rounded-lg border border-slate-800/70 bg-slate-950/60 p-2">
            <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Privacy profile
            </p>
            <p class="text-[0.7rem] text-slate-400">
              Languages:
              <span class="font-medium text-slate-200">
                {{ languages.length || 0 }}
              </span>
              &bull;
              Cookies:
              <span class="font-medium text-slate-200">
                {{ cookiesEnabled === false ? 'disabled or blocked' : 'enabled' }}
              </span>
              <span v-if="doNotTrack" class="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200">
                <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
                DNT: {{ doNotTrack }}
              </span>
            </p>
            <ul v-if="privacyNotes.length" class="mt-1 list-disc space-y-0.5 pl-4 text-[0.7rem] text-slate-400">
              <li v-for="note in privacyNotes" :key="note">
                {{ note }}
              </li>
            </ul>
            <p v-else class="mt-1 text-[0.7rem] text-slate-500">
              No strong privacy signals detected beyond standard browser defaults.
            </p>
            <div class="mt-2">
              <p class="mb-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Fingerprintability
              </p>
              <div class="flex items-center justify-between text-[0.7rem] text-slate-300">
                <span>
                  Estimated entropy:
                  <span class="font-medium text-slate-100">
                    {{ fingerprintBand }}
                  </span>
                </span>
                <span v-if="fingerprintScore != null" class="tabular-nums text-slate-400">
                  {{ fingerprintScore }} / 100
                </span>
              </div>
              <div class="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  v-if="fingerprintScore != null"
                  class="h-full rounded-full transition-all"
                  :class="[
                    fingerprintBand === 'Low' && 'bg-emerald-400',
                    fingerprintBand === 'Medium' && 'bg-amber-400',
                    fingerprintBand === 'High' && 'bg-rose-400',
                    fingerprintBand === 'Unknown' && 'bg-slate-500'
                  ]"
                  :style="{ width: `${fingerprintScore}%` }"
                />
              </div>
              <p class="mt-1 text-[0.65rem] text-slate-500">
                Rough, client-only estimate based on languages, storage, WebRTC, GPU info and timezone signals.
                Higher does not necessarily mean you are uniquely identifiable, only that your environment
                exposes more traits.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
          @click="logDiagnosticsToConsole"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-slate-500" />
          Log diagnostics to console
        </button>
      </div>
    </section>
  </div>
</template>


