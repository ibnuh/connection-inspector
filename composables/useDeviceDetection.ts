import { ref, computed } from 'vue'
import type {
  ScreenInfo,
  WindowInfo,
  DeviceOrientationData,
  DeviceMotionData,
  TlsInfo,
  PageVisibilityInfo,
  PerformanceTiming
} from '@/types'

export function useDeviceDetection() {
  // Screen state
  const screenWidth = ref<number | null>(null)
  const screenHeight = ref<number | null>(null)
  const devicePixelRatio = ref<number | null>(null)
  const colorDepth = ref<number | null>(null)
  const hardwareConcurrency = ref<number | null>(null)
  const maxTouchPoints = ref<number | null>(null)
  const screenOrientation = ref<string | null>(null)
  const aspectRatio = ref<string | null>(null)

  // Window state
  const windowOuterWidth = ref<number | null>(null)
  const windowOuterHeight = ref<number | null>(null)
  const windowInnerWidth = ref<number | null>(null)
  const windowInnerHeight = ref<number | null>(null)
  const isFullscreen = ref<boolean | null>(null)

  // Device orientation and motion
  const deviceOrientation = ref<DeviceOrientationData | null>(null)
  const deviceMotion = ref<DeviceMotionData | null>(null)

  // TLS/SSL
  const tlsVersion = ref<string | null>(null)
  const tlsCipher = ref<string | null>(null)

  // Page visibility
  const pageVisibilityInitiallyVisible = ref<boolean | null>(null)
  const pageVisibilityLastVisible = ref<Date | null>(null)
  const pageVisibilityLastHidden = ref<Date | null>(null)

  // Performance timing
  const performanceTiming = ref<PerformanceTiming | null>(null)

  // History
  const historyLength = ref<number | null>(null)

  // Page referrer
  const pageReferrer = ref<string | null>(null)

  // Private browsing
  const privateBrowsingMode = ref<boolean | null>(null)

  // Event handlers for cleanup
  let resizeHandler: (() => void) | null = null
  let orientationChangeHandler: (() => void) | null = null
  let visibilityChangeHandler: (() => void) | null = null
  let deviceOrientationHandler: ((event: DeviceOrientationEvent) => void) | null = null
  let deviceMotionHandler: ((event: DeviceMotionEvent) => void) | null = null

  // NEW: User preferences
  const colorScheme = ref<'light' | 'dark' | 'no-preference' | null>(null)
  const reducedMotion = ref<boolean | null>(null)
  const prefersContrast = ref<'more' | 'less' | 'no-preference' | 'custom' | null>(null)
  const reducedTransparency = ref<boolean | null>(null)
  const prefersReducedData = ref<boolean | null>(null)

  // NEW: Extended screen info
  const screenColorGamut = ref<'srgb' | 'p3' | 'rec2020' | null>(null)
  const screenPixelDepth = ref<number | null>(null)

  // NEW: Device memory
  const deviceMemory = ref<number | null>(null) // in GB

  // Computed
  const screenInfo = computed<ScreenInfo>(() => ({
    width: screenWidth.value,
    height: screenHeight.value,
    devicePixelRatio: devicePixelRatio.value,
    colorDepth: colorDepth.value,
    hardwareConcurrency: hardwareConcurrency.value,
    maxTouchPoints: maxTouchPoints.value,
    orientation: screenOrientation.value,
    aspectRatio: aspectRatio.value
  }))

  const windowInfo = computed<WindowInfo>(() => ({
    outerWidth: windowOuterWidth.value,
    outerHeight: windowOuterHeight.value,
    innerWidth: windowInnerWidth.value,
    innerHeight: windowInnerHeight.value,
    isFullscreen: isFullscreen.value
  }))

  const tlsInfo = computed<TlsInfo>(() => ({
    version: tlsVersion.value,
    cipher: tlsCipher.value
  }))

  const pageVisibilityInfo = computed<PageVisibilityInfo>(() => ({
    initiallyVisible: pageVisibilityInitiallyVisible.value,
    lastVisible: pageVisibilityLastVisible.value,
    lastHidden: pageVisibilityLastHidden.value
  }))

  // Detection functions
  function detectScreenInfo() {
    screenWidth.value = window.screen.width
    screenHeight.value = window.screen.height
    devicePixelRatio.value = window.devicePixelRatio || 1
    colorDepth.value = window.screen.colorDepth
    hardwareConcurrency.value =
      (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? null
    maxTouchPoints.value =
      (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? null
  }

  function detectWindowSize() {
    windowOuterWidth.value = window.outerWidth
    windowOuterHeight.value = window.outerHeight
    windowInnerWidth.value = window.innerWidth
    windowInnerHeight.value = window.innerHeight
    isFullscreen.value = !!document.fullscreenElement

    // Setup resize listener
    resizeHandler = () => {
      windowOuterWidth.value = window.outerWidth
      windowOuterHeight.value = window.outerHeight
      windowInnerWidth.value = window.innerWidth
      windowInnerHeight.value = window.innerHeight
      isFullscreen.value = !!document.fullscreenElement
    }
    window.addEventListener('resize', resizeHandler)
  }

  function detectScreenOrientation() {
    if (screenWidth.value && screenHeight.value) {
      screenOrientation.value = screenWidth.value > screenHeight.value ? 'Landscape' : 'Portrait'

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
      const divisor = gcd(screenWidth.value, screenHeight.value)
      aspectRatio.value = `${screenWidth.value / divisor}:${screenHeight.value / divisor}`
    }

    if (screen.orientation) {
      screenOrientation.value = screen.orientation.type.includes('landscape')
        ? 'Landscape'
        : 'Portrait'

      orientationChangeHandler = () => {
        screenOrientation.value = screen.orientation.type.includes('landscape')
          ? 'Landscape'
          : 'Portrait'
      }
      screen.orientation.addEventListener('change', orientationChangeHandler)
    }
  }

  function detectDeviceOrientation() {
    if (window.DeviceOrientationEvent) {
      deviceOrientationHandler = (event: DeviceOrientationEvent) => {
        deviceOrientation.value = {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        }
      }
      window.addEventListener('deviceorientation', deviceOrientationHandler)
    }

    if (window.DeviceMotionEvent) {
      deviceMotionHandler = (event: DeviceMotionEvent) => {
        deviceMotion.value = {
          acceleration: {
            x: event.acceleration?.x ?? null,
            y: event.acceleration?.y ?? null,
            z: event.acceleration?.z ?? null
          },
          accelerationIncludingGravity: {
            x: event.accelerationIncludingGravity?.x ?? null,
            y: event.accelerationIncludingGravity?.y ?? null,
            z: event.accelerationIncludingGravity?.z ?? null
          },
          rotationRate: {
            alpha: event.rotationRate?.alpha ?? null,
            beta: event.rotationRate?.beta ?? null,
            gamma: event.rotationRate?.gamma ?? null
          }
        }
      }
      window.addEventListener('devicemotion', deviceMotionHandler)
    }
  }

  function detectTls() {
    // Browsers do not expose negotiated TLS version or cipher to page JS.
    // Only report what we can honestly observe: secure context / protocol.
    if (location.protocol === 'https:') {
      tlsVersion.value = 'HTTPS (TLS details not exposed to page JavaScript)'
      tlsCipher.value = null
    } else if (location.protocol === 'http:') {
      tlsVersion.value = 'HTTP (not encrypted)'
      tlsCipher.value = null
    } else {
      tlsVersion.value = null
      tlsCipher.value = null
    }
  }

  function detectPageVisibility() {
    pageVisibilityInitiallyVisible.value = !document.hidden

    visibilityChangeHandler = () => {
      if (document.hidden) {
        pageVisibilityLastHidden.value = new Date()
      } else {
        pageVisibilityLastVisible.value = new Date()
      }
    }
    document.addEventListener('visibilitychange', visibilityChangeHandler)
  }

  function detectPerformanceTiming() {
    if (performance.timing) {
      const timing = performance.timing
      const navigationStart = timing.navigationStart
      const loadEventEnd = timing.loadEventEnd

      if (loadEventEnd && navigationStart) {
        const pageLoadTime = loadEventEnd - navigationStart
        const dnsLookupTime = timing.domainLookupEnd - timing.domainLookupStart
        const tcpConnectionTime = timing.connectEnd - timing.connectStart
        const serverResponseTime = timing.responseStart - timing.requestStart
        const pageDownloadTime = timing.responseEnd - timing.responseStart
        const networkTime = timing.responseEnd - timing.navigationStart
        const browserTime = loadEventEnd - timing.responseEnd

        performanceTiming.value = {
          pageLoadTime: Math.round((pageLoadTime / 1000) * 100) / 100,
          networkTime: Math.round((networkTime / 1000) * 100) / 100,
          dnsLookupTime: Math.round((dnsLookupTime / 1000) * 100) / 100,
          tcpConnectionTime: Math.round((tcpConnectionTime / 1000) * 100) / 100,
          serverResponseTime: Math.round((serverResponseTime / 1000) * 100) / 100,
          pageDownloadTime: Math.round((pageDownloadTime / 1000) * 100) / 100,
          browserTime: Math.round((browserTime / 1000) * 100) / 100
        }
      }
    }
  }

  function detectHistory() {
    historyLength.value = history.length
  }

  function detectReferrer() {
    pageReferrer.value = document.referrer || 'None'
  }

  function detectPrivateBrowsing() {
    try {
      const db = indexedDB.open('__private_browsing_test__')
      db.onerror = () => {
        privateBrowsingMode.value = true
      }
      db.onsuccess = () => {
        privateBrowsingMode.value = false
        try {
          indexedDB.deleteDatabase('__private_browsing_test__')
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch {
      privateBrowsingMode.value = null
    }
  }

  function cleanup() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
    if (orientationChangeHandler && screen.orientation) {
      screen.orientation.removeEventListener('change', orientationChangeHandler)
    }
    if (visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler)
    }
    if (deviceOrientationHandler) {
      window.removeEventListener('deviceorientation', deviceOrientationHandler)
    }
    if (deviceMotionHandler) {
      window.removeEventListener('devicemotion', deviceMotionHandler)
    }
  }

  function detectAll() {
    detectScreenInfo()
    detectWindowSize()
    detectScreenOrientation()
    detectDeviceOrientation()
    detectTls()
    detectPageVisibility()
    detectPerformanceTiming()
    detectHistory()
    detectReferrer()
    detectPrivateBrowsing()
    detectUserPreferences()
    detectExtendedScreenInfo()
    detectDeviceMemory()
  }

  // NEW: Detect user preferences
  function detectUserPreferences() {
    // Color scheme
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (colorSchemeQuery.matches) {
      colorScheme.value = 'dark'
    } else {
      const lightQuery = window.matchMedia('(prefers-color-scheme: light)')
      colorScheme.value = lightQuery.matches ? 'light' : 'no-preference'
    }

    // Reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.value = motionQuery.matches

    // Contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    if (contrastQuery.matches) {
      prefersContrast.value = 'more'
    } else {
      const lessContrastQuery = window.matchMedia('(prefers-contrast: less)')
      if (lessContrastQuery.matches) {
        prefersContrast.value = 'less'
      } else {
        const customContrastQuery = window.matchMedia('(prefers-contrast: custom)')
        prefersContrast.value = customContrastQuery.matches ? 'custom' : 'no-preference'
      }
    }

    // Reduced transparency
    const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)')
    reducedTransparency.value = transparencyQuery.matches

    // Reduced data (experimental, mostly mobile)
    const dataQuery = window.matchMedia('(prefers-reduced-data: reduce)')
    prefersReducedData.value = dataQuery.matches
  }

  // NEW: Detect extended screen info
  function detectExtendedScreenInfo() {
    // Color gamut
    if (window.matchMedia('(color-gamut: rec2020)').matches) {
      screenColorGamut.value = 'rec2020'
    } else if (window.matchMedia('(color-gamut: p3)').matches) {
      screenColorGamut.value = 'p3'
    } else if (window.matchMedia('(color-gamut: srgb)').matches) {
      screenColorGamut.value = 'srgb'
    } else {
      screenColorGamut.value = null
    }

    // Pixel depth
    screenPixelDepth.value = window.screen.pixelDepth || null
  }

  // NEW: Detect device memory
  function detectDeviceMemory() {
    const nav = navigator as Navigator & { deviceMemory?: number }
    deviceMemory.value = nav.deviceMemory ?? null
  }

  return {
    // State
    screenWidth,
    screenHeight,
    devicePixelRatio,
    colorDepth,
    hardwareConcurrency,
    maxTouchPoints,
    screenOrientation,
    aspectRatio,
    windowOuterWidth,
    windowOuterHeight,
    windowInnerWidth,
    windowInnerHeight,
    isFullscreen,
    deviceOrientation,
    deviceMotion,
    tlsVersion,
    tlsCipher,
    pageVisibilityInitiallyVisible,
    pageVisibilityLastVisible,
    pageVisibilityLastHidden,
    performanceTiming,
    historyLength,
    pageReferrer,
    privateBrowsingMode,
    // NEW state
    colorScheme,
    reducedMotion,
    prefersContrast,
    reducedTransparency,
    prefersReducedData,
    screenColorGamut,
    screenPixelDepth,
    deviceMemory,
    // Computed
    screenInfo,
    windowInfo,
    tlsInfo,
    pageVisibilityInfo,
    // Actions
    detectAll,
    detectScreenInfo,
    detectWindowSize,
    detectScreenOrientation,
    detectDeviceOrientation,
    detectTls,
    detectPageVisibility,
    detectPerformanceTiming,
    detectHistory,
    detectReferrer,
    detectPrivateBrowsing,
    detectUserPreferences,
    detectExtendedScreenInfo,
    detectDeviceMemory,
    cleanup
  }
}
