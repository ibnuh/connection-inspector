<script setup lang="ts">
const props = defineProps<{
  screenWidth: number | null
  screenHeight: number | null
  devicePixelRatio: number | null
  colorDepth: number | null
  hardwareConcurrency: number | null
  maxTouchPoints: number | null
  platform: string | null
  gpuRenderer: string | null
  gpuVendor: string | null
  localStorageEnabled: boolean | null
  storageQuota: number | null
  storageUsage: number | null
  languages: string[]
  cookiesEnabled: boolean | null
  doNotTrack: string | null
  privacyNotes: string[]
  fingerprintBand: 'Low' | 'Medium' | 'High' | 'Unknown'
  fingerprintScore: number | null
  logDiagnosticsToConsole: () => void
}>()
</script>

<template>
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
          <span v-if="props.screenWidth && props.screenHeight">
            {{ props.screenWidth }} × {{ props.screenHeight }}
          </span>
          <span v-else>
            Unknown
          </span>
        </dd>
      </div>
      <div class="rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] font-medium text-slate-300">Pixel ratio</dt>
        <dd class="mt-0.5 text-[0.8rem] text-slate-200">
          {{ props.devicePixelRatio ?? 'Unknown' }}
        </dd>
      </div>
      <div class="rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] font-medium text-slate-300">Color depth</dt>
        <dd class="mt-0.5 text-[0.8rem] text-slate-200">
          <span v-if="props.colorDepth">
            {{ props.colorDepth }}-bit
          </span>
          <span v-else>
            Unknown
          </span>
        </dd>
      </div>
      <div class="rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] font-medium text-slate-300">CPU threads</dt>
        <dd class="mt-0.5 text-[0.8rem] text-slate-200">
          {{ props.hardwareConcurrency ?? 'Unknown' }}
        </dd>
      </div>
      <div class="rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] font-medium text-slate-300">Touch points</dt>
        <dd class="mt-0.5 text-[0.8rem] text-slate-200">
          {{ props.maxTouchPoints ?? 'Unknown' }}
        </dd>
      </div>
      <div class="rounded-lg bg-slate-950/60 px-3 py-2">
        <dt class="text-[0.7rem] font-medium text-slate-300">Platform</dt>
        <dd class="mt-0.5 text-[0.8rem] text-slate-200">
          {{ props.platform || 'Unknown' }}
        </dd>
      </div>
    </dl>

    <div class="mt-2 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
      <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
        GPU / Renderer (WebGL)
      </p>
      <p class="text-[0.7rem] text-slate-300">
        <span v-if="props.gpuRenderer">
          {{ props.gpuRenderer }}
        </span>
        <span v-else>
          Not reported; WebGL renderer is unavailable or blocked.
        </span>
      </p>
      <p v-if="props.gpuVendor" class="mt-0.5 text-[0.7rem] text-slate-500">
        Vendor:
        <span class="font-medium text-slate-300">
          {{ props.gpuVendor }}
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
            :class="props.localStorageEnabled ? 'bg-emerald-400' : 'bg-rose-400'"
          />
          <span>localStorage: {{ props.localStorageEnabled ? 'Available' : 'Blocked / disabled' }}</span>
        </li>
        <li class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>JavaScript: Enabled</span>
        </li>
        <li v-if="props.storageQuota != null" class="col-span-2 flex flex-col text-[0.7rem] text-slate-400">
          <span class="flex items-center gap-1.5">
            <span class="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>
              Storage quota:
              <span class="font-medium text-slate-200">
                {{ (props.storageQuota / (1024 * 1024)).toFixed(1) }} MB
              </span>
            </span>
          </span>
          <span v-if="props.storageUsage != null" class="ml-3 mt-0.5 text-slate-500">
            Approx. usage:
            <span class="font-medium text-slate-200">
              {{ (props.storageUsage / (1024 * 1024)).toFixed(1) }} MB
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
            {{ props.languages.length || 0 }}
          </span>
          &bull;
          Cookies:
          <span class="font-medium text-slate-200">
            {{ props.cookiesEnabled === false ? 'disabled or blocked' : 'enabled' }}
          </span>
          <span v-if="props.doNotTrack" class="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
            DNT: {{ props.doNotTrack }}
          </span>
        </p>
        <ul v-if="props.privacyNotes.length" class="mt-1 list-disc space-y-0.5 pl-4 text-[0.7rem] text-slate-400">
          <li v-for="note in props.privacyNotes" :key="note">
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
                {{ props.fingerprintBand }}
              </span>
            </span>
            <span v-if="props.fingerprintScore != null" class="tabular-nums text-slate-400">
              {{ props.fingerprintScore }} / 100
            </span>
          </div>
          <div class="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              v-if="props.fingerprintScore != null"
              class="h-full rounded-full transition-all"
              :class="[
                props.fingerprintBand === 'Low' && 'bg-emerald-400',
                props.fingerprintBand === 'Medium' && 'bg-amber-400',
                props.fingerprintBand === 'High' && 'bg-rose-400',
                props.fingerprintBand === 'Unknown' && 'bg-slate-500'
              ]"
              :style="{ width: `${props.fingerprintScore}%` }"
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
      @click="props.logDiagnosticsToConsole"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-slate-500" />
      Log diagnostics to console
    </button>
  </div>
</template>


