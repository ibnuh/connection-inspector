<script setup lang="ts">
  import { useInspector } from '@/composables/useInspector'

  const { browser, device, storage, fingerprinting, logDiagnosticsToConsole } = useInspector()
</script>

<template>
  <div
    id="screen-device-details"
    class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft"
  >
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-slate-100">Screen and device</h2>
        <p class="text-xs text-slate-400">
          Resolution, pixel density, and basic device capabilities.
        </p>
      </div>
    </div>

    <DeviceSpecs
      :screen-width="device.screenWidth.value"
      :screen-height="device.screenHeight.value"
      :device-pixel-ratio="device.devicePixelRatio.value"
      :color-depth="device.colorDepth.value"
      :hardware-concurrency="device.hardwareConcurrency.value"
      :max-touch-points="device.maxTouchPoints.value"
      :platform="browser.platform.value"
    />
    <GpuInfo :gpu-renderer="browser.gpuRenderer.value" :gpu-vendor="browser.gpuVendor.value" />
    <StorageCapabilities
      :local-storage-enabled="storage.localStorageEnabled.value"
      :session-storage-enabled="storage.sessionStorageEnabled.value"
      :indexed-d-b-supported="browser.supportsIndexedDB.value"
      :storage-quota="storage.storageQuota.value"
      :storage-usage="storage.storageUsage.value"
    />
    <div
      class="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400"
    >
      <PrivacyProfile
        :languages="browser.languages.value"
        :cookies-enabled="browser.cookiesEnabled.value"
        :do-not-track="browser.doNotTrack.value"
        :privacy-notes="[]"
      />
      <Fingerprintability
        :fingerprint-band="fingerprinting.privacyProfile.value"
        :fingerprint-score="fingerprinting.privacyScore.value"
      />
    </div>
    <button
      type="button"
      class="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      @click="logDiagnosticsToConsole"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-slate-500" />
      Log diagnostics to console
    </button>
  </div>
</template>
