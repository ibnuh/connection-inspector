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
}

const ipInfo = ref<IpApiResponse | null>(null)
const ipError = ref<string | null>(null)
const loadingIp = ref(true)

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

async function fetchIpInfo() {
  loadingIp.value = true
  ipError.value = null
  try {
    const res = await fetch('https://api.ipapi.is/')
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`)
    }
    const data = (await res.json()) as IpApiResponse
    ipInfo.value = data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    ipError.value = `Unable to fetch IP information: ${message}`
  } finally {
    loadingIp.value = false
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

  // Storage
  try {
    const key = '__connection_inspector_test__'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    localStorageEnabled.value = true
  } catch {
    localStorageEnabled.value = false
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
        <dl class="grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-3">
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
            <dd v-if="ipInfo?.location" class="text-[0.7rem] text-slate-500">
              <span>
                {{ ipInfo.location.city || 'Unknown city' }},
                {{ ipInfo.location.state || 'Unknown region' }},
                {{ ipInfo.location.country || 'Unknown country' }}
              </span>
              <span v-if="ipInfo.location.zip">
                • {{ ipInfo.location.zip }}
              </span>
              <span v-if="ipInfo.location.timezone" class="block">
                Timezone: {{ ipInfo.location.timezone }}
              </span>
            </dd>
            <dd v-if="ipInfo?.elapsed_ms != null" class="text-[0.7rem] text-slate-500">
              Lookup latency:
              <span class="font-medium text-slate-300">
                {{ ipInfo.elapsed_ms }} ms
              </span>
            </dd>
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
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>


