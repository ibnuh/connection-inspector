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
  downloadSnapshotJson: () => void
  copyDebugSnippet: () => Promise<void> | void
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
      <div>
        <p class="text-xs font-semibold text-slate-400">IP address</p>
        <p class="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
          <span v-if="props.loadingIp" class="inline-flex items-center gap-2 text-slate-400">
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            Detecting&hellip;
          </span>
          <span v-else-if="props.ipInfo">
            {{ props.ipInfo.ip }}
          </span>
          <span v-else class="text-slate-500">
            Unknown
          </span>
        </p>
        <p v-if="props.ipInfo?.location" class="mt-1 text-xs text-slate-400">
          {{ props.ipInfo.location.city }},
          {{ props.ipInfo.location.state }},
          {{ props.ipInfo.location.country }}
          ({{ props.ipInfo.location.country_code }})
        </p>
        <p v-else class="mt-1 text-xs text-slate-500">
          Location details may be approximate.
        </p>
      </div>

      <div class="mt-2 flex flex-wrap gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium"
          :class="[
            props.ipStatusTone === 'success' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
            props.ipStatusTone === 'warning' && 'border-amber-500/40 bg-amber-500/10 text-amber-300',
            props.ipStatusTone === 'danger' && 'border-rose-500/40 bg-rose-500/10 text-rose-300',
            props.ipStatusTone === 'neutral' && 'border-slate-700 bg-slate-800 text-slate-300'
          ]"
        >
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="[
              props.ipStatusTone === 'success' && 'bg-emerald-400',
              props.ipStatusTone === 'warning' && 'bg-amber-400',
              props.ipStatusTone === 'danger' && 'bg-rose-400',
              props.ipStatusTone === 'neutral' && 'bg-slate-500'
            ]"
          />
          <span>{{ props.ipStatusLabel }}</span>
        </span>
        <span
          v-if="props.ipInfo?.is_datacenter"
          class="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-sky-300 ring-1 ring-sky-500/40"
        >
          Datacenter IP
        </span>
        <span
          v-if="props.ipInfo?.is_mobile"
          class="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-300 ring-1 ring-emerald-500/40"
        >
          Mobile network
        </span>
        <span
          v-if="!props.isHttps"
          class="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-[0.7rem] font-medium text-amber-300 ring-1 ring-amber-500/40"
        >
          Not using HTTPS
        </span>
      </div>

      <div class="mt-3 space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
        <div class="flex items-center justify-between text-xs text-slate-300">
          <span class="font-medium">
            Risk level
            <span v-if="props.ipRiskBand !== 'Unknown'">
              ({{ props.ipRiskBand }})
            </span>
          </span>
          <span v-if="props.ipRiskScore != null" class="tabular-nums text-slate-400">
            {{ props.ipRiskScore }} / 100
          </span>
          <span v-else class="text-slate-500">
            Not yet available
          </span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            v-if="props.ipRiskScore != null"
            class="h-full rounded-full transition-all"
            :class="[
              props.ipRiskBand === 'Low' && 'bg-emerald-400',
              props.ipRiskBand === 'Medium' && 'bg-amber-400',
              props.ipRiskBand === 'High' && 'bg-rose-400',
              props.ipRiskBand === 'Unknown' && 'bg-slate-500'
            ]"
            :style="{ width: `${props.ipRiskScore}%` }"
          />
        </div>
        <p class="text-[0.7rem] text-slate-500">
          Calculated from Tor / proxy / VPN flags, datacenter status, bogon range, and abuse scores from
          ipapi.is.
        </p>
      </div>

      <p v-if="props.ipError" class="mt-2 text-xs text-rose-400">
        {{ props.ipError }}
      </p>
    </div>

    <div class="flex flex-col justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 sm:p-4">
      <div>
        <p class="text-xs font-semibold text-slate-400">Browser</p>
        <p class="mt-1 text-sm font-medium text-slate-50">
          {{ props.userAgent || 'Detecting browser…' }}
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
            <dd class="mt-0.5 font-medium" :class="props.cookiesEnabled ? 'text-emerald-300' : 'text-rose-300'">
              {{ props.cookiesEnabled == null ? 'Unknown' : props.cookiesEnabled ? 'Enabled' : 'Disabled' }}
            </dd>
          </div>
          <div>
            <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Online</dt>
            <dd class="mt-0.5 font-medium" :class="props.online ? 'text-emerald-300' : 'text-rose-300'">
              {{ props.online == null ? 'Unknown' : props.online ? 'Yes' : 'No' }}
            </dd>
          </div>
          <div>
            <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Timezone</dt>
            <dd class="mt-0.5 font-medium">
              {{ props.timezone || 'Unknown' }}
            </dd>
          </div>
          <div>
            <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Language</dt>
            <dd class="mt-0.5 font-medium">
              {{ props.languages.join(', ') || 'Unknown' }}
            </dd>
          </div>
          <div>
            <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">DNT</dt>
            <dd class="mt-0.5 font-medium">
              {{ props.doNotTrack ?? 'Not reported' }}
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
                :class="props.supportsServiceWorker ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>Service Worker</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="props.supportsNotifications ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>Notifications</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="props.supportsClipboard ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>Clipboard API</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="props.supportsGeolocation ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>Geolocation</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="props.supportsWebRTC ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>WebRTC</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="props.supportsWebGL ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>WebGL</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="props.supportsWebGPU ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>WebGPU</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="props.supportsIndexedDB ? 'bg-emerald-400' : 'bg-slate-600'"
              />
              <span>IndexedDB</span>
            </li>
            <li
              v-if="props.onlineEvents.length"
              class="col-span-2 mt-1 text-[0.7rem] text-slate-400"
            >
              <span class="mr-1 font-medium text-slate-200">
                Session connectivity:
              </span>
              <span
                v-for="(evt, idx) in props.onlineEvents.slice(-4)"
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
                <span
                  v-if="idx < props.onlineEvents.slice(-4).length - 1"
                  class="mx-1 text-slate-700"
                >
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
                    :class="props.permissionGeolocation === 'granted' ? 'bg-emerald-400' : props.permissionGeolocation === 'denied' ? 'bg-rose-400' : props.permissionGeolocation === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                  />
                  <span>Geolocation: {{ props.permissionGeolocation ?? 'unknown' }}</span>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                  @click="props.requestGeolocationPermission"
                >
                  Check
                </button>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="props.permissionNotifications === 'granted' ? 'bg-emerald-400' : props.permissionNotifications === 'denied' ? 'bg-rose-400' : props.permissionNotifications === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                  />
                  <span>Notifications: {{ props.permissionNotifications ?? 'unknown' }}</span>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                  @click="props.requestNotificationPermission"
                >
                  Check
                </button>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="props.permissionCamera === 'granted' ? 'bg-emerald-400' : props.permissionCamera === 'denied' ? 'bg-rose-400' : props.permissionCamera === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                  />
                  <span>Camera: {{ props.permissionCamera ?? 'unknown' }}</span>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                  @click="props.requestCameraPermission"
                >
                  Check
                </button>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="props.permissionMicrophone === 'granted' ? 'bg-emerald-400' : props.permissionMicrophone === 'denied' ? 'bg-rose-400' : props.permissionMicrophone === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                  />
                  <span>Microphone: {{ props.permissionMicrophone ?? 'unknown' }}</span>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                  @click="props.requestMicrophonePermission"
                >
                  Check
                </button>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="props.permissionClipboardRead === 'granted' ? 'bg-emerald-400' : props.permissionClipboardRead === 'denied' ? 'bg-rose-400' : props.permissionClipboardRead === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
                  />
                  <span>Clipboard read: {{ props.permissionClipboardRead ?? 'unknown' }}</span>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
                  @click="props.requestClipboardReadPermission"
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
              v-if="Object.keys(props.permissionLastChecked).length"
              class="text-[0.65rem] text-slate-500"
            >
              Last checked:
              <span
                v-for="(val, key, idx) in props.permissionLastChecked"
                :key="key"
                class="mr-1"
              >
                <span class="text-slate-400">{{ key }}:</span>
                <span class="text-slate-300">{{ val }}</span>
                <span v-if="idx < Object.keys(props.permissionLastChecked).length - 1">•</span>
              </span>
            </p>
          </div>
        </div>

        <div class="border-t border-slate-800 pt-2">
          <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Browser vs server view
          </p>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-[0.7rem] text-slate-400">
              Check what the server sees for your IP and user agent, and compare with the browser.
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700"
              :disabled="props.serverViewLoading"
              @click="props.runServerViewCheck"
            >
              <span
                v-if="props.serverViewLoading"
                class="h-1.5 w-1.5 animate-ping rounded-full bg-sky-400"
              />
              <span>{{ props.serverViewLoading ? 'Checking…' : 'Run check' }}</span>
            </button>
          </div>
          <p
            v-if="props.serverViewError"
            class="mt-1 text-[0.7rem] text-rose-400"
          >
            {{ props.serverViewError }}
          </p>
          <div
            v-if="props.serverViewData"
            class="mt-1 space-y-0.5 text-[0.7rem]"
          >
            <p class="text-slate-300">
              Server IP:
              <span class="font-medium">
                {{ props.serverViewData.ip || 'Unknown' }}
              </span>
              <span v-if="props.ipInfo?.ip">
                &mdash; browser IP:
                <span class="font-medium">
                  {{ props.ipInfo.ip }}
                </span>
                <span
                  v-if="props.serverViewData.ip && props.ipInfo.ip && props.serverViewData.ip === props.ipInfo.ip"
                  class="ml-1 text-emerald-400"
                >
                  (match)
                </span>
                <span
                  v-else-if="props.serverViewData.ip && props.ipInfo.ip"
                  class="ml-1 text-amber-300"
                >
                  (mismatch &mdash; proxy or VPN likely)
                </span>
              </span>
            </p>
            <p class="text-slate-400">
              HTTP:
              <span class="font-medium text-slate-200">
                {{ props.serverViewData.httpVersion || 'Unknown' }}
              </span>
              • HTTPS:
              <span class="font-medium text-slate-200">
                {{ props.isHttps ? 'yes' : 'no or unknown' }}
              </span>
            </p>
            <p class="text-slate-400">
              User-Agent header:
              <span class="font-medium text-slate-200">
                {{ props.serverViewData.headers?.['user-agent'] || 'Unknown' }}
              </span>
            </p>
            <p
              v-if="props.userAgent && props.serverViewData.headers?.['user-agent']"
              class="text-[0.65rem]"
              :class="props.serverViewData.headers['user-agent'] === props.userAgent ? 'text-emerald-400' : 'text-amber-300'"
            >
              {{ props.serverViewData.headers['user-agent'] === props.userAgent ? 'Server UA matches navigator.userAgent.' : 'Server UA differs from navigator.userAgent (proxy, sanitizer or middleware may be rewriting headers).' }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="sm:col-span-2 flex flex-wrap items-center justify-end gap-2 pt-1 text-xs">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
        @click="props.copySummaryToClipboard"
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.copySummaryStatus === 'copied' ? 'bg-emerald-400' : props.copySummaryStatus === 'error' ? 'bg-rose-400' : 'bg-slate-500'"
        />
        <span v-if="props.copySummaryStatus === 'copied'">
          Copied summary JSON
        </span>
        <span v-else-if="props.copySummaryStatus === 'error'">
          Failed to copy
        </span>
        <span v-else>
          Copy summary as JSON
        </span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
        @click="props.downloadSnapshotJson"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-sky-400" />
        <span>Download JSON snapshot</span>
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
        @click="props.copyDebugSnippet"
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.copyDebugStatus === 'copied' ? 'bg-emerald-400' : props.copyDebugStatus === 'error' ? 'bg-rose-400' : 'bg-slate-500'"
        />
        <span v-if="props.copyDebugStatus === 'copied'">
          Copied debug snippet
        </span>
        <span v-else-if="props.copyDebugStatus === 'error'">
          Failed to copy snippet
        </span>
        <span v-else>
          Copy debug snippet
        </span>
      </button>
    </div>
  </section>
</template>


