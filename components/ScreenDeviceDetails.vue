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

    <DeviceSpecs
      :screen-width="props.screenWidth"
      :screen-height="props.screenHeight"
      :device-pixel-ratio="props.devicePixelRatio"
      :color-depth="props.colorDepth"
      :hardware-concurrency="props.hardwareConcurrency"
      :max-touch-points="props.maxTouchPoints"
      :platform="props.platform"
    />
    <GpuInfo :gpu-renderer="props.gpuRenderer" :gpu-vendor="props.gpuVendor" />
    <StorageCapabilities
      :local-storage-enabled="props.localStorageEnabled"
      :storage-quota="props.storageQuota"
      :storage-usage="props.storageUsage"
    />
    <div class="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
      <PrivacyProfile
        :languages="props.languages"
        :cookies-enabled="props.cookiesEnabled"
        :do-not-track="props.doNotTrack"
        :privacy-notes="props.privacyNotes"
      />
      <Fingerprintability
        :fingerprint-band="props.fingerprintBand"
        :fingerprint-score="props.fingerprintScore"
      />
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


