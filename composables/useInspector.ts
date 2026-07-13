import {
  computed,
  inject,
  onUnmounted,
  provide,
  ref,
  type ComputedRef,
  type InjectionKey
} from 'vue'
import type { ConnectionSnapshot } from '@/types'
import { useIpData } from './useIpData'
import { useBrowserFeatures } from './useBrowserFeatures'
import { useDeviceDetection } from './useDeviceDetection'
import { usePermissions } from './usePermissions'
import { useFingerprinting } from './useFingerprinting'
import { useRealtimeTracking } from './useRealtimeTracking'
import { useStorageAndConnection } from './useStorageAndConnection'
import { useWebRTCLeak } from './useWebRTCLeak'
import {
  copyTextToClipboard,
  downloadJson,
  downloadCsv,
  generateMarkdown,
  buildDebugSnippet,
  type ExportFormat
} from '@/utils/exports'

export type Inspector = ReturnType<typeof createInspector>

const InspectorKey: InjectionKey<Inspector> = Symbol('connection-inspector')

export function createInspector() {
  const ip = useIpData()
  const browser = useBrowserFeatures()
  const device = useDeviceDetection()
  const permissions = usePermissions()
  const fingerprinting = useFingerprinting()
  const realtime = useRealtimeTracking()
  const storage = useStorageAndConnection()
  const webRTC = useWebRTCLeak()

  const isHttps = computed(() => {
    if (typeof window === 'undefined') {
      return null
    }
    return window.location.protocol === 'https:'
  })

  const localDateTime = ref<string | null>(null)
  let clockTimer: ReturnType<typeof setInterval> | null = null

  function startClock() {
    const tick = () => {
      localDateTime.value = new Date().toLocaleString()
    }
    tick()
    clockTimer = setInterval(tick, 1000)
  }

  const onlineEvents = ref<{ at: string; online: boolean }[]>([])
  let onlineCleanup: (() => void) | null = null

  const copySummaryStatus = ref<'idle' | 'copied' | 'error'>('idle')
  const copyDebugStatus = ref<'idle' | 'copied' | 'error'>('idle')

  const extendedScreenInfo = computed(() => ({
    colorGamut: device.screenColorGamut.value,
    colorDepth: device.colorDepth.value,
    pixelDepth: device.screenPixelDepth.value
  }))

  const userPreferences = computed(() => ({
    colorScheme: device.colorScheme.value,
    reducedMotion: device.reducedMotion.value,
    prefersContrast: device.prefersContrast.value,
    reducedTransparency: device.reducedTransparency.value,
    prefersReducedData: device.prefersReducedData.value
  }))

  const deviceMemoryInfo = computed(() => ({
    deviceMemory: device.deviceMemory.value,
    totalJSHeapSize: null as number | null,
    usedJSHeapSize: null as number | null
  }))

  const vrInfo = computed(() => ({
    vrSupported: browser.vrSupported.value,
    arSupported: browser.arSupported.value,
    immersiveVRSupported: browser.immersiveVRSupported.value,
    inlineVRSupported: null as boolean | null,
    handTrackingSupported: null as boolean | null
  }))

  const wakeLockInfo = computed(() => ({
    supported: browser.wakeLockSupported.value,
    isActive: false as boolean | null,
    type: null as 'screen' | null
  }))

  const contactPickerInfo = computed(() => ({
    supported: browser.contactPickerSupported.value,
    properties: browser.contactPickerProperties.value
  }))

  const fileSystemAccessInfo = computed(() => ({
    supported: browser.fileSystemAccessSupported.value,
    showOpenFilePicker: browser.filePickerSupported.value,
    showSaveFilePicker: browser.filePickerSupported.value,
    showDirectoryPicker: browser.filePickerSupported.value
  }))

  const pictureInPictureInfo = computed(() => ({
    supported: browser.pictureInPictureSupported.value,
    autoPictureInPicture: false as boolean | null,
    documentPictureInPicture: browser.documentPictureInPictureSupported.value,
    videoPictureInPicture: browser.pictureInPictureSupported.value
  }))

  const paymentRequestInfo = computed(() => ({
    supported: browser.paymentRequestSupported.value,
    canMakePayment: browser.paymentRequestMethods.value.length > 0,
    paymentMethods: browser.paymentRequestMethods.value
  }))

  const credentialManagementInfo = computed(() => ({
    supported: browser.credentialManagementSupported.value,
    passwordCredential: browser.passwordCredentialSupported.value,
    federatedCredential: false as boolean | null,
    publicKeyCredential: browser.webAuthnSupported.value,
    conditionalMediation: false as boolean | null
  }))

  const shareApiInfo = computed(() => ({
    supported: browser.shareApiSupported.value,
    canShare: browser.shareApiCanShare.value,
    shareDataTypes: ['text/plain', 'text/url']
  }))

  /** Snapshot for export; generatedAt set at read time via getter on demand functions. */
  const snapshot: ComputedRef<ConnectionSnapshot> = computed(() => ({
    ip: ip.ipInfo.value,
    browser: browser.browserInfo.value,
    device: browser.deviceInfo.value,
    screen: device.screenInfo.value,
    window: device.windowInfo.value,
    connection: storage.connectionInfo.value,
    storage: storage.storageInfo.value,
    features: browser.featureSupport.value,
    fingerprinting: fingerprinting.fingerprintingInfo.value,
    permissions: permissions.permissionsInfo.value,
    media: permissions.mediaInfo.value,
    battery: realtime.batteryInfo.value,
    bluetooth: realtime.bluetoothInfo.value,
    input: realtime.inputInfo.value,
    risk: ip.riskInfo.value,
    performance: device.performanceTiming.value,
    webRTCLeak: webRTC.leakInfo.value,
    webSocketConnectivity: storage.webSocketConnectivity.value,
    ipv6Connectivity: storage.ipv6Connectivity.value,
    deviceMemory: deviceMemoryInfo.value,
    vrInfo: vrInfo.value,
    gamepadInfo: realtime.gamepadInfo.value,
    wakeLock: wakeLockInfo.value,
    contactPicker: contactPickerInfo.value,
    fileSystemAccess: fileSystemAccessInfo.value,
    pictureInPicture: pictureInPictureInfo.value,
    paymentRequest: paymentRequestInfo.value,
    credentialManagement: credentialManagementInfo.value,
    extendedScreen: extendedScreenInfo.value,
    userPreferences: userPreferences.value,
    shareApi: shareApiInfo.value,
    tls: device.tlsInfo.value,
    pageVisibility: device.pageVisibilityInfo.value,
    meta: {
      generatedAt: new Date().toISOString()
    }
  }))

  async function copySummaryToClipboard() {
    copySummaryStatus.value = 'idle'
    const success = await copyTextToClipboard(JSON.stringify(snapshot.value, null, 2))
    copySummaryStatus.value = success ? 'copied' : 'error'
    setTimeout(
      () => {
        copySummaryStatus.value = 'idle'
      },
      success ? 2000 : 3000
    )
  }

  async function copyDebugSnippetToClipboard() {
    copyDebugStatus.value = 'idle'
    const success = await copyTextToClipboard(buildDebugSnippet(snapshot.value))
    copyDebugStatus.value = success ? 'copied' : 'error'
    setTimeout(
      () => {
        copyDebugStatus.value = 'idle'
      },
      success ? 2000 : 3000
    )
  }

  function downloadSnapshot(format: ExportFormat = 'json') {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    if (format === 'json') {
      downloadJson(snapshot.value, `connection-inspector-${stamp}.json`)
      return
    }
    if (format === 'csv') {
      downloadCsv(snapshot.value, `connection-inspector-${stamp}.csv`)
      return
    }
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
  }

  function logDiagnosticsToConsole() {
    // eslint-disable-next-line no-console
    console.log('[Connection Inspector] snapshot', snapshot.value)
  }

  /** Cheap path: browser basics + IP. */
  function detectCritical() {
    browser.detectAll()
    device.detectAll()
    permissions.detectAll()
    fingerprinting.detectAll({
      doNotTrack: browser.doNotTrack.value,
      cookiesEnabled: browser.cookiesEnabled.value
    })
    realtime.detectAll()
    storage.detectStorage()
    storage.detectConnection()
    startClock()

    onlineEvents.value.push({
      at: new Date().toLocaleTimeString(),
      online: browser.online.value ?? true
    })
    onlineCleanup = browser.setupOnlineListeners(isOnline => {
      onlineEvents.value.push({
        at: new Date().toLocaleTimeString(),
        online: isOnline
      })
    })

    void ip.fetchIpInfo().then(() => {
      webRTC.setEgressIp(ip.ipInfo.value?.ip ?? null)
    })
  }

  /**
   * Heavier / network probes: run after idle or user intent.
   * Does not auto-request camera/mic permissions.
   */
  function detectDeferred() {
    void webRTC.testWebRTCLeak(ip.ipInfo.value?.ip ?? null)
    void storage.detectWebSocketConnectivity()
    storage.detectIPv6Connectivity()
  }

  function scheduleDeferred() {
    const run = () => detectDeferred()
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => run(), { timeout: 4000 })
    } else {
      setTimeout(run, 1500)
    }
  }

  function cleanup() {
    device.cleanup()
    realtime.cleanup()
    storage.cleanup()
    if (onlineCleanup) {
      onlineCleanup()
      onlineCleanup = null
    }
    if (clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }
  }

  return {
    ip,
    browser,
    device,
    permissions,
    fingerprinting,
    realtime,
    storage,
    webRTC,
    isHttps,
    localDateTime,
    onlineEvents,
    snapshot,
    copySummaryStatus,
    copyDebugStatus,
    copySummaryToClipboard,
    copyDebugSnippetToClipboard,
    downloadSnapshot,
    logDiagnosticsToConsole,
    detectCritical,
    detectDeferred,
    scheduleDeferred,
    cleanup
  }
}

export function provideInspector(): Inspector {
  const inspector = createInspector()
  provide(InspectorKey, inspector)
  onUnmounted(() => {
    inspector.cleanup()
  })
  return inspector
}

export function useInspector(): Inspector {
  const inspector = inject(InspectorKey)
  if (!inspector) {
    throw new Error('useInspector() must be used within a provideInspector() tree')
  }
  return inspector
}
