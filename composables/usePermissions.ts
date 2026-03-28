import { ref, computed } from 'vue'
import type { PermissionsInfo, PermissionState, MediaInfo, MediaDevice } from '@/types'

export function usePermissions() {
  // State
  const permissionGeolocation = ref<PermissionState>(null)
  const permissionNotifications = ref<PermissionState>(null)
  const permissionCamera = ref<PermissionState>(null)
  const permissionMicrophone = ref<PermissionState>(null)
  const permissionClipboardRead = ref<PermissionState>(null)
  
  const permissionLastChecked = ref<Record<string, string>>({})
  
  // Media devices
  const speakers = ref<MediaDevice[]>([])
  const microphones = ref<MediaDevice[]>([])
  const cameras = ref<MediaDevice[]>([])
  const speakersCount = ref<number | null>(null)
  const microphonesCount = ref<number | null>(null)
  const camerasCount = ref<number | null>(null)
  
  // Computed
  const permissionsInfo = computed<PermissionsInfo>(() => ({
    geolocation: permissionGeolocation.value,
    notifications: permissionNotifications.value,
    camera: permissionCamera.value,
    microphone: permissionMicrophone.value,
    clipboardRead: permissionClipboardRead.value
  }))
  
  const mediaInfo = computed<MediaInfo>(() => ({
    speakers: speakers.value,
    microphones: microphones.value,
    cameras: cameras.value
  }))
  
  // Helper
  function markPermissionChecked(name: string, state: PermissionState) {
    if (!state) return
    permissionLastChecked.value = {
      ...permissionLastChecked.value,
      [name]: `${state} @ ${new Date().toLocaleTimeString()}`
    }
  }
  
  // Detection
  function detectInitialPermissions() {
    type PermissionQueryName = 'geolocation' | 'notifications' | 'camera' | 'microphone' | 'clipboard-read'
    
    const navWithPermissions = navigator as Navigator & {
      permissions?: {
        query: (permissionDesc: { name: PermissionQueryName }) => Promise<PermissionStatus>
      }
    }
    
    const perms = navWithPermissions.permissions
    if (perms) {
      const safeQuery = async (name: PermissionQueryName, target: typeof permissionGeolocation) => {
        try {
          const status = await perms.query({ name })
          target.value = status.state as PermissionState
        } catch {
          target.value = 'unavailable'
        }
      }
      
      void safeQuery('geolocation', permissionGeolocation)
      void safeQuery('notifications', permissionNotifications)
      void safeQuery('camera', permissionCamera)
      void safeQuery('microphone', permissionMicrophone)
      void safeQuery('clipboard-read', permissionClipboardRead)
    } else {
      permissionGeolocation.value = 'unavailable'
      permissionNotifications.value = 'unavailable'
      permissionCamera.value = 'unavailable'
      permissionMicrophone.value = 'unavailable'
      permissionClipboardRead.value = 'unavailable'
    }
  }
  
  // Request functions
  async function requestGeolocationPermission() {
    if (!navigator.geolocation) return
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (err) => reject(err),
          { maximumAge: 0, timeout: 10000 }
        )
      })
      permissionGeolocation.value = 'granted'
    } catch {
      permissionGeolocation.value = 'denied'
    } finally {
      markPermissionChecked('geolocation', permissionGeolocation.value)
    }
  }
  
  async function requestNotificationPermission() {
    if (!('Notification' in window)) return
    try {
      const result = await Notification.requestPermission()
      permissionNotifications.value = result as PermissionState
    } catch {
      permissionNotifications.value = 'denied'
    } finally {
      markPermissionChecked('notifications', permissionNotifications.value)
    }
  }
  
  async function requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
      permissionCamera.value = 'granted'
    } catch {
      permissionCamera.value = 'denied'
    } finally {
      markPermissionChecked('camera', permissionCamera.value)
    }
  }
  
  async function requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      permissionMicrophone.value = 'granted'
    } catch {
      permissionMicrophone.value = 'denied'
    } finally {
      markPermissionChecked('microphone', permissionMicrophone.value)
    }
  }
  
  async function requestClipboardReadPermission() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        await navigator.clipboard.readText()
        permissionClipboardRead.value = 'granted'
      } else {
        permissionClipboardRead.value = 'unavailable'
      }
    } catch {
      permissionClipboardRead.value = 'denied'
    } finally {
      markPermissionChecked('clipboard-read', permissionClipboardRead.value)
    }
  }
  
  // Media devices
  async function detectMediaDevices() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        
        speakers.value = devices.filter(d => d.kind === 'audiooutput').map(d => ({ 
          label: d.label || 'Unknown', 
          deviceId: d.deviceId 
        }))
        microphones.value = devices.filter(d => d.kind === 'audioinput').map(d => ({ 
          label: d.label || 'Unknown', 
          deviceId: d.deviceId 
        }))
        cameras.value = devices.filter(d => d.kind === 'videoinput').map(d => ({ 
          label: d.label || 'Unknown', 
          deviceId: d.deviceId 
        }))
        
        speakersCount.value = speakers.value.length
        microphonesCount.value = microphones.value.length
        camerasCount.value = cameras.value.length
      }
    } catch {
      // Permission denied or not available
    }
  }
  
  function detectAll() {
    detectInitialPermissions()
    detectMediaDevices()
  }
  
  return {
    // State
    permissionGeolocation,
    permissionNotifications,
    permissionCamera,
    permissionMicrophone,
    permissionClipboardRead,
    permissionLastChecked,
    speakers,
    microphones,
    cameras,
    speakersCount,
    microphonesCount,
    camerasCount,
    // Computed
    permissionsInfo,
    mediaInfo,
    // Actions
    detectAll,
    detectInitialPermissions,
    detectMediaDevices,
    requestGeolocationPermission,
    requestNotificationPermission,
    requestCameraPermission,
    requestMicrophonePermission,
    requestClipboardReadPermission,
    markPermissionChecked
  }
}
