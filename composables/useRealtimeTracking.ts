import { ref, computed } from 'vue'
import type { BatteryInfo, BluetoothInfo, InputInfo, GamepadInfo } from '@/types'

export function useRealtimeTracking() {
  const batteryLevel = ref<number | null>(null)
  const batteryCharging = ref<boolean | null>(null)
  const batteryChargingTime = ref<number | null>(null)
  const batteryDischargingTime = ref<number | null>(null)

  const bluetoothSupported = ref<boolean | null>(null)
  const bluetoothAvailable = ref<boolean | null>(null)

  const hasMouse = ref<boolean | null>(null)
  const hasTouchscreen = ref<boolean | null>(null)
  const lastKeyPressed = ref<string | null>(null)
  const capsLockState = ref<boolean | null>(null)
  const scrollPosition = ref<{ x: number; y: number } | null>(null)
  const mousePosition = ref<{ x: number; y: number } | null>(null)
  const lastClickPosition = ref<{ x: number; y: number } | null>(null)

  const gamepads = ref<GamepadInfo['gamepads']>([])
  const gamepadConnected = ref<boolean | null>(null)
  const gamepadCount = ref<number | null>(null)

  interface BatteryManager extends EventTarget {
    charging: boolean
    chargingTime: number
    dischargingTime: number
    level: number
    addEventListener(
      type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange',
      listener: () => void
    ): void
    removeEventListener(
      type: 'chargingchange' | 'chargingtimechange' | 'dischargingtimechange' | 'levelchange',
      listener: () => void
    ): void
  }

  let batteryRef: BatteryManager | null = null
  let batteryLevelHandler: (() => void) | null = null
  let batteryChargingHandler: (() => void) | null = null
  let batteryChargingTimeHandler: (() => void) | null = null
  let batteryDischargingTimeHandler: (() => void) | null = null
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null
  let mousemoveHandler: ((e: MouseEvent) => void) | null = null
  let clickHandler: ((e: MouseEvent) => void) | null = null
  let scrollHandler: (() => void) | null = null
  let mouseRaf = 0
  let pendingMouse: { x: number; y: number } | null = null

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

  const gamepadInfo = computed<GamepadInfo>(() => ({
    connected: gamepadConnected.value,
    count: gamepadCount.value,
    gamepads: gamepads.value
  }))

  function detectBattery() {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }
    if (!nav.getBattery) {
      return
    }
    nav
      .getBattery()
      .then(battery => {
        batteryRef = battery
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
      })
      .catch(() => {
        // Battery API not available
      })
  }

  function detectBluetooth() {
    bluetoothSupported.value = 'bluetooth' in navigator
    if ('bluetooth' in navigator) {
      bluetoothAvailable.value = true
    }
  }

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
      pendingMouse = { x: e.clientX, y: e.clientY }
      if (mouseRaf) {
        return
      }
      mouseRaf = requestAnimationFrame(() => {
        mouseRaf = 0
        if (pendingMouse) {
          mousePosition.value = pendingMouse
          pendingMouse = null
        }
      })
    }
    document.addEventListener('mousemove', mousemoveHandler, { passive: true })

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

    let scrollRaf = 0
    scrollHandler = () => {
      if (scrollRaf) {
        return
      }
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        scrollPosition.value = {
          x: window.scrollX || window.pageXOffset,
          y: window.scrollY || window.pageYOffset
        }
      })
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })
  }

  function detectGamepads() {
    gamepadConnected.value = 'getGamepads' in navigator

    if (gamepadConnected.value) {
      const pads = navigator.getGamepads()
      const connectedPads: NonNullable<GamepadInfo['gamepads']> = []

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

  function cleanup() {
    if (batteryRef) {
      if (batteryChargingHandler) {
        batteryRef.removeEventListener('chargingchange', batteryChargingHandler)
      }
      if (batteryLevelHandler) {
        batteryRef.removeEventListener('levelchange', batteryLevelHandler)
      }
      if (batteryChargingTimeHandler) {
        batteryRef.removeEventListener('chargingtimechange', batteryChargingTimeHandler)
      }
      if (batteryDischargingTimeHandler) {
        batteryRef.removeEventListener('dischargingtimechange', batteryDischargingTimeHandler)
      }
    }
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler)
    }
    if (mousemoveHandler) {
      document.removeEventListener('mousemove', mousemoveHandler)
    }
    if (clickHandler) {
      document.removeEventListener('click', clickHandler)
    }
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler)
    }
    if (mouseRaf) {
      cancelAnimationFrame(mouseRaf)
      mouseRaf = 0
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
    gamepads,
    gamepadConnected,
    gamepadCount,
    batteryInfo,
    bluetoothInfo,
    inputInfo,
    gamepadInfo,
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
