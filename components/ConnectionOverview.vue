<script setup lang="ts">
  import { useInspector } from '@/composables/useInspector'

  const {
    ip,
    browser,
    device,
    permissions,
    storage,
    isHttps,
    copySummaryStatus,
    copyDebugStatus,
    copySummaryToClipboard,
    copyDebugSnippetToClipboard,
    downloadSnapshot
  } = useInspector()
</script>

<template>
  <section
    id="connection-overview"
    class="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft backdrop-blur sm:grid-cols-2 sm:gap-6 sm:p-5"
  >
    <div class="flex flex-col gap-3">
      <div
        class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400"
      >
        <span class="inline-flex h-6 items-center rounded-full bg-slate-800 px-2 text-[0.7rem]">
          Connection
        </span>
        <span class="hidden sm:inline">Overview</span>
      </div>
      <IpAddressDisplay :loading-ip="ip.loadingIp.value" :ip-info="ip.ipInfo.value" />
      <IpStatusBadges
        :ip-info="ip.ipInfo.value"
        :ip-status-label="ip.ipStatusLabel.value"
        :ip-status-tone="ip.ipStatusTone.value"
        :is-https="isHttps === true"
      />
      <RiskLevelGauge :ip-risk-score="ip.ipRiskScore.value" :ip-risk-band="ip.ipRiskBand.value" />
      <p v-if="ip.ipError.value" class="mt-2 text-xs text-rose-400" role="alert">
        {{ ip.ipError.value }}
      </p>

      <ConnectionStatus
        :online="browser.online.value"
        :connection-type="storage.connectionType.value"
        :connection-rtt="storage.connectionRtt.value"
        :connection-downlink="storage.connectionDownlink.value"
        :connection-save-data="storage.connectionSaveData.value"
        :client-rtt="ip.ipInfo.value?.client_rtt_ms ?? null"
        :is-mobile="ip.ipInfo.value?.is_mobile ?? null"
        :is-datacenter="ip.ipInfo.value?.is_datacenter ?? null"
        :is-satellite="ip.ipInfo.value?.is_satellite ?? null"
        :location-country="ip.ipInfo.value?.location?.country ?? null"
        :location-city="ip.ipInfo.value?.location?.city ?? null"
        :asn-org="ip.ipInfo.value?.asn?.org ?? null"
      />

      <QuickStats
        :location-country="ip.ipInfo.value?.location?.country ?? null"
        :location-city="ip.ipInfo.value?.location?.city ?? null"
        :location-state="ip.ipInfo.value?.location?.state ?? null"
        :asn-org="ip.ipInfo.value?.asn?.org ?? null"
        :asn-number="ip.ipInfo.value?.asn?.asn ?? null"
        :isp="ip.ipInfo.value?.asn?.org ?? null"
        :client-rtt="ip.ipInfo.value?.client_rtt_ms ?? null"
        :elapsed-ms="ip.ipInfo.value?.elapsed_ms ?? null"
      />
    </div>

    <div class="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
      <BrowserSummary
        :browser-name="browser.browserName.value"
        :browser-version="browser.browserVersion.value"
        :browser-engine="browser.browserEngine.value"
        :platform="browser.platform.value"
        :screen-width="device.screenWidth.value"
        :screen-height="device.screenHeight.value"
        :device-pixel-ratio="device.devicePixelRatio.value"
        :hardware-concurrency="device.hardwareConcurrency.value"
        :timezone="browser.timezone.value"
        :languages="browser.languages.value"
        :cookies-enabled="browser.cookiesEnabled.value"
        :do-not-track="browser.doNotTrack.value"
        :online="browser.online.value"
        :user-agent="browser.userAgent.value"
      />

      <FeatureStatusGrid
        :supports-service-worker="browser.supportsServiceWorker.value"
        :supports-notifications="browser.supportsNotifications.value"
        :supports-clipboard="browser.supportsClipboard.value"
        :supports-geolocation="browser.supportsGeolocation.value"
        :supports-web-r-t-c="browser.supportsWebRTC.value"
        :supports-web-g-l="browser.supportsWebGL.value"
        :supports-web-g-p-u="browser.supportsWebGPU.value"
        :supports-indexed-d-b="browser.supportsIndexedDB.value"
      />

      <div class="border-t border-slate-800 pt-3">
        <PermissionsTable
          :permission-geolocation="permissions.permissionGeolocation.value"
          :permission-notifications="permissions.permissionNotifications.value"
          :permission-camera="permissions.permissionCamera.value"
          :permission-microphone="permissions.permissionMicrophone.value"
          :permission-clipboard-read="permissions.permissionClipboardRead.value"
          :permission-last-checked="permissions.permissionLastChecked.value"
          :request-geolocation-permission="permissions.requestGeolocationPermission"
          :request-notification-permission="permissions.requestNotificationPermission"
          :request-camera-permission="permissions.requestCameraPermission"
          :request-microphone-permission="permissions.requestMicrophonePermission"
          :request-clipboard-read-permission="permissions.requestClipboardReadPermission"
        />
      </div>

      <div class="border-t border-slate-800 pt-3">
        <ServerViewComparison
          :server-view-loading="ip.serverViewLoading.value"
          :server-view-error="ip.serverViewError.value"
          :server-view-data="ip.serverViewData.value"
          :ip-info="ip.ipInfo.value"
          :user-agent="browser.userAgent.value"
          :is-https="isHttps === true"
          :run-server-view-check="ip.runServerViewCheck"
        />
      </div>
    </div>

    <ExportActions
      :copy-summary-status="copySummaryStatus"
      :copy-debug-status="copyDebugStatus"
      :copy-summary-to-clipboard="copySummaryToClipboard"
      :download-snapshot="downloadSnapshot"
      :copy-debug-snippet="copyDebugSnippetToClipboard"
    />
  </section>
</template>
