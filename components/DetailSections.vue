<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useInspector } from '@/composables/useInspector'
  import DataCard from '@/components/ui/DataCard.vue'
  import DataRow from '@/components/ui/DataRow.vue'

  const { browser, device, permissions, fingerprinting, realtime, storage, localDateTime } =
    useInspector()

  const showLiveTelemetry = ref(false)
  const openGroup = ref<string | null>('browser')

  const groups = [
    { id: 'browser', label: 'Browser and OS' },
    { id: 'privacy', label: 'Privacy and fingerprint' },
    { id: 'device', label: 'Device and sensors' },
    { id: 'media', label: 'Media devices' },
    { id: 'advanced', label: 'Advanced' }
  ] as const

  function toggle(id: string) {
    openGroup.value = openGroup.value === id ? null : id
  }

  function formatBatteryTime(seconds: number | null): string {
    if (seconds === null || seconds === Infinity) {
      return '?'
    }
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const headerEntries = computed(() => Object.entries(browser.httpHeaders.value || {}))
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="group in groups"
      :key="group.id"
      class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
        :aria-expanded="openGroup === group.id"
        @click="toggle(group.id)"
      >
        <span class="text-sm font-semibold text-slate-100">{{ group.label }}</span>
        <span class="text-xs text-slate-500">{{ openGroup === group.id ? 'Hide' : 'Show' }}</span>
      </button>

      <div v-if="openGroup === group.id" class="space-y-3 border-t border-slate-800 px-4 pb-4 pt-3">
        <!-- Browser and OS -->
        <template v-if="group.id === 'browser'">
          <DataCard title="Device type / model">
            <DataRow label="Device type" :value="browser.deviceType.value || 'Unknown'" />
            <DataRow
              v-if="browser.deviceModel.value"
              label="Device model"
              :value="browser.deviceModel.value"
            />
          </DataCard>
          <DataCard title="Operating system">
            <DataRow
              label="OS"
              :value="
                (browser.osName.value || 'Unknown') +
                (browser.osVersion.value ? ` ${browser.osVersion.value}` : '')
              "
            />
            <DataRow
              label="Engine family"
              :value="browser.trueOsCore.value || 'Unknown'"
              hint="Inferred from user agent (Darwin, Windows NT, Linux)."
            />
          </DataCard>
          <DataCard title="Browser">
            <DataRow
              label="Browser"
              :value="
                (browser.browserName.value || 'Unknown') +
                (browser.browserVersion.value ? ` ${browser.browserVersion.value}` : '') +
                (browser.browserEngine.value ? ` (${browser.browserEngine.value})` : '')
              "
            />
            <DataRow
              label="Engine family"
              :value="browser.trueBrowserCore.value || 'Unknown'"
              hint="Inferred from user agent (Chromium, Gecko, WebKit)."
            />
          </DataCard>
          <DataCard title="Date and time">
            <DataRow label="Local (live)" :value="localDateTime || 'Detecting…'" />
            <DataRow label="Time zone" :value="browser.timezone.value || 'Unknown'" />
          </DataCard>
          <DataCard v-if="headerEntries.length" title="Client-visible headers">
            <DataRow v-for="[key, value] in headerEntries" :key="key" :label="key" :value="value" />
          </DataCard>
        </template>

        <!-- Privacy -->
        <template v-else-if="group.id === 'privacy'">
          <DataCard title="Fingerprinting resistance">
            <DataRow
              label="Canvas"
              :value="fingerprinting.canvasFingerprinting.value || 'Unknown'"
            />
            <DataRow
              label="AudioContext"
              :value="fingerprinting.audioContextFingerprinting.value || 'Unknown'"
            />
            <DataRow
              label="Ad blocker heuristic"
              :value="
                fingerprinting.adBlockerDetected.value == null
                  ? 'Unknown'
                  : fingerprinting.adBlockerDetected.value
                    ? 'Likely present'
                    : 'Not detected'
              "
            />
            <DataRow
              label="Fonts sampled"
              :value="String(fingerprinting.fontsDetected.value.length)"
            />
          </DataCard>
          <DataCard v-if="fingerprinting.fontsDetected.value.length" title="Fonts (sample)">
            <p class="break-words text-xs text-slate-300">
              {{ fingerprinting.fontsDetected.value.join(', ') }}
            </p>
          </DataCard>
        </template>

        <!-- Device -->
        <template v-else-if="group.id === 'device'">
          <DataCard title="Window and screen">
            <DataRow
              label="Outer window"
              :value="
                device.windowOuterWidth.value && device.windowOuterHeight.value
                  ? `${device.windowOuterWidth.value} × ${device.windowOuterHeight.value}`
                  : 'Unknown'
              "
            />
            <DataRow
              label="Inner window"
              :value="
                device.windowInnerWidth.value && device.windowInnerHeight.value
                  ? `${device.windowInnerWidth.value} × ${device.windowInnerHeight.value}`
                  : 'Unknown'
              "
            />
            <DataRow label="Orientation" :value="device.screenOrientation.value || 'Unknown'" />
            <DataRow label="Aspect ratio" :value="device.aspectRatio.value || 'Unknown'" />
            <DataRow label="Color gamut" :value="device.screenColorGamut.value || 'Unknown'" />
          </DataCard>
          <DataCard v-if="realtime.batteryLevel.value !== null" title="Battery">
            <DataRow label="Level" :value="`${realtime.batteryLevel.value}%`" />
            <DataRow label="Charging" :value="realtime.batteryCharging.value ? 'Yes' : 'No'" />
            <DataRow
              label="Time remaining"
              :value="formatBatteryTime(realtime.batteryDischargingTime.value)"
            />
          </DataCard>
          <DataCard title="Bluetooth">
            <DataRow
              label="Supported"
              :value="
                realtime.bluetoothSupported.value == null
                  ? 'Unknown'
                  : realtime.bluetoothSupported.value
                    ? 'Yes'
                    : 'No'
              "
            />
          </DataCard>
          <DataCard title="WebGL">
            <DataRow label="WebGL" :value="browser.webglVersion.value || 'Not available'" />
            <DataRow label="WebGL2" :value="browser.webgl2Version.value || 'Not available'" />
            <DataRow label="Renderer" :value="browser.gpuRenderer.value || 'Unknown'" />
            <DataRow label="Vendor" :value="browser.gpuVendor.value || 'Unknown'" />
          </DataCard>
          <DataCard title="TLS / transport">
            <DataRow label="Page protocol" :value="device.tlsVersion.value || 'Unknown'" />
            <DataRow
              label="Cipher suite"
              :value="device.tlsCipher.value || 'Not exposed to page JavaScript'"
            />
          </DataCard>
        </template>

        <!-- Media -->
        <template v-else-if="group.id === 'media'">
          <DataCard title="Media devices">
            <DataRow label="Speakers" :value="String(permissions.speakersCount.value ?? 0)" />
            <DataRow label="Microphones" :value="String(permissions.microphonesCount.value ?? 0)" />
            <DataRow label="Cameras" :value="String(permissions.camerasCount.value ?? 0)" />
          </DataCard>
          <DataCard title="Plugins / MIME">
            <DataRow
              label="Plugins"
              :value="
                browser.plugins.value.length
                  ? browser.plugins.value.map(p => p.name).join(', ')
                  : 'None reported'
              "
            />
            <DataRow
              label="MIME types"
              :value="
                browser.mimeTypes.value.length
                  ? String(browser.mimeTypes.value.length)
                  : 'None reported'
              "
            />
          </DataCard>
        </template>

        <!-- Advanced -->
        <template v-else>
          <DataCard title="Performance timing">
            <template v-if="device.performanceTiming.value">
              <DataRow
                label="Page load (s)"
                :value="String(device.performanceTiming.value.pageLoadTime ?? '—')"
              />
              <DataRow
                label="Network (s)"
                :value="String(device.performanceTiming.value.networkTime ?? '—')"
              />
              <DataRow
                label="DNS (s)"
                :value="String(device.performanceTiming.value.dnsLookupTime ?? '—')"
              />
            </template>
            <p v-else class="text-xs text-slate-500">Timing not available yet.</p>
          </DataCard>
          <DataCard title="Page and history">
            <DataRow
              label="Initially visible"
              :value="
                device.pageVisibilityInitiallyVisible.value == null
                  ? 'Unknown'
                  : device.pageVisibilityInitiallyVisible.value
                    ? 'Yes'
                    : 'No'
              "
            />
            <DataRow label="History length" :value="String(device.historyLength.value ?? '—')" />
            <DataRow label="Referrer" :value="device.pageReferrer.value || 'None'" />
            <DataRow
              label="Private browsing (heuristic)"
              :value="
                device.privateBrowsingMode.value == null
                  ? 'Unknown'
                  : device.privateBrowsingMode.value
                    ? 'Likely'
                    : 'Unlikely'
              "
            />
          </DataCard>
          <DataCard title="User preferences">
            <DataRow label="Color scheme" :value="device.colorScheme.value || 'Unknown'" />
            <DataRow
              label="Reduced motion"
              :value="
                device.reducedMotion.value == null
                  ? 'Unknown'
                  : device.reducedMotion.value
                    ? 'Yes'
                    : 'No'
              "
            />
            <DataRow
              label="Device memory (GB)"
              :value="
                device.deviceMemory.value != null ? String(device.deviceMemory.value) : 'Unknown'
              "
            />
          </DataCard>
          <DataCard title="Live input telemetry">
            <button
              type="button"
              class="mb-2 inline-flex rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              @click="showLiveTelemetry = !showLiveTelemetry"
            >
              {{ showLiveTelemetry ? 'Hide live values' : 'Show live values' }}
            </button>
            <template v-if="showLiveTelemetry">
              <DataRow
                label="Pointer"
                :value="
                  realtime.hasMouse.value
                    ? 'Fine (mouse-like)'
                    : realtime.hasTouchscreen.value
                      ? 'Touch'
                      : 'Unknown'
                "
              />
              <DataRow label="Last key" :value="realtime.lastKeyPressed.value || 'None yet'" />
              <DataRow
                label="Mouse"
                :value="
                  realtime.mousePosition.value
                    ? `${realtime.mousePosition.value.x}, ${realtime.mousePosition.value.y}`
                    : '—'
                "
              />
              <DataRow
                label="Scroll"
                :value="
                  realtime.scrollPosition.value
                    ? `${realtime.scrollPosition.value.x}, ${realtime.scrollPosition.value.y}`
                    : '—'
                "
              />
            </template>
            <p v-else class="text-[0.7rem] text-slate-500">
              Live mouse and key tracking stays hidden until you expand it.
            </p>
          </DataCard>
          <DataCard title="Speech synthesis">
            <DataRow
              label="Supported"
              :value="browser.speechSynthesisSupported.value ? 'Yes' : 'No'"
            />
            <DataRow label="Voices" :value="String(browser.speechVoices.value.length)" />
          </DataCard>
          <DataCard title="Session storage flag">
            <DataRow
              label="sessionStorage"
              :value="
                storage.sessionStorageEnabled.value == null
                  ? 'Unknown'
                  : storage.sessionStorageEnabled.value
                    ? 'Available'
                    : 'Blocked'
              "
            />
          </DataCard>
        </template>
      </div>
    </div>
  </div>
</template>
