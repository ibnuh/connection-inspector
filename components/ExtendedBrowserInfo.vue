<script setup lang="ts">
const props = defineProps<{
  browserName: string | null
  browserVersion: string | null
  browserEngine: string | null
  trueBrowserCore: string | null
  deviceType: string | null
  deviceModel: string | null
  osName: string | null
  osVersion: string | null
  trueOsCore: string | null
  systemDateTime: string | null
  localDateTime: string | null
  isDst: boolean | null
  timezone: string | null
  canvasFingerprinting: 'Supported' | 'Spoofed' | 'Not Supported' | null
  audioContextFingerprinting: 'Allowed' | 'Blocked' | 'Not Supported' | null
  fingerprintingResistance: boolean | null | undefined
  httpHeaders: Record<string, string>
  windowOuterWidth: number | null
  windowOuterHeight: number | null
  windowInnerWidth: number | null
  windowInnerHeight: number | null
  isFullscreen: boolean | null
  screenOrientation: string | null
  aspectRatio: string | null
  batteryLevel: number | null
  batteryCharging: boolean | null
  batteryChargingTime: number | null
  batteryDischargingTime: number | null
  bluetoothSupported: boolean | null
  bluetoothAvailable: boolean | null
  deviceOrientation: { alpha: number | null; beta: number | null; gamma: number | null } | null
  deviceMotion: { acceleration: { x: number | null; y: number | null; z: number | null }; accelerationIncludingGravity: { x: number | null; y: number | null; z: number | null }; rotationRate: { alpha: number | null; beta: number | null; gamma: number | null } } | null
  speakers: { label: string; deviceId: string }[]
  microphones: { label: string; deviceId: string }[]
  cameras: { label: string; deviceId: string }[]
  speakersCount: number | null
  microphonesCount: number | null
  camerasCount: number | null
  plugins: { name: string; description: string; filename: string }[]
  mimeTypes: { type: string; description: string; suffixes: string }[]
  adBlockerDetected: boolean | null
  tlsVersion: string | null
  tlsCipher: string | null
  webglVersion: string | null
  webgl2Version: string | null
  speechSynthesisSupported: boolean | null
  speechVoices: { name: string; lang: string; default: boolean }[]
  fontsDetected: string[]
  pageVisibilityInitiallyVisible: boolean | null
  pageVisibilityLastVisible: Date | null
  pageVisibilityLastHidden: Date | null
  performanceTiming: {
    pageLoadTime: number | null
    networkTime: number | null
    dnsLookupTime: number | null
    tcpConnectionTime: number | null
    serverResponseTime: number | null
    pageDownloadTime: number | null
    browserTime: number | null
  } | null
  websocketSupported: boolean | null
  sessionStorageEnabled: boolean | null
  historyLength: number | null
  pageReferrer: string | null
  privateBrowsingMode: boolean | null
  hasMouse: boolean | null
  hasTouchscreen: boolean | null
  lastKeyPressed: string | null
  capsLockState: boolean | null
  scrollPosition: { x: number; y: number } | null
  mousePosition: { x: number; y: number } | null
  lastClickPosition: { x: number; y: number } | null
}>()

function formatBatteryTime(seconds: number | null): string {
  if (seconds === null || seconds === Infinity) return '?'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Device Type / Model -->
    <section id="device-type" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Device Type / Model</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Device Type</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.deviceType || 'Unknown' }}</dd>
        </div>
        <div v-if="props.deviceModel">
          <dt class="text-[0.7rem] text-slate-400">Device Model</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.deviceModel }}</dd>
        </div>
      </dl>
    </section>

    <!-- Operating System -->
    <section id="operating-system" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Operating System</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">OS</dt>
          <dd class="mt-0.5 font-medium text-slate-200">
            {{ props.osName || 'Unknown' }}<span v-if="props.osVersion"> version {{ props.osVersion }}</span>
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">True OS Core</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.trueOsCore || 'Unknown' }}</dd>
        </div>
      </dl>
    </section>

    <!-- Browser -->
    <section id="browser" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Browser</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Browser</dt>
          <dd class="mt-0.5 font-medium text-slate-200">
            {{ props.browserName || 'Unknown' }}<span v-if="props.browserVersion"> version {{ props.browserVersion }}</span><span v-if="props.browserEngine"> (Engine: {{ props.browserEngine }})</span>
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">True Browser Core</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.trueBrowserCore || 'Unknown' }}</dd>
        </div>
      </dl>
    </section>

    <!-- Date & Time -->
    <section id="date-time" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Date & Time</h3>
      <dl class="grid gap-2 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">System (Live)</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.systemDateTime || 'Unknown' }}</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Local (Live)</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.localDateTime || 'Unknown' }}</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">System Time Zone</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.timezone || 'Unknown' }}<span v-if="props.isDst !== null"> (DST: {{ props.isDst ? 'Yes' : 'No' }})</span></dd>
        </div>
      </dl>
    </section>

    <!-- Fingerprinting Resistance -->
    <section id="fingerprinting-resistance" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Fingerprinting Resistance</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Canvas</dt>
          <dd class="mt-0.5 font-medium" :class="props.canvasFingerprinting === 'Supported' ? 'text-emerald-300' : props.canvasFingerprinting === 'Spoofed' ? 'text-yellow-300' : 'text-slate-400'">
            {{ props.canvasFingerprinting || 'Unknown' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">AudioContext</dt>
          <dd class="mt-0.5 font-medium" :class="props.audioContextFingerprinting === 'Allowed' ? 'text-emerald-300' : props.audioContextFingerprinting === 'Blocked' ? 'text-yellow-300' : 'text-slate-400'">
            {{ props.audioContextFingerprinting || 'Unknown' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- HTTP Request Headers -->
    <section id="http-headers" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">HTTP Request Headers</h3>
      <dl class="space-y-1 text-xs">
        <div v-for="(value, key) in props.httpHeaders" :key="key" class="flex gap-2">
          <dt class="min-w-[8rem] font-medium text-slate-400">{{ key }}</dt>
          <dd class="break-all text-slate-200">{{ value }}</dd>
        </div>
      </dl>
    </section>

    <!-- Browser Window Size -->
    <section id="browser-window" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Browser Window Size</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Outer</dt>
          <dd class="mt-0.5 font-medium text-slate-200">
            <span v-if="props.windowOuterWidth && props.windowOuterHeight">
              {{ props.windowOuterWidth }} × {{ props.windowOuterHeight }} (pixels)
            </span>
            <span v-else>Unknown</span>
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Inner</dt>
          <dd class="mt-0.5 font-medium text-slate-200">
            <span v-if="props.windowInnerWidth && props.windowInnerHeight">
              {{ props.windowInnerWidth }} × {{ props.windowInnerHeight }} (pixels)
            </span>
            <span v-else>Unknown</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Screen Orientation -->
    <section id="screen" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Screen</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Orientation (Live)</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.screenOrientation || 'Unknown' }}</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Aspect Ratio</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.aspectRatio || 'Unknown' }}</dd>
        </div>
      </dl>
    </section>

    <!-- Battery Status -->
    <section id="battery-status" v-if="props.batteryLevel !== null" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Battery Status (Live)</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Level</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.batteryLevel }}%</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Charging</dt>
          <dd class="mt-0.5 font-medium" :class="props.batteryCharging ? 'text-emerald-300' : 'text-slate-300'">
            {{ props.batteryCharging ? 'Yes' : 'No' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Time remaining</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ formatBatteryTime(props.batteryDischargingTime) }}</dd>
        </div>
      </dl>
    </section>

    <!-- Bluetooth -->
    <section id="bluetooth" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Bluetooth</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Supported</dt>
          <dd class="mt-0.5 font-medium" :class="props.bluetoothSupported ? 'text-emerald-300' : 'text-slate-400'">
            {{ props.bluetoothSupported ? 'Yes' : 'No' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Adapter</dt>
          <dd class="mt-0.5 font-medium" :class="props.bluetoothAvailable ? 'text-emerald-300' : 'text-slate-400'">
            {{ props.bluetoothAvailable ? 'Yes' : 'No' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Device Orientation -->
    <section id="device-orientation" v-if="props.deviceOrientation" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Device Orientation (Live)</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Direction</dt>
          <dd class="mt-0.5 font-medium text-slate-200">
            Alpha: {{ props.deviceOrientation.alpha !== null ? props.deviceOrientation.alpha.toFixed(2) : 'Unknown' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Tilt Front / Back</dt>
          <dd class="mt-0.5 font-medium text-slate-200">
            Beta: {{ props.deviceOrientation.beta !== null ? props.deviceOrientation.beta.toFixed(2) : 'Unknown' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Tilt Left / Right</dt>
          <dd class="mt-0.5 font-medium text-slate-200">
            Gamma: {{ props.deviceOrientation.gamma !== null ? props.deviceOrientation.gamma.toFixed(2) : 'Unknown' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Device Pointing Method -->
    <section id="device-pointing" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Device Pointing Method</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Mouse</dt>
          <dd class="mt-0.5 font-medium" :class="props.hasMouse ? 'text-emerald-300' : 'text-slate-400'">
            {{ props.hasMouse ? 'Yes' : 'No' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Touchscreen</dt>
          <dd class="mt-0.5 font-medium" :class="props.hasTouchscreen ? 'text-emerald-300' : 'text-slate-400'">
            {{ props.hasTouchscreen ? 'Yes' : 'No' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Speakers -->
    <section id="speakers" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Speakers</h3>
      <dl class="grid gap-2 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Number of Speakers</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.speakersCount ?? 'Unknown' }}</dd>
        </div>
        <div v-if="props.speakers.length > 0">
          <dt class="text-[0.7rem] text-slate-400">Speaker Labels</dt>
          <dd class="mt-1 space-y-1">
            <div v-for="(speaker, idx) in props.speakers" :key="speaker.deviceId" class="text-slate-200">
              Speaker {{ idx + 1 }}: {{ speaker.label }}
            </div>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Microphones -->
    <section id="microphones" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Microphones</h3>
      <dl class="grid gap-2 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Number of microphones</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.microphonesCount ?? 'Unknown' }}</dd>
        </div>
        <div v-if="props.microphones.length > 0">
          <dt class="text-[0.7rem] text-slate-400">Microphone Labels</dt>
          <dd class="mt-1 space-y-1">
            <div v-for="(mic, idx) in props.microphones" :key="mic.deviceId" class="text-slate-200">
              Microphone {{ idx + 1 }}: {{ mic.label }}
            </div>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Cameras -->
    <section id="cameras" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Cameras</h3>
      <dl class="grid gap-2 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Number of cameras</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.camerasCount ?? 'Unknown' }}</dd>
        </div>
        <div v-if="props.cameras.length > 0">
          <dt class="text-[0.7rem] text-slate-400">Camera Labels</dt>
          <dd class="mt-1 space-y-1">
            <div v-for="(camera, idx) in props.cameras" :key="camera.deviceId" class="text-slate-200">
              Camera {{ idx + 1 }}: {{ camera.label }}
            </div>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Browser Plugins -->
    <section id="browser-plugins" v-if="props.plugins.length > 0" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Browser Plugins</h3>
      <dl class="space-y-2 text-xs">
        <div v-for="(plugin, idx) in props.plugins" :key="idx" class="rounded bg-slate-950/60 p-2">
          <dt class="font-medium text-slate-300">Name {{ plugin.name }}</dt>
          <dd class="mt-1 text-slate-400">Description: {{ plugin.description }}</dd>
          <dd class="text-slate-400">Filename: {{ plugin.filename }}</dd>
        </div>
      </dl>
    </section>

    <!-- Browser MIME Types -->
    <section id="mime-types" v-if="props.mimeTypes.length > 0" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Browser MIME Types</h3>
      <dl class="space-y-1 text-xs">
        <div v-for="(mime, idx) in props.mimeTypes" :key="idx" class="flex gap-2">
          <dt class="font-medium text-slate-300">{{ mime.type }}</dt>
          <dd class="text-slate-400">{{ mime.description }} ({{ mime.suffixes }})</dd>
        </div>
      </dl>
    </section>

    <!-- Content Filtering -->
    <section id="content-filtering" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Content Filtering</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Ad Blocker</dt>
          <dd class="mt-0.5 font-medium" :class="props.adBlockerDetected ? 'text-yellow-300' : 'text-slate-400'">
            {{ props.adBlockerDetected ? 'Detected' : 'Not detected' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- TLS / SSL -->
    <section id="tls-ssl" v-if="props.tlsVersion" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">TLS / SSL</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Protocol</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.tlsVersion }}</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Cipher</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.tlsCipher || 'Unknown' }}</dd>
        </div>
      </dl>
    </section>

    <!-- WebGL -->
    <section id="webgl" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">WebGL</h3>
      <dl class="grid gap-2 text-xs">
        <div v-if="props.webglVersion">
          <dt class="text-[0.7rem] text-slate-400">{{ props.webglVersion }}</dt>
          <dd class="mt-0.5 font-medium text-emerald-300">Enabled</dd>
        </div>
        <div v-if="props.webgl2Version">
          <dt class="text-[0.7rem] text-slate-400">{{ props.webgl2Version }}</dt>
          <dd class="mt-0.5 font-medium text-emerald-300">Enabled</dd>
        </div>
      </dl>
    </section>

    <!-- Speech Synthesis -->
    <section id="speech-synthesis" v-if="props.speechSynthesisSupported" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">SpeechSynthesis</h3>
      <dl class="grid gap-2 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Supported</dt>
          <dd class="mt-0.5 font-medium text-emerald-300">Yes</dd>
        </div>
        <div v-if="props.speechVoices.length > 0">
          <dt class="text-[0.7rem] text-slate-400">Speech Voices</dt>
          <dd class="mt-1 max-h-32 space-y-1 overflow-y-auto text-slate-200">
            <div v-for="(voice, idx) in props.speechVoices.slice(0, 10)" :key="idx">
              {{ voice.name }} ({{ voice.lang }})<span v-if="voice.default"> - Default</span>
            </div>
            <div v-if="props.speechVoices.length > 10" class="text-slate-400">
              ... and {{ props.speechVoices.length - 10 }} more
            </div>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Fonts -->
    <section id="fonts" v-if="props.fontsDetected.length > 0" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Fonts</h3>
      <p class="text-xs text-slate-300">{{ props.fontsDetected.join(', ') }}</p>
    </section>

    <!-- Page Visibility -->
    <section id="page-visibility" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Page Visibility Changes (Live)</h3>
      <dl class="grid gap-2 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Initially Visible</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.pageVisibilityInitiallyVisible ? 'Yes' : 'No' }}</dd>
        </div>
        <div v-if="props.pageVisibilityLastVisible">
          <dt class="text-[0.7rem] text-slate-400">Last Visible</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.pageVisibilityLastVisible.toLocaleString() }}</dd>
        </div>
        <div v-if="props.pageVisibilityLastHidden">
          <dt class="text-[0.7rem] text-slate-400">Last Hidden</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.pageVisibilityLastHidden.toLocaleString() }}</dd>
        </div>
      </dl>
    </section>

    <!-- Performance -->
    <section id="performance" v-if="props.performanceTiming" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Performance</h3>
      <dl class="space-y-1 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Page Load Time</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.performanceTiming.pageLoadTime }} sec</dd>
        </div>
        <div class="ml-4">
          <dt class="text-[0.7rem] text-slate-400">Network Time</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.performanceTiming.networkTime }} sec</dd>
        </div>
        <div class="ml-8">
          <dt class="text-[0.7rem] text-slate-400">DNS Lookup Time</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.performanceTiming.dnsLookupTime }} sec</dd>
        </div>
        <div class="ml-8">
          <dt class="text-[0.7rem] text-slate-400">TCP Connection Time</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.performanceTiming.tcpConnectionTime }} sec</dd>
        </div>
        <div class="ml-4">
          <dt class="text-[0.7rem] text-slate-400">Server Response Time</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.performanceTiming.serverResponseTime }} sec</dd>
        </div>
        <div class="ml-4">
          <dt class="text-[0.7rem] text-slate-400">Page Download Time</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.performanceTiming.pageDownloadTime }} sec</dd>
        </div>
        <div class="ml-4">
          <dt class="text-[0.7rem] text-slate-400">Browser Time</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.performanceTiming.browserTime }} sec</dd>
        </div>
      </dl>
    </section>

    <!-- WebSocket -->
    <section id="websocket" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">WebSocket</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Supported</dt>
          <dd class="mt-0.5 font-medium" :class="props.websocketSupported ? 'text-emerald-300' : 'text-slate-400'">
            {{ props.websocketSupported ? 'Yes' : 'No' }}
          </dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Connections</dt>
          <dd class="mt-0.5 font-medium text-slate-200">Allowed</dd>
        </div>
      </dl>
    </section>

    <!-- Storage -->
    <section id="storage" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Storage</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt class="text-[0.7rem] text-slate-400">IndexedDB</dt>
          <dd class="mt-0.5 font-medium text-emerald-300">Allowed</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Local Storage</dt>
          <dd class="mt-0.5 font-medium text-emerald-300">Allowed</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Session Storage</dt>
          <dd class="mt-0.5 font-medium" :class="props.sessionStorageEnabled ? 'text-emerald-300' : 'text-slate-400'">
            {{ props.sessionStorageEnabled ? 'Allowed' : 'Not allowed' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- History -->
    <section id="history" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">History</h3>
      <dl class="grid gap-2 text-xs">
        <div>
          <dt class="text-[0.7rem] text-slate-400">History Entries Count</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.historyLength ?? 'Unknown' }}</dd>
        </div>
      </dl>
    </section>

    <!-- Page Referrer -->
    <section id="page-referrer" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Page Referrer</h3>
      <p class="text-xs text-slate-200">{{ props.pageReferrer || 'None' }}</p>
    </section>

    <!-- Private Browsing -->
    <section id="private-browsing" v-if="props.privateBrowsingMode !== null" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Private Browsing Mode</h3>
      <p class="text-xs font-medium" :class="props.privateBrowsingMode ? 'text-yellow-300' : 'text-slate-200'">
        {{ props.privateBrowsingMode ? 'Yes' : 'No' }}
      </p>
    </section>

    <!-- Keys Pressed -->
    <section id="keys-pressed" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Keys Pressed (Live)</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt class="text-[0.7rem] text-slate-400">Last Key Pressed</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.lastKeyPressed || 'None' }}</dd>
        </div>
        <div>
          <dt class="text-[0.7rem] text-slate-400">Caps Lock State</dt>
          <dd class="mt-0.5 font-medium text-slate-200">{{ props.capsLockState ? 'On' : 'Off' }}</dd>
        </div>
      </dl>
    </section>

    <!-- Mouse Position -->
    <section id="mouse-position" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Mouse Position (Live)</h3>
      <dl class="grid gap-2 text-xs sm:grid-cols-2">
        <div v-if="props.mousePosition">
          <dt class="text-[0.7rem] text-slate-400">Current Position In View</dt>
          <dd class="mt-0.5 font-medium text-slate-200">X: {{ props.mousePosition.x }}, Y: {{ props.mousePosition.y }}</dd>
        </div>
        <div v-if="props.lastClickPosition">
          <dt class="text-[0.7rem] text-slate-400">Last clicked position</dt>
          <dd class="mt-0.5 font-medium text-slate-200">X: {{ props.lastClickPosition.x }}, Y: {{ props.lastClickPosition.y }}</dd>
        </div>
      </dl>
    </section>

    <!-- Scroll Position -->
    <section id="scroll-position" v-if="props.scrollPosition" class="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="mb-3 text-sm font-semibold text-slate-200">Page Current Scroll Position (Live)</h3>
      <p class="text-xs text-slate-200">X: {{ props.scrollPosition.x }}, Y: {{ props.scrollPosition.y }}</p>
    </section>
  </div>
</template>

