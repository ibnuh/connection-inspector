import { ref, computed } from 'vue'
import type { 
  FingerprintingInfo, 
  CanvasFingerprintingStatus, 
  AudioContextFingerprintingStatus 
} from '@/types'

export function useFingerprinting() {
  // State
  const canvasFingerprinting = ref<CanvasFingerprintingStatus>(null)
  const audioContextFingerprinting = ref<AudioContextFingerprintingStatus>(null)
  const fontsDetected = ref<string[]>([])
  const adBlockerDetected = ref<boolean | null>(null)
  
  // Computed
  const fingerprintingResistance = computed(() => {
    return canvasFingerprinting.value === 'Spoofed' || audioContextFingerprinting.value === 'Blocked'
  })
  
  const fingerprintingInfo = computed<FingerprintingInfo>(() => ({
    canvas: canvasFingerprinting.value,
    audioContext: audioContextFingerprinting.value,
    resistance: fingerprintingResistance.value
  }))
  
  const privacyScore = computed<number | null>(() => {
    // Rough heuristic - higher score means more private
    let score = 0
    
    if (canvasFingerprinting.value === 'Spoofed') score += 25
    else if (canvasFingerprinting.value === 'Supported') score += 10
    
    if (audioContextFingerprinting.value === 'Blocked') score += 25
    else if (audioContextFingerprinting.value === 'Allowed') score += 10
    
    if (adBlockerDetected.value === true) score += 20
    
    if (fontsDetected.value.length > 0 && fontsDetected.value.length < 10) score += 10
    else if (fontsDetected.value.length > 20) score -= 5
    
    return Math.max(0, Math.min(100, score))
  })
  
  const privacyProfile = computed<'Low' | 'Medium' | 'High' | 'Unknown'>(() => {
    const s = privacyScore.value
    if (s == null) return 'Unknown'
    if (s < 30) return 'Low'
    if (s < 70) return 'Medium'
    return 'High'
  })
  
  // Detection functions
  function detectCanvasFingerprinting() {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        canvasFingerprinting.value = 'Not Supported'
        return
      }
      
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Canvas fingerprint test', 2, 2)
      const dataURL = canvas.toDataURL()
      
      const test2 = document.createElement('canvas')
      const ctx2 = test2.getContext('2d')
      if (ctx2) {
        ctx2.textBaseline = 'top'
        ctx2.font = '14px Arial'
        ctx2.fillText('Canvas fingerprint test', 2, 2)
        const dataURL2 = test2.toDataURL()
        
        if (dataURL === dataURL2) {
          canvasFingerprinting.value = 'Supported'
        } else {
          canvasFingerprinting.value = 'Spoofed'
        }
      }
    } catch {
      canvasFingerprinting.value = 'Not Supported'
    }
  }
  
  function detectAudioContextFingerprinting() {
    try {
      if (typeof AudioContext !== 'undefined' || typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== 'undefined') {
        const AudioContextClass = AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          const context = new AudioContextClass()
          const oscillator = context.createOscillator()
          const analyser = context.createAnalyser()
          const gainNode = context.createGain()
          context.createScriptProcessor(4096, 1, 1)
          
          oscillator.connect(analyser)
          analyser.connect(gainNode)
          gainNode.connect(context.destination)
          oscillator.start(0)
          
          audioContextFingerprinting.value = 'Allowed'
          oscillator.stop()
          context.close()
        }
      } else {
        audioContextFingerprinting.value = 'Not Supported'
      }
    } catch {
      audioContextFingerprinting.value = 'Blocked'
    }
  }
  
  function detectFonts() {
    // Extended list of fonts for better fingerprinting detection
    const commonFonts = [
      // Standard fonts
      'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 
      'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 
      'Arial Black', 'Impact', 'Helvetica', 'Tahoma', 'Geneva',
      // Web-safe fonts
      'Courier', 'Monaco', 'Menlo', 'Consolas', 'Roboto', 'Open Sans',
      'Lato', 'Montserrat', 'Oswald', 'Raleway', 'PT Sans',
      // System fonts
      'Segoe UI', 'San Francisco', '-apple-system', 'BlinkMacSystemFont',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      // Microsoft Office fonts
      'Calibri', 'Cambria', 'Candara', 'Constantia', 'Corbel',
      'Franklin Gothic Medium', 'Century Gothic', 'Copperplate',
      // Serif fonts
      'Baskerville', 'Times', 'Didot', 'Bodoni', 'Goudy Old Style',
      'Century Schoolbook', 'Rockwell', 'Perpetua', 'Bell MT',
      // Decorative fonts (often present)
      'Papyrus', 'Brush Script MT', 'Chalkboard', 'Marker Felt',
      // Emoji-related
      'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'
    ]
    
    fontsDetected.value = commonFonts.filter(font => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return false
      
      const testString = 'abcdefghijklmnopqrstuvwxyz0123456789@#$%^&*'
      const baseline = ctx.measureText(testString).width
      ctx.font = `16px "${font}", monospace`
      const width = ctx.measureText(testString).width
      return width !== baseline
    })
  }
  
  function detectAdBlocker() {
    const testDiv = document.createElement('div')
    testDiv.innerHTML = '&nbsp;'
    testDiv.className = 'adsbox'
    testDiv.style.position = 'absolute'
    testDiv.style.left = '-9999px'
    document.body.appendChild(testDiv)
    
    setTimeout(() => {
      const isBlocked = testDiv.offsetHeight === 0 || testDiv.style.display === 'none' || testDiv.style.visibility === 'hidden'
      adBlockerDetected.value = isBlocked
      document.body.removeChild(testDiv)
    }, 100)
  }
  
  function detectAll() {
    detectCanvasFingerprinting()
    detectAudioContextFingerprinting()
    detectFonts()
    detectAdBlocker()
  }
  
  return {
    // State
    canvasFingerprinting,
    audioContextFingerprinting,
    fontsDetected,
    adBlockerDetected,
    // Computed
    fingerprintingResistance,
    fingerprintingInfo,
    privacyScore,
    privacyProfile,
    // Actions
    detectAll,
    detectCanvasFingerprinting,
    detectAudioContextFingerprinting,
    detectFonts,
    detectAdBlocker
  }
}
