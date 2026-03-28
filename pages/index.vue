<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useIpData } from '@/composables/useIpData'
import { useBrowserFeatures } from '@/composables/useBrowserFeatures'
import { useDeviceDetection } from '@/composables/useDeviceDetection'
import { usePermissions } from '@/composables/usePermissions'
import { useFingerprinting } from '@/composables/useFingerprinting'
import { useRealtimeTracking } from '@/composables/useRealtimeTracking'
import { useStorageAndConnection } from '@/composables/useStorageAndConnection'
import { useSnapshotBuilder } from '@/composables/useSnapshotBuilder'
import { useWebRTCLeak } from '@/composables/useWebRTCLeak'
import { 
  copyTextToClipboard, 
  downloadJson, 
  downloadCsv, 
  generateMarkdown, 
  buildDebugSnippet,
  type ExportFormat
} from '@/utils/exports'

// Initialize all composables
const ipData = useIpData()
const browserFeatures = useBrowserFeatures()
const deviceDetection = useDeviceDetection()
const permissions = usePermissions()
const fingerprinting = useFingerprinting()
const realtimeTracking = useRealtimeTracking()
const storageConnection = useStorageAndConnection()
const webRTCLeak = useWebRTCLeak()

// NEW: Bundle extended types for snapshot builder
const extendedScreenInfo = computed(() => ({
  colorGamut: deviceDetection.screenColorGamut.value,
  colorDepth: deviceDetection.colorDepth.value,
  pixelDepth: deviceDetection.screenPixelDepth.value
}))

const userPreferences = computed(() => ({
  colorScheme: deviceDetection.colorScheme.value,
  reducedMotion: deviceDetection.reducedMotion.value,
  prefersContrast: deviceDetection.prefersContrast.value,
  reducedTransparency: deviceDetection.reducedTransparency.value,
  prefersReducedData: deviceDetection.prefersReducedData.value
}))

const deviceMemory = computed(() => ({
  deviceMemory: deviceDetection.deviceMemory.value,
  totalJSHeapSize: null, // Would need performance.memory API (deprecated)
  usedJSHeapSize: null
}))

const vrInfo = computed(() => ({
  vrSupported: browserFeatures.vrSupported.value,
  arSupported: browserFeatures.arSupported.value,
  immersiveVRSupported: browserFeatures.immersiveVRSupported.value,
  inlineVRSupported: null, // Not detected yet
  handTrackingSupported: null // Not detected yet
}))

const wakeLockInfo = computed(() => ({
  supported: browserFeatures.wakeLockSupported.value,
  isActive: false,
  type: null
}))

const contactPickerInfo = computed(() => ({
  supported: browserFeatures.contactPickerSupported.value,
  properties: browserFeatures.contactPickerProperties.value
}))

const fileSystemAccessInfo = computed(() => ({
  supported: browserFeatures.fileSystemAccessSupported.value,
  showOpenFilePicker: browserFeatures.filePickerSupported.value,
  showSaveFilePicker: browserFeatures.filePickerSupported.value,
  showDirectoryPicker: browserFeatures.filePickerSupported.value
}))

const pictureInPictureInfo = computed(() => ({
  supported: browserFeatures.pictureInPictureSupported.value,
  autoPictureInPicture: false,
  documentPictureInPicture: browserFeatures.documentPictureInPictureSupported.value,
  videoPictureInPicture: browserFeatures.pictureInPictureSupported.value
}))

const paymentRequestInfo = computed(() => ({
  supported: browserFeatures.paymentRequestSupported.value,
  canMakePayment: browserFeatures.paymentRequestMethods.value.length > 0,
  paymentMethods: browserFeatures.paymentRequestMethods.value
}))

const credentialManagementInfo = computed(() => ({
  supported: browserFeatures.credentialManagementSupported.value,
  passwordCredential: browserFeatures.passwordCredentialSupported.value,
  federatedCredential: false,
  publicKeyCredential: browserFeatures.webAuthnSupported.value,
  conditionalMediation: false
}))

const shareApiInfo = computed(() => ({
  supported: browserFeatures.shareApiSupported.value,
  canShare: browserFeatures.shareApiCanShare.value,
  shareDataTypes: ['text/plain', 'text/url']
}))

// Build snapshot from all composables
const { snapshot } = useSnapshotBuilder(
  ipData.ipInfo,
  browserFeatures.browserInfo,
  browserFeatures.deviceInfo,
  deviceDetection.screenInfo,
  deviceDetection.windowInfo,
  storageConnection.connectionInfo,
  storageConnection.storageInfo,
  browserFeatures.featureSupport,
  fingerprinting.fingerprintingInfo,
  permissions.permissionsInfo,
  permissions.mediaInfo,
  realtimeTracking.batteryInfo,
  realtimeTracking.bluetoothInfo,
  realtimeTracking.inputInfo,
  ipData.riskInfo,
  deviceDetection.performanceTiming,
  // NEW parameters
  webRTCLeak.leakInfo,
  storageConnection.webSocketConnectivity,
  storageConnection.ipv6Connectivity,
  deviceMemory,
  vrInfo,
  realtimeTracking.gamepadInfo,
  wakeLockInfo,
  contactPickerInfo,
  fileSystemAccessInfo,
  pictureInPictureInfo,
  paymentRequestInfo,
  credentialManagementInfo,
  extendedScreenInfo,
  userPreferences,
  shareApiInfo,
  deviceDetection.tlsInfo,
  deviceDetection.pageVisibilityInfo
)

// Export states
const copySummaryStatus = ref<'idle' | 'copied' | 'error'>('idle')
const copyDebugStatus = ref<'idle' | 'copied' | 'error'>('idle')

// Online events history
const onlineEvents = ref<{ at: string; online: boolean }[]>([])

// Initialize online state and listeners
function initOnlineListeners() {
  const cleanup = browserFeatures.setupOnlineListeners((isOnline) => {
    onlineEvents.value.push({
      at: new Date().toLocaleTimeString(),
      online: isOnline
    })
  })
  return cleanup
}

// Export functions
async function copySummaryToClipboard() {
  copySummaryStatus.value = 'idle'
  const text = JSON.stringify(snapshot.value, null, 2)
  const success = await copyTextToClipboard(text)
  copySummaryStatus.value = success ? 'copied' : 'error'
  setTimeout(() => {
    copySummaryStatus.value = 'idle'
  }, success ? 2000 : 3000)
}

async function copyDebugSnippetToClipboard() {
  copyDebugStatus.value = 'idle'
  const text = buildDebugSnippet(snapshot.value)
  const success = await copyTextToClipboard(text)
  copyDebugStatus.value = success ? 'copied' : 'error'
  setTimeout(() => {
    copyDebugStatus.value = 'idle'
  }, success ? 2000 : 3000)
}

function downloadSnapshot(format: ExportFormat = 'json') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  switch (format) {
    case 'json':
      downloadJson(snapshot.value, `connection-inspector-${stamp}.json`)
      break
    case 'csv':
      downloadCsv(snapshot.value, `connection-inspector-${stamp}.csv`)
      break
    case 'markdown': {
      const markdown = generateMarkdown(snapshot.value)
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `connection-inspector-${stamp}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      break
    }
  }
}

// Developer diagnostics
function logDiagnosticsToConsole(): void {
  // eslint-disable-next-line no-console
  console.log('[Connection Inspector] snapshot', snapshot.value)
}

// Lifecycle
onMounted(() => {
  // Record initial online state
  onlineEvents.value.push({
    at: new Date().toLocaleTimeString(),
    online: browserFeatures.online.value ?? true
  })
  
  // Run all detection
  browserFeatures.detectAll()
  deviceDetection.detectAll(realtimeTracking.scrollPosition)
  permissions.detectAll()
  fingerprinting.detectAll()
  realtimeTracking.detectAll()
  storageConnection.detectAll()
  
  // NEW: Run additional detection
  void webRTCLeak.testWebRTCLeak()
  void storageConnection.detectWebSocketConnectivity()
  storageConnection.detectIPv6Connectivity()
  
  // Fetch IP data
  ipData.fetchIpInfo()
  
  // Setup listeners
  initOnlineListeners()
})

onUnmounted(() => {
  // Cleanup all listeners
  deviceDetection.cleanup()
  realtimeTracking.cleanup()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Table of Contents Sidebar -->
    <TableOfContents />

    <!-- Top summary (IP + quick browser summary) -->
    <section id="connection-overview">
      <ConnectionOverview
        :loading-ip="ipData.loadingIp.value"
        :ip-info="ipData.ipInfo.value"
        :ip-error="ipData.ipError.value"
        :is-https="true"
        :ip-status-label="ipData.ipStatusLabel.value"
        :ip-status-tone="ipData.ipStatusTone.value"
        :ip-risk-score="ipData.ipRiskScore.value"
        :ip-risk-band="ipData.ipRiskBand.value"
        :user-agent="browserFeatures.userAgent.value"
        :cookies-enabled="browserFeatures.cookiesEnabled.value"
        :online="browserFeatures.online.value"
        :timezone="browserFeatures.timezone.value"
        :languages="browserFeatures.languages.value"
        :do-not-track="browserFeatures.doNotTrack.value"
        :supports-service-worker="browserFeatures.supportsServiceWorker.value"
        :supports-notifications="browserFeatures.supportsNotifications.value"
        :supports-clipboard="browserFeatures.supportsClipboard.value"
        :supports-geolocation="browserFeatures.supportsGeolocation.value"
        :supports-web-r-t-c="browserFeatures.supportsWebRTC.value"
        :supports-web-g-l="browserFeatures.supportsWebGL.value"
        :supports-web-g-p-u="browserFeatures.supportsWebGPU.value"
        :supports-indexed-d-b="browserFeatures.supportsIndexedDB.value"
        :online-events="onlineEvents"
        :permission-geolocation="permissions.permissionGeolocation.value"
        :permission-notifications="permissions.permissionNotifications.value"
        :permission-camera="permissions.permissionCamera.value"
        :permission-microphone="permissions.permissionMicrophone.value"
        :permission-clipboard-read="permissions.permissionClipboardRead.value"
        :permission-last-checked="permissions.permissionLastChecked.value"
        :server-view-loading="ipData.serverViewLoading.value"
        :server-view-error="ipData.serverViewError.value"
        :server-view-data="ipData.serverViewData.value"
        :copy-summary-status="copySummaryStatus"
        :copy-debug-status="copyDebugStatus"
        :request-geolocation-permission="permissions.requestGeolocationPermission"
        :request-notification-permission="permissions.requestNotificationPermission"
        :request-camera-permission="permissions.requestCameraPermission"
        :request-microphone-permission="permissions.requestMicrophonePermission"
        :request-clipboard-read-permission="permissions.requestClipboardReadPermission"
        :run-server-view-check="ipData.runServerViewCheck"
        :copy-summary-to-clipboard="copySummaryToClipboard"
        :download-snapshot="downloadSnapshot"
        :copy-debug-snippet="copyDebugSnippetToClipboard"
        :connection-type="storageConnection.connectionType.value"
        :connection-rtt="storageConnection.connectionRtt.value"
        :connection-downlink="storageConnection.connectionDownlink.value"
        :connection-save-data="storageConnection.connectionSaveData.value"
        :client-rtt="ipData.ipInfo.value?.client_rtt_ms ?? null"
        :is-mobile="ipData.ipInfo.value?.is_mobile ?? null"
        :is-datacenter="ipData.ipInfo.value?.is_datacenter ?? null"
        :is-satellite="ipData.ipInfo.value?.is_satellite ?? null"
        :location-country="ipData.ipInfo.value?.location?.country ?? null"
        :location-city="ipData.ipInfo.value?.location?.city ?? null"
        :location-state="ipData.ipInfo.value?.location?.state ?? null"
        :asn-org="ipData.ipInfo.value?.asn?.org ?? null"
        :asn-number="ipData.ipInfo.value?.asn?.asn ?? null"
        :isp="ipData.ipInfo.value?.asn?.org ?? null"
        :elapsed-ms="ipData.ipInfo.value?.elapsed_ms ?? null"
        :browser-name="browserFeatures.browserName.value"
        :browser-version="browserFeatures.browserVersion.value"
        :browser-engine="browserFeatures.browserEngine.value"
        :platform="browserFeatures.platform.value"
        :screen-width="deviceDetection.screenWidth.value"
        :screen-height="deviceDetection.screenHeight.value"
        :device-pixel-ratio="deviceDetection.devicePixelRatio.value"
        :hardware-concurrency="deviceDetection.hardwareConcurrency.value"
      />
    </section>

    <!-- Detailed sections -->
    <section class="grid gap-4 md:grid-cols-2">
      <!-- Network / IP details -->
      <div id="network-ip-details">
        <NetworkIpDetails
          :loading-ip="ipData.loadingIp.value"
          :ip-info="ipData.ipInfo.value"
          :connection-type="storageConnection.connectionType.value"
          :connection-downlink="storageConnection.connectionDownlink.value"
          :connection-rtt="storageConnection.connectionRtt.value"
          :connection-save-data="storageConnection.connectionSaveData.value"
          :reverse-dns-loading="ipData.reverseDnsLoading.value"
          :reverse-dns-error="ipData.reverseDnsError.value"
          :reverse-dns-hostnames="ipData.reverseDnsHostnames.value"
          :fetch-ip-info="ipData.fetchIpInfo"
          :run-reverse-dns-lookup="ipData.runReverseDnsLookup"
        />
      </div>

      <!-- Screen & device details -->
      <div id="screen-device-details">
        <ScreenDeviceDetails
          :screen-width="deviceDetection.screenWidth.value"
          :screen-height="deviceDetection.screenHeight.value"
          :device-pixel-ratio="deviceDetection.devicePixelRatio.value"
          :color-depth="deviceDetection.colorDepth.value"
          :hardware-concurrency="deviceDetection.hardwareConcurrency.value"
          :max-touch-points="deviceDetection.maxTouchPoints.value"
          :platform="browserFeatures.platform.value"
          :gpu-renderer="browserFeatures.gpuRenderer.value"
          :gpu-vendor="browserFeatures.gpuVendor.value"
          :local-storage-enabled="storageConnection.localStorageEnabled.value"
          :storage-quota="storageConnection.storageQuota.value"
          :storage-usage="storageConnection.storageUsage.value"
          :languages="browserFeatures.languages.value"
          :cookies-enabled="browserFeatures.cookiesEnabled.value"
          :do-not-track="browserFeatures.doNotTrack.value"
          :privacy-notes="[]"
          :fingerprint-band="fingerprinting.privacyProfile.value"
          :fingerprint-score="fingerprinting.privacyScore.value"
          :log-diagnostics-to-console="logDiagnosticsToConsole"
        />
      </div>
    </section>

    <!-- DNS Leak Test -->
    <section id="dns-leak-test" class="grid gap-4 md:grid-cols-2">
      <DnsLeakTest />
    </section>

    <!-- Extended Browser & Device Information -->
    <ExtendedBrowserInfo
      :browser-name="browserFeatures.browserName.value"
      :browser-version="browserFeatures.browserVersion.value"
      :browser-engine="browserFeatures.browserEngine.value"
      :true-browser-core="browserFeatures.trueBrowserCore.value"
      :device-type="browserFeatures.deviceType.value"
      :device-model="browserFeatures.deviceModel.value"
      :os-name="browserFeatures.osName.value"
      :os-version="browserFeatures.osVersion.value"
      :true-os-core="browserFeatures.trueOsCore.value"
      :system-date-time="null"
      :local-date-time="null"
      :is-dst="null"
      :timezone="browserFeatures.timezone.value"
      :canvas-fingerprinting="fingerprinting.canvasFingerprinting.value"
      :audio-context-fingerprinting="fingerprinting.audioContextFingerprinting.value"
      :fingerprinting-resistance="fingerprinting.fingerprintingResistance.value"
      :http-headers="browserFeatures.httpHeaders.value"
      :window-outer-width="deviceDetection.windowOuterWidth.value"
      :window-outer-height="deviceDetection.windowOuterHeight.value"
      :window-inner-width="deviceDetection.windowInnerWidth.value"
      :window-inner-height="deviceDetection.windowInnerHeight.value"
      :is-fullscreen="deviceDetection.isFullscreen.value"
      :screen-orientation="deviceDetection.screenOrientation.value"
      :aspect-ratio="deviceDetection.aspectRatio.value"
      :battery-level="realtimeTracking.batteryLevel.value"
      :battery-charging="realtimeTracking.batteryCharging.value"
      :battery-charging-time="realtimeTracking.batteryChargingTime.value"
      :battery-discharging-time="realtimeTracking.batteryDischargingTime.value"
      :bluetooth-supported="realtimeTracking.bluetoothSupported.value"
      :bluetooth-available="realtimeTracking.bluetoothAvailable.value"
      :device-orientation="deviceDetection.deviceOrientation.value"
      :device-motion="deviceDetection.deviceMotion.value"
      :speakers="permissions.speakers.value"
      :microphones="permissions.microphones.value"
      :cameras="permissions.cameras.value"
      :speakers-count="permissions.speakersCount.value"
      :microphones-count="permissions.microphonesCount.value"
      :cameras-count="permissions.camerasCount.value"
      :plugins="browserFeatures.plugins.value"
      :mime-types="browserFeatures.mimeTypes.value"
      :ad-blocker-detected="fingerprinting.adBlockerDetected.value"
      :tls-version="deviceDetection.tlsVersion.value"
      :tls-cipher="deviceDetection.tlsCipher.value"
      :webgl-version="browserFeatures.webglVersion.value"
      :webgl2-version="browserFeatures.webgl2Version.value"
      :speech-synthesis-supported="browserFeatures.speechSynthesisSupported.value"
      :speech-voices="browserFeatures.speechVoices.value"
      :fonts-detected="fingerprinting.fontsDetected.value"
      :page-visibility-initially-visible="deviceDetection.pageVisibilityInitiallyVisible.value"
      :page-visibility-last-visible="deviceDetection.pageVisibilityLastVisible.value"
      :page-visibility-last-hidden="deviceDetection.pageVisibilityLastHidden.value"
      :performance-timing="deviceDetection.performanceTiming.value"
      :websocket-supported="browserFeatures.websocketSupported.value"
      :session-storage-enabled="storageConnection.sessionStorageEnabled.value"
      :history-length="deviceDetection.historyLength.value"
      :page-referrer="deviceDetection.pageReferrer.value"
      :private-browsing-mode="deviceDetection.privateBrowsingMode.value"
      :has-mouse="realtimeTracking.hasMouse.value"
      :has-touchscreen="realtimeTracking.hasTouchscreen.value"
      :last-key-pressed="realtimeTracking.lastKeyPressed.value"
      :caps-lock-state="realtimeTracking.capsLockState.value"
      :scroll-position="realtimeTracking.scrollPosition.value"
      :mouse-position="realtimeTracking.mousePosition.value"
      :last-click-position="realtimeTracking.lastClickPosition.value"
    />
  </div>
</template>
