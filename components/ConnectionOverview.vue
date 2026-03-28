<script setup lang="ts">
import type { Ref } from 'vue'

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

const props = defineProps<{
  loadingIp: boolean
  ipInfo: IpApiResponse | null
  ipError: string | null
  isHttps: boolean
  ipStatusLabel: string
  ipStatusTone: 'success' | 'warning' | 'danger' | 'neutral'
  ipRiskScore: number | null
  ipRiskBand: 'Low' | 'Medium' | 'High' | 'Unknown'
  userAgent: string | null
  cookiesEnabled: boolean | null
  online: boolean | null
  timezone: string | null
  languages: string[]
  doNotTrack: string | null
  supportsServiceWorker: boolean | null
  supportsNotifications: boolean | null
  supportsClipboard: boolean | null
  supportsGeolocation: boolean | null
  supportsWebRTC: boolean | null
  supportsWebGL: boolean | null
  supportsWebGPU: boolean | null
  supportsIndexedDB: boolean | null
  onlineEvents: { at: string; online: boolean }[]
  permissionGeolocation: string | null
  permissionNotifications: string | null
  permissionCamera: string | null
  permissionMicrophone: string | null
  permissionClipboardRead: string | null
  permissionLastChecked: Record<string, string>
  serverViewLoading: boolean
  serverViewError: string | null
  serverViewData: {
    ip: string | null
    httpVersion?: string
    headers?: {
      'user-agent'?: string
      'accept-language'?: string
      'x-forwarded-for'?: string | string[]
    }
  } | null
  copySummaryStatus: 'idle' | 'copied' | 'error'
  copyDebugStatus: 'idle' | 'copied' | 'error'
  requestGeolocationPermission: () => void
  requestNotificationPermission: () => void
  requestCameraPermission: () => void
  requestMicrophonePermission: () => void
  requestClipboardReadPermission: () => void
  runServerViewCheck: () => Promise<void> | void
  copySummaryToClipboard: () => Promise<void> | void
  downloadSnapshot: (format: 'json' | 'csv' | 'markdown') => void
  copyDebugSnippet: () => Promise<void> | void
  connectionType: string | null
  connectionRtt: number | null
  connectionDownlink: number | null
  connectionSaveData: boolean | null
  clientRtt: number | null
  isMobile: boolean | null
  isDatacenter: boolean | null
  isSatellite: boolean | null
  locationCountry: string | null
  locationCity: string | null
  locationState: string | null
  asnOrg: string | null
  asnNumber: number | null
  isp: string | null
  elapsedMs: number | null
  browserName: string | null
  browserVersion: string | null
  browserEngine: string | null
  platform: string | null
  screenWidth: number | null
  screenHeight: number | null
  devicePixelRatio: number | null
  hardwareConcurrency: number | null
}>()
</script>

<template>
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
      <IpAddressDisplay :loading-ip="props.loadingIp" :ip-info="props.ipInfo" />
      <IpStatusBadges
        :ip-info="props.ipInfo"
        :ip-status-label="props.ipStatusLabel"
        :ip-status-tone="props.ipStatusTone"
        :is-https="props.isHttps"
      />
      <RiskLevelGauge :ip-risk-score="props.ipRiskScore" :ip-risk-band="props.ipRiskBand" />
      <p v-if="props.ipError" class="mt-2 text-xs text-rose-400">
        {{ props.ipError }}
      </p>
      
      <!-- Connection Status -->
      <ConnectionStatus
        :online="props.online"
        :connection-type="props.connectionType"
        :connection-rtt="props.connectionRtt"
        :connection-downlink="props.connectionDownlink"
        :connection-save-data="props.connectionSaveData"
        :client-rtt="props.clientRtt"
        :is-mobile="props.isMobile"
        :is-datacenter="props.isDatacenter"
        :is-satellite="props.isSatellite"
        :location-country="props.locationCountry"
        :location-city="props.locationCity"
        :asn-org="props.asnOrg"
      />
      
      <!-- Quick Stats -->
      <QuickStats
        :location-country="props.locationCountry"
        :location-city="props.locationCity"
        :location-state="props.locationState"
        :asn-org="props.asnOrg"
        :asn-number="props.asnNumber"
        :isp="props.isp"
        :client-rtt="props.clientRtt"
        :elapsed-ms="props.elapsedMs"
      />
    </div>

    <div class="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
      <!-- Browser Summary -->
      <BrowserSummary
        :browser-name="props.browserName"
        :browser-version="props.browserVersion"
        :browser-engine="props.browserEngine"
        :platform="props.platform"
        :screen-width="props.screenWidth"
        :screen-height="props.screenHeight"
        :device-pixel-ratio="props.devicePixelRatio"
        :hardware-concurrency="props.hardwareConcurrency"
        :timezone="props.timezone"
        :languages="props.languages"
        :cookies-enabled="props.cookiesEnabled"
        :do-not-track="props.doNotTrack"
        :online="props.online"
        :user-agent="props.userAgent"
      />

      <!-- Feature Status Grid -->
      <FeatureStatusGrid
        :supports-service-worker="props.supportsServiceWorker"
        :supports-notifications="props.supportsNotifications"
        :supports-clipboard="props.supportsClipboard"
        :supports-geolocation="props.supportsGeolocation"
        :supports-web-r-t-c="props.supportsWebRTC"
        :supports-web-g-l="props.supportsWebGL"
        :supports-web-g-p-u="props.supportsWebGPU"
        :supports-indexed-d-b="props.supportsIndexedDB"
      />

      <!-- Permissions Table -->
      <div class="border-t border-slate-800 pt-3">
        <PermissionsTable
          :permission-geolocation="props.permissionGeolocation"
          :permission-notifications="props.permissionNotifications"
          :permission-camera="props.permissionCamera"
          :permission-microphone="props.permissionMicrophone"
          :permission-clipboard-read="props.permissionClipboardRead"
          :permission-last-checked="props.permissionLastChecked"
          :request-geolocation-permission="props.requestGeolocationPermission"
          :request-notification-permission="props.requestNotificationPermission"
          :request-camera-permission="props.requestCameraPermission"
          :request-microphone-permission="props.requestMicrophonePermission"
          :request-clipboard-read-permission="props.requestClipboardReadPermission"
        />
      </div>

      <!-- Server View Comparison -->
      <div class="border-t border-slate-800 pt-3">
        <ServerViewComparison
          :server-view-loading="props.serverViewLoading"
          :server-view-error="props.serverViewError"
          :server-view-data="props.serverViewData"
          :ip-info="props.ipInfo"
          :user-agent="props.userAgent"
          :is-https="props.isHttps"
          :run-server-view-check="props.runServerViewCheck"
        />
      </div>
    </div>
    <ExportActions
      :copy-summary-status="props.copySummaryStatus"
      :copy-debug-status="props.copyDebugStatus"
      :copy-summary-to-clipboard="props.copySummaryToClipboard"
      :download-snapshot="props.downloadSnapshot"
      :copy-debug-snippet="props.copyDebugSnippet"
    />
  </section>
</template>


