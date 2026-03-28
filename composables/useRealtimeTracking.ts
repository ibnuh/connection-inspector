import { ref, computed } from 'vue'
import type { BatteryInfo, BluetoothInfo, InputInfo, GamepadInfo } from '@/types'

export function useRealtimeTracking() {
  // Battery API
  const batteryLevel = ref<number | null>(null)
  const batteryCharging = ref<boolean | null>(null)
  const batteryChargingTime = ref<number | null>(null)
  const batteryDischargingTime = ref<number | null>(null)
  
  // Bluetooth
  const bluetoothSupported = ref<boolean | null>(null)
  const bluetoothAvailable = ref<boolean | null>(null)
  
  // Input
  const hasMouse = ref<boolean | null>(null)
  const hasTouchscreen = ref<boolean | null>(null)
  const lastKeyPressed = ref<string | null>(null)
  const capsLockState = ref<boolean | null>(null)
  const scrollPosition = ref<{ x: number; y: number } | null>(null)
  const mousePosition = ref<{ x: number; y: number } | null>(null)
  const lastClickPosition = ref<{ x: number; y: number } | null>(null)
  
  // NEW: Gamepad
  const gamepads = ref<GamepadInfo['gamepads']>([])
  const gamepadConnected = ref<boolean | null>(null)
  const gamepadCount = ref<number | null>(null)
  
  // Event handlers for cleanup
  let batteryLevelHandler: (() => void) | null = null
  let batteryChargingHandler: (() => void) | null = null
  let batteryChargingTimeHandler: (() => void) | null = null
  let batteryDischargingTimeHandler: (() => void) | null = null
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null
  let mousemoveHandler: ((e: MouseEvent) => void) | null = null
  let clickHandler: ((e: MouseEvent) => void) | null = null
  
  // Computed
  const batteryInfo = computed<BatteryInfo>(() => ({
    level: batteryLevel.value,
    charging: batteryCharging.value,
    chargingTime: batteryChargingTime.value,
    dischargingTime: batteryDischargingTime.value
  }))
  
  const bluetoothInfo = computed<BluetoothInfo>(() => ({
    supported: bluetoothSupported.value,
    available: bluetoothAvailable.value
  }))
  
  const inputInfo = computed<InputInfo>(() => ({
    hasMouse: hasMouse.value,
    hasTouchscreen: hasTouchscreen.value,
    lastKeyPressed: lastKeyPressed.value,
    capsLockState: capsLockState.value,
    scrollPosition: scrollPosition.value,
    mousePosition: mousePosition.value,
    lastClickPosition: lastClickPosition.value
  }))
  
  // NEW: Gamepad computed
  const gamepadInfo = computed<GamepadInfo>(() => ({
    connected: gamepadConnected.value,
    count: gamepadCount.value,
    gamepads: gamepads.value
  }))
  
  // Battery detection
  function detectBattery() {
    interface BatteryManager extends EventTarget {
      charging: boolean
      chargingTime: number
      dischargingTime: number
      level: number
      addEventListener(type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange', listener: () => void): void
      removeEventListener(type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange', listener: () => void): void
    }
    
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }
    if (nav.getBattery) {
      nav.getBattery().then((battery) => {
        batteryLevel.value = Math.round(battery.level * 100)
        batteryCharging.value = battery.charging
        batteryChargingTime.value = battery.chargingTime
        batteryDischargingTime.value = battery.dischargingTime
        
        batteryLevelHandler = () => {
          batteryLevel.value = Math.round(battery.level * 100)
        }
        batteryChargingHandler = () => {
          batteryCharging.value = battery.charging
        }
        batteryChargingTimeHandler = () => {
          batteryChargingTime.value = battery.chargingTime
        }
        batteryDischargingTimeHandler = () => {
          batteryDischargingTime.value = battery.dischargingTime
        }
        
        battery.addEventListener('chargingchange', batteryChargingHandler)
        battery.addEventListener('levelchange', batteryLevelHandler)
        battery.addEventListener('chargingtimechange', batteryChargingTimeHandler)
        battery.addEventListener('dischargingtimechange', batteryDischargingTimeHandler)
      }).catch(() => {
        // Battery API not available
      })
    }
  }
  
  // Bluetooth detection
  function detectBluetooth() {
    bluetoothSupported.value = 'bluetooth' in navigator
    if ('bluetooth' in navigator) {
      bluetoothAvailable.value = true
    }
  }
  
  // Input detection
  function detectInputMethods() {
    hasMouse.value = window.matchMedia('(pointer: fine)').matches || 'onmousedown' in window
    hasTouchscreen.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
  
  function detectKeyboard() {
    keydownHandler = (e: KeyboardEvent) => {
      lastKeyPressed.value = e.key
      
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        capsLockState.value = true
      } else {
        capsLockState.value = false
      }
    }
    document.addEventListener('keydown', keydownHandler)
    
    if (document.hasFocus()) {
      capsLockState.value = false
    }
  }
  
  function detectMousePosition() {
    mousemoveHandler = (e: MouseEvent) => {
      mousePosition.value = {
        x: e.clientX,
        y: e.clientY
      }
    }
    document.addEventListener('mousemove', mousemoveHandler)
    
    clickHandler = (e: MouseEvent) => {
      lastClickPosition.value = {
        x: e.pageX,
        y: e.pageY
      }
    }
    document.addEventListener('click', clickHandler)
  }
  
  function detectScrollPosition() {
    scrollPosition.value = {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset
    }
    
    window.addEventListener('scroll', () => {
      scrollPosition.value = {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset
      }
    })
  }
  
  function cleanup() {
    // Battery listeners would need the battery object to remove - storing for now
    if (keydownHandler) document.removeEventListener('keydown', keydownHandler)
    if (mousemoveHandler) document.removeEventListener('mousemove', mousemoveHandler)
    if (clickHandler) document.removeEventListener('click', clickHandler)
  }
  
  // NEW: Detect gamepads
  function detectGamepads() {
    gamepadConnected.value = 'getGamepads' in navigator
    
    if (gamepadConnected.value) {
      const pads = navigator.getGamepads()
      const connectedPads: GamepadInfo['gamepads'] = []
      
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i]
        if (pad && pad.connected) {
          connectedPads.push({
            id: pad.id,
            index: pad.index,
            connected: pad.connected,
            mapping: pad.mapping,
            buttons: pad.buttons.length,
            axes: pad.axes.length
          })
        }
      }
      
      gamepads.value = connectedPads
      gamepadCount.value = connectedPads.length
      gamepadConnected.value = connectedPads.length > 0
    }
  }
  
  function detectAll() {
    detectBattery()
    detectBluetooth()
    detectInputMethods()
    detectKeyboard()
    detectMousePosition()
    detectScrollPosition()
    detectGamepads()
  }
  
  return {
    // State
    batteryLevel,
    batteryCharging,
    batteryChargingTime,
    batteryDischargingTime,
    bluetoothSupported,
    bluetoothAvailable,
    hasMouse,
    hasTouchscreen,
    lastKeyPressed,
    capsLockState,
    scrollPosition,
    mousePosition,
    lastClickPosition,
    // NEW state
    gamepads,
    gamepadConnected,
    gamepadCount,
    // Computed
    batteryInfo,
    bluetoothInfo,
    inputInfo,
    gamepadInfo,
    // Actions
    detectAll,
    detectBattery,
    detectBluetooth,
    detectInputMethods,
    detectKeyboard,
    detectMousePosition,
    detectScrollPosition,
    detectGamepads,
    cleanup
  }
}
