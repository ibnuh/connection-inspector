import { ref, computed } from 'vue'
import type {
  FingerprintingInfo,
  CanvasFingerprintingStatus,
  AudioContextFingerprintingStatus
} from '@/types'
import { detectInstalledFonts, FONT_CANDIDATES } from '@/utils/fonts'
import { scorePrivacyResistance } from '@/utils/privacy'

export function useFingerprinting() {
  const canvasFingerprinting = ref<CanvasFingerprintingStatus>(null)
  const audioContextFingerprinting = ref<AudioContextFingerprintingStatus>(null)
  const fontsDetected = ref<string[]>([])
  const adBlockerDetected = ref<boolean | null>(null)
  const doNotTrackHint = ref<string | null>(null)
  const cookiesHint = ref<boolean | null>(null)

  const fingerprintingResistance = computed(() => {
    return (
      canvasFingerprinting.value === 'Spoofed' || audioContextFingerprinting.value === 'Blocked'
    )
  })

  const fingerprintingInfo = computed<FingerprintingInfo>(() => ({
    canvas: canvasFingerprinting.value,
    audioContext: audioContextFingerprinting.value,
    resistance: fingerprintingResistance.value
  }))

  const privacyScore = computed<number | null>(() => {
    return scorePrivacyResistance({
      canvas: canvasFingerprinting.value,
      audio: audioContextFingerprinting.value,
      adBlocker: adBlockerDetected.value,
      fontCount: fontsDetected.value.length || null,
      dnt: doNotTrackHint.value,
      cookiesEnabled: cookiesHint.value
    }).score
  })

  const privacyProfile = computed(() => {
    return scorePrivacyResistance({
      canvas: canvasFingerprinting.value,
      audio: audioContextFingerprinting.value,
      adBlocker: adBlockerDetected.value,
      fontCount: fontsDetected.value.length || null,
      dnt: doNotTrackHint.value,
      cookiesEnabled: cookiesHint.value
    }).profile
  })

  /**
   * Canvas: "Supported" means readable fingerprint data is available.
   * "Spoofed" only when two identical draws diverge (noise injection / resistance).
   * Note: many privacy tools return stable noise, so absence of divergence does not
   * prove lack of protection.
   */
  function detectCanvasFingerprinting() {
    try {
      const draw = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 240
        canvas.height = 60
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return null
        }
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'
        ctx.fillRect(10, 10, 100, 30)
        ctx.fillStyle = '#069'
        ctx.fillText('Canvas fingerprint test 🦞', 2, 2)
        ctx.strokeStyle = 'rgba(100,200,50,0.7)'
        ctx.beginPath()
        ctx.arc(50, 25, 12, 0, Math.PI * 2)
        ctx.stroke()
        return canvas.toDataURL()
      }

      const a = draw()
      const b = draw()
      if (a == null || b == null) {
        canvasFingerprinting.value = 'Not Supported'
        return
      }
      canvasFingerprinting.value = a === b ? 'Supported' : 'Spoofed'
    } catch {
      canvasFingerprinting.value = 'Not Supported'
    }
  }

  function detectAudioContextFingerprinting() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

      if (!AudioContextClass) {
        audioContextFingerprinting.value = 'Not Supported'
        return
      }

      const context = new AudioContextClass()
      // Creating context is enough to know API is usable; avoid audible graph
      audioContextFingerprinting.value = 'Allowed'
      void context.close()
    } catch {
      audioContextFingerprinting.value = 'Blocked'
    }
  }

  function detectFonts() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      fontsDetected.value = []
      return
    }

    const measure = (fontCss: string) => {
      ctx.font = fontCss
      return ctx.measureText('mmmmmmmmmmlliwi@#$%').width
    }

    fontsDetected.value = detectInstalledFonts([...FONT_CANDIDATES], measure)
  }

  function detectAdBlocker() {
    // Heuristic only: bait element with ad-like class names
    const testDiv = document.createElement('div')
    testDiv.innerHTML = '&nbsp;'
    testDiv.className = 'adsbox ad-banner adsbygoogle'
    testDiv.setAttribute('id', 'ad-banner-test')
    testDiv.style.cssText =
      'position:absolute;left:-9999px;width:1px;height:1px;pointer-events:none;'
    document.body.appendChild(testDiv)

    // Double rAF so layout settles
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const style = window.getComputedStyle(testDiv)
        const isBlocked =
          testDiv.offsetHeight === 0 ||
          testDiv.offsetParent === null ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0'

        adBlockerDetected.value = isBlocked
        testDiv.remove()
      })
    })
  }

  function setPrivacyHints(hints: { doNotTrack?: string | null; cookiesEnabled?: boolean | null }) {
    if (hints.doNotTrack !== undefined) {
      doNotTrackHint.value = hints.doNotTrack
    }
    if (hints.cookiesEnabled !== undefined) {
      cookiesHint.value = hints.cookiesEnabled
    }
  }

  function detectAll(hints?: { doNotTrack?: string | null; cookiesEnabled?: boolean | null }) {
    if (hints) {
      setPrivacyHints(hints)
    }
    detectCanvasFingerprinting()
    detectAudioContextFingerprinting()
    detectFonts()
    detectAdBlocker()
  }

  return {
    canvasFingerprinting,
    audioContextFingerprinting,
    fontsDetected,
    adBlockerDetected,
    fingerprintingResistance,
    fingerprintingInfo,
    privacyScore,
    privacyProfile,
    detectAll,
    detectCanvasFingerprinting,
    detectAudioContextFingerprinting,
    detectFonts,
    detectAdBlocker,
    setPrivacyHints
  }
}
