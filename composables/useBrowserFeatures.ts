import { ref, computed } from 'vue'
import type {
  BrowserInfo,
  DeviceInfo,
  FeatureSupport,
  GpuInfo,
  HttpHeaders,
  PluginInfo,
  MimeTypeInfo,
  SpeechVoice
} from '@/types'
import { parseUserAgent, type ClientHintsInput } from '@/utils/userAgent'

export function useBrowserFeatures() {
  // State
  const userAgent = ref<string | null>(null)
  const platform = ref<string | null>(null)
  const languages = ref<string[]>([])
  const online = ref<boolean | null>(null)
  const doNotTrack = ref<string | null>(null)
  const cookiesEnabled = ref<boolean | null>(null)
  const timezone = ref<string | null>(null)

  // Browser version and engine detection
  const browserName = ref<string | null>(null)
  const browserVersion = ref<string | null>(null)
  const browserEngine = ref<string | null>(null)
  const trueBrowserCore = ref<string | null>(null)

  // Device type detection
  const deviceType = ref<string | null>(null)
  const deviceModel = ref<string | null>(null)

  // OS detection
  const osName = ref<string | null>(null)
  const osVersion = ref<string | null>(null)
  const trueOsCore = ref<string | null>(null)

  // Feature / API support matrix
  const supportsServiceWorker = ref<boolean | null>(null)
  const supportsNotifications = ref<boolean | null>(null)
  const supportsClipboard = ref<boolean | null>(null)
  const supportsGeolocation = ref<boolean | null>(null)
  const supportsWebRTC = ref<boolean | null>(null)
  const supportsWebGL = ref<boolean | null>(null)
  const supportsWebGPU = ref<boolean | null>(null)
  const supportsIndexedDB = ref<boolean | null>(null)
  const websocketSupported = ref<boolean | null>(null)
  const speechSynthesisSupported = ref<boolean | null>(null)

  // WebGL versions
  const webglVersion = ref<string | null>(null)
  const webgl2Version = ref<string | null>(null)

  // GPU / WebGL renderer info
  const gpuRenderer = ref<string | null>(null)
  const gpuVendor = ref<string | null>(null)

  // Browser plugins
  const plugins = ref<PluginInfo[]>([])
  const mimeTypes = ref<MimeTypeInfo[]>([])

  // HTTP Headers
  const httpHeaders = ref<HttpHeaders>({})

  // Speech Synthesis
  const speechVoices = ref<SpeechVoice[]>([])

  // NEW: Share API
  const shareApiSupported = ref<boolean | null>(null)
  const shareApiCanShare = ref<boolean | null>(null)

  // NEW: Payment Request API
  const paymentRequestSupported = ref<boolean | null>(null)
  const paymentRequestMethods = ref<string[]>([])

  // NEW: Credential Management API
  const credentialManagementSupported = ref<boolean | null>(null)
  const webAuthnSupported = ref<boolean | null>(null)
  const passwordCredentialSupported = ref<boolean | null>(null)

  // NEW: Picture-in-Picture
  const pictureInPictureSupported = ref<boolean | null>(null)
  const documentPictureInPictureSupported = ref<boolean | null>(null)

  // NEW: File System Access API
  const fileSystemAccessSupported = ref<boolean | null>(null)
  const filePickerSupported = ref<boolean | null>(null)

  // NEW: Contact Picker API
  const contactPickerSupported = ref<boolean | null>(null)
  const contactPickerProperties = ref<string[]>([])

  // NEW: WebXR/VR
  const vrSupported = ref<boolean | null>(null)
  const arSupported = ref<boolean | null>(null)
  const immersiveVRSupported = ref<boolean | null>(null)

  // NEW: Wake Lock API
  const wakeLockSupported = ref<boolean | null>(null)

  // Computed
  const browserInfo = computed<BrowserInfo>(() => ({
    userAgent: userAgent.value,
    platform: platform.value,
    languages: languages.value,
    online: online.value,
    doNotTrack: doNotTrack.value,
    cookiesEnabled: cookiesEnabled.value,
    timezone: timezone.value,
    browserName: browserName.value,
    browserVersion: browserVersion.value,
    browserEngine: browserEngine.value,
    trueBrowserCore: trueBrowserCore.value
  }))

  const deviceInfo = computed<DeviceInfo>(() => ({
    type: deviceType.value,
    model: deviceModel.value,
    osName: osName.value,
    osVersion: osVersion.value,
    trueOsCore: trueOsCore.value
  }))

  const featureSupport = computed<FeatureSupport>(() => ({
    serviceWorker: supportsServiceWorker.value,
    notifications: supportsNotifications.value,
    clipboard: supportsClipboard.value,
    geolocation: supportsGeolocation.value,
    webRTC: supportsWebRTC.value,
    webGL: supportsWebGL.value,
    webGLVersion: webglVersion.value,
    webGL2Version: webgl2Version.value,
    webGPU: supportsWebGPU.value,
    indexedDB: supportsIndexedDB.value,
    websocket: websocketSupported.value,
    speechSynthesis: speechSynthesisSupported.value
  }))

  const gpuInfo = computed<GpuInfo>(() => ({
    renderer: gpuRenderer.value,
    vendor: gpuVendor.value
  }))

  // Detection functions
  function detectBasicInfo() {
    userAgent.value = navigator.userAgent
    platform.value = navigator.platform
    languages.value = (
      navigator.languages && navigator.languages.length > 0
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
  }

  function applyParsedIdentity(hints?: ClientHintsInput | null) {
    const parsed = parseUserAgent(navigator.userAgent || '', {
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints ?? 0,
      screenWidth: window.screen?.width,
      clientHints: hints
    })

    browserName.value = parsed.browser.name
    browserVersion.value = parsed.browser.version
    browserEngine.value = parsed.browser.engine
    trueBrowserCore.value = parsed.browser.engineFamily

    osName.value = parsed.os.name
    osVersion.value = parsed.os.version
    trueOsCore.value = parsed.os.family

    deviceType.value = parsed.device.type === 'Desktop' ? 'Desktop or laptop' : parsed.device.type
    deviceModel.value = parsed.device.model
  }

  function detectBrowserInfo() {
    applyParsedIdentity(readLowEntropyClientHints())
  }

  function detectDeviceType() {
    // Identity applied in detectBrowserInfo / refineWithClientHints
    if (!deviceType.value) {
      applyParsedIdentity(readLowEntropyClientHints())
    }
  }

  function detectOSInfo() {
    if (!osName.value) {
      applyParsedIdentity(readLowEntropyClientHints())
    }
  }

  function readLowEntropyClientHints(): ClientHintsInput | null {
    const uaData = (
      navigator as Navigator & {
        userAgentData?: {
          brands?: { brand: string; version: string }[]
          mobile?: boolean
          platform?: string
        }
      }
    ).userAgentData
    if (!uaData) {
      return null
    }
    return {
      brands: uaData.brands,
      mobile: uaData.mobile,
      platform: uaData.platform
    }
  }

  /** High-entropy Client Hints refine OS version, model, and full browser version. */
  async function refineWithClientHints(): Promise<void> {
    const uaData = (
      navigator as Navigator & {
        userAgentData?: {
          brands?: { brand: string; version: string }[]
          mobile?: boolean
          platform?: string
          getHighEntropyValues?: (hints: string[]) => Promise<ClientHintsInput>
        }
      }
    ).userAgentData

    if (!uaData?.getHighEntropyValues) {
      return
    }

    try {
      const high = await uaData.getHighEntropyValues([
        'architecture',
        'bitness',
        'model',
        'platformVersion',
        'fullVersionList',
        'uaFullVersion'
      ])
      applyParsedIdentity({
        brands: uaData.brands,
        fullVersionList: high.fullVersionList,
        mobile: uaData.mobile,
        platform: high.platform ?? uaData.platform,
        platformVersion: high.platformVersion,
        model: high.model,
        architecture: high.architecture,
        bitness: high.bitness,
        uaFullVersion: high.uaFullVersion
      })
    } catch {
      // User may deny high-entropy hints; keep low-entropy parse
    }
  }

  function detectFeatureSupport() {
    supportsServiceWorker.value = 'serviceWorker' in navigator
    supportsNotifications.value = 'Notification' in window
    supportsClipboard.value = !!navigator.clipboard
    supportsGeolocation.value = 'geolocation' in navigator
    supportsWebRTC.value =
      'RTCPeerConnection' in window ||
      'mozRTCPeerConnection' in window ||
      'webkitRTCPeerConnection' in window
    supportsWebGL.value = (() => {
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        return !!gl
      } catch {
        return false
      }
    })()
    supportsWebGPU.value = 'gpu' in navigator
    supportsIndexedDB.value = 'indexedDB' in window
    websocketSupported.value = 'WebSocket' in window
  }

  function detectWebGLVersions() {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const gl2 = canvas.getContext('webgl2')

      if (gl) {
        webglVersion.value = 'WebGL 1.0'
      }
      if (gl2) {
        webgl2Version.value = 'WebGL 2.0'
      }
    } catch {
      // WebGL not supported
    }
  }

  function detectGpuInfo() {
    try {
      const canvas = document.createElement('canvas')
      const gl = (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          gpuVendor.value = gl.getParameter(
            (debugInfo as unknown as { UNMASKED_VENDOR_WEBGL: number }).UNMASKED_VENDOR_WEBGL
          ) as string
          gpuRenderer.value = gl.getParameter(
            (debugInfo as unknown as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL
          ) as string
        } else {
          gpuRenderer.value = gl.getParameter(gl.RENDERER) as string
          gpuVendor.value = gl.getParameter(gl.VENDOR) as string
        }
      }
    } catch {
      gpuRenderer.value = null
      gpuVendor.value = null
    }
  }

  function detectPlugins() {
    if (navigator.plugins && navigator.plugins.length > 0) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i]
        plugins.value.push({
          name: plugin.name,
          description: plugin.description,
          filename: plugin.filename || 'Unknown'
        })

        for (let j = 0; j < plugin.length; j++) {
          const mimeType = plugin[j]
          mimeTypes.value.push({
            type: mimeType.type,
            description: mimeType.description,
            suffixes: mimeType.suffixes
          })
        }
      }
    }
  }

  function detectHttpHeaders() {
    // Only values the page can actually observe. Do not invent Accept/Encoding/Connection.
    const headers: HttpHeaders = {}
    headers['User-Agent'] = navigator.userAgent
    headers['Accept-Language'] = navigator.languages?.join(', ') || navigator.language || ''

    if (doNotTrack.value != null && doNotTrack.value !== '') {
      headers['DNT'] = doNotTrack.value
    }

    if (document.referrer) {
      headers['Referer'] = document.referrer
    }

    const uaData = (
      navigator as Navigator & {
        userAgentData?: {
          brands?: { brand: string; version: string }[]
          mobile?: boolean
          platform?: string
        }
      }
    ).userAgentData

    if (uaData?.brands) {
      headers['Sec-CH-UA'] = uaData.brands.map(b => `"${b.brand}";v="${b.version}"`).join(', ')
    }
    if (uaData?.mobile !== undefined) {
      headers['Sec-CH-UA-Mobile'] = uaData.mobile ? '?1' : '?0'
    }
    if (uaData?.platform) {
      headers['Sec-CH-UA-Platform'] = `"${uaData.platform}"`
    }

    httpHeaders.value = headers
  }

  function detectSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      speechSynthesisSupported.value = true
      const voices = speechSynthesis.getVoices()
      speechVoices.value = voices.map(v => ({
        name: v.name,
        lang: v.lang,
        default: v.default
      }))

      speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices()
        speechVoices.value = voices.map(v => ({
          name: v.name,
          lang: v.lang,
          default: v.default
        }))
      }
    } else {
      speechSynthesisSupported.value = false
    }
  }

  // NEW: Detect Share API
  function detectShareApi() {
    const nav = navigator as Navigator & {
      share?: () => Promise<void>
      canShare?: (data: unknown) => boolean
    }
    shareApiSupported.value = 'share' in nav
    if (typeof nav.share === 'function' && typeof nav.canShare === 'function') {
      shareApiCanShare.value = nav.canShare({
        title: 'Test',
        text: 'Test',
        url: 'https://example.com'
      })
    } else {
      shareApiCanShare.value = false
    }
  }

  // NEW: Detect Payment Request API
  interface PaymentRequestConstructor {
    new (
      methods: Array<{ supportedMethods: string }>,
      details: unknown
    ): {
      canMakePayment(): Promise<boolean>
    }
  }

  function detectPaymentRequest() {
    paymentRequestSupported.value = 'PaymentRequest' in window
    if (paymentRequestSupported.value) {
      // Try to detect supported payment methods
      try {
        const win = window as Window & { PaymentRequest?: PaymentRequestConstructor }
        if (win.PaymentRequest) {
          const pr = new win.PaymentRequest([{ supportedMethods: 'basic-card' }], {
            total: { label: 'Test', amount: { value: '1.00', currency: 'USD' } }
          })
          pr.canMakePayment()
            .then((result: boolean) => {
              if (result) {
                paymentRequestMethods.value = ['basic-card']
              }
            })
            .catch(() => {})
        }
      } catch {
        // Ignore errors
      }
    }
  }

  // NEW: Detect Credential Management API
  function detectCredentialManagement() {
    credentialManagementSupported.value = 'credentials' in navigator
    passwordCredentialSupported.value = 'PasswordCredential' in window
    webAuthnSupported.value = 'PublicKeyCredential' in window
  }

  // NEW: Detect Picture-in-Picture
  function detectPictureInPicture() {
    pictureInPictureSupported.value = 'pictureInPictureEnabled' in document
    documentPictureInPictureSupported.value = 'documentPictureInPicture' in window
  }

  // NEW: Detect File System Access API
  function detectFileSystemAccess() {
    fileSystemAccessSupported.value = 'showOpenFilePicker' in window
    filePickerSupported.value = 'showOpenFilePicker' in window
  }

  // NEW: Detect Contact Picker API
  function detectContactPicker() {
    const nav = navigator as Navigator & {
      contacts?: {
        select: (properties: string[], options?: { multiple: boolean }) => Promise<unknown>
        getProperties: () => string[]
      }
    }
    contactPickerSupported.value = 'contacts' in nav && typeof nav.contacts?.select === 'function'
    if (contactPickerSupported.value && nav.contacts?.getProperties) {
      try {
        contactPickerProperties.value = nav.contacts.getProperties()
      } catch {
        contactPickerProperties.value = ['name', 'email', 'tel'] // Common defaults
      }
    }
  }

  // NEW: Detect WebXR/VR
  function detectWebXR() {
    vrSupported.value = 'xr' in navigator
    if (vrSupported.value) {
      const nav = navigator as Navigator & {
        xr?: { isSessionSupported: (mode: string) => Promise<boolean> }
      }
      if (nav.xr?.isSessionSupported) {
        nav.xr
          .isSessionSupported('immersive-vr')
          .then(supported => {
            immersiveVRSupported.value = supported
          })
          .catch(() => {
            immersiveVRSupported.value = false
          })
        nav.xr
          .isSessionSupported('immersive-ar')
          .then(supported => {
            arSupported.value = supported
          })
          .catch(() => {
            arSupported.value = false
          })
      }
    } else {
      arSupported.value = false
      immersiveVRSupported.value = false
    }
  }

  // NEW: Detect Wake Lock API
  function detectWakeLock() {
    wakeLockSupported.value = 'wakeLock' in navigator
  }

  function setupOnlineListeners(callback?: (online: boolean) => void) {
    const handleOnline = () => {
      online.value = true
      callback?.(true)
    }
    const handleOffline = () => {
      online.value = false
      callback?.(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  function detectAll() {
    detectBasicInfo()
    detectBrowserInfo()
    detectDeviceType()
    detectOSInfo()
    detectFeatureSupport()
    detectWebGLVersions()
    detectGpuInfo()
    detectPlugins()
    detectHttpHeaders()
    detectSpeechSynthesis()
    detectShareApi()
    detectPaymentRequest()
    detectCredentialManagement()
    detectPictureInPicture()
    detectFileSystemAccess()
    detectContactPicker()
    detectWebXR()
    detectWakeLock()
    void refineWithClientHints()
  }

  return {
    // State
    userAgent,
    platform,
    languages,
    online,
    doNotTrack,
    cookiesEnabled,
    timezone,
    browserName,
    browserVersion,
    browserEngine,
    trueBrowserCore,
    deviceType,
    deviceModel,
    osName,
    osVersion,
    trueOsCore,
    supportsServiceWorker,
    supportsNotifications,
    supportsClipboard,
    supportsGeolocation,
    supportsWebRTC,
    supportsWebGL,
    supportsWebGPU,
    supportsIndexedDB,
    websocketSupported,
    speechSynthesisSupported,
    webglVersion,
    webgl2Version,
    gpuRenderer,
    gpuVendor,
    plugins,
    mimeTypes,
    httpHeaders,
    speechVoices,
    // NEW state
    shareApiSupported,
    shareApiCanShare,
    paymentRequestSupported,
    paymentRequestMethods,
    credentialManagementSupported,
    webAuthnSupported,
    passwordCredentialSupported,
    pictureInPictureSupported,
    documentPictureInPictureSupported,
    fileSystemAccessSupported,
    filePickerSupported,
    contactPickerSupported,
    contactPickerProperties,
    vrSupported,
    arSupported,
    immersiveVRSupported,
    wakeLockSupported,
    // Computed
    browserInfo,
    deviceInfo,
    featureSupport,
    gpuInfo,
    // Actions
    detectAll,
    detectBasicInfo,
    detectBrowserInfo,
    detectDeviceType,
    detectOSInfo,
    detectFeatureSupport,
    detectWebGLVersions,
    detectGpuInfo,
    detectPlugins,
    detectHttpHeaders,
    detectSpeechSynthesis,
    setupOnlineListeners,
    // NEW actions
    detectShareApi,
    detectPaymentRequest,
    detectCredentialManagement,
    detectPictureInPicture,
    detectFileSystemAccess,
    detectContactPicker,
    detectWebXR,
    detectWakeLock,
    refineWithClientHints
  }
}
