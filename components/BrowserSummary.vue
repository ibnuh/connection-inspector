<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { formatDevicePixelRatio } from '@/utils/format'

  const props = defineProps<{
    browserName: string | null
    browserVersion: string | null
    browserEngine: string | null
    platform: string | null
    screenWidth: number | null
    screenHeight: number | null
    devicePixelRatio: number | null
    hardwareConcurrency: number | null
    timezone: string | null
    languages: string[]
    cookiesEnabled: boolean | null
    doNotTrack: string | null
    online: boolean | null
    userAgent: string | null
  }>()

  const showUserAgent = ref(false)

  const browserDisplay = computed(() => {
    if (props.browserName && props.browserVersion) {
      return `${props.browserName} ${props.browserVersion}`
    }
    return 'Unknown Browser'
  })

  const screenDisplay = computed(() => {
    if (props.screenWidth && props.screenHeight) {
      return `${props.screenWidth} × ${props.screenHeight}`
    }
    return 'Unknown'
  })

  const pixelRatioDisplay = computed(() => formatDevicePixelRatio(props.devicePixelRatio))

  const languageDisplay = computed(() => {
    if (props.languages.length > 0) {
      return props.languages[0].split('-')[0].toUpperCase()
    }
    return 'Unknown'
  })
</script>

<template>
  <div class="space-y-4">
    <!-- Browser Header -->
    <div class="flex items-start justify-between border-b border-slate-800 pb-3">
      <div>
        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Browser & Device
        </h4>
        <p class="mt-1 text-sm font-semibold text-slate-50">
          {{ browserDisplay }}
        </p>
        <p v-if="props.browserEngine" class="mt-0.5 text-xs text-slate-400">
          Engine: {{ props.browserEngine }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="h-2 w-2 rounded-full"
          :class="props.online ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        <span class="text-xs text-slate-400">{{ props.online ? 'Online' : 'Offline' }}</span>
      </div>
    </div>

    <!-- Raw User Agent -->
    <div v-if="props.userAgent" class="space-y-2">
      <button
        type="button"
        class="flex w-full items-center justify-between text-xs text-slate-400 hover:text-slate-300"
        @click="showUserAgent = !showUserAgent"
      >
        <span class="font-medium">User Agent</span>
        <span class="text-[0.7rem]">{{ showUserAgent ? 'Hide' : 'Show' }}</span>
      </button>
      <div
        v-if="showUserAgent"
        class="break-all rounded-lg bg-slate-900/80 p-3 font-mono text-[0.7rem] leading-relaxed text-slate-300"
      >
        {{ props.userAgent }}
      </div>
    </div>

    <!-- Quick Info Grid -->
    <dl class="grid grid-cols-2 gap-3">
      <div class="min-w-0 rounded-lg bg-slate-900/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Platform</dt>
        <dd class="mt-1 break-words text-sm font-medium text-slate-200">
          {{ props.platform || 'Unknown' }}
        </dd>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-900/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Screen</dt>
        <dd class="mt-1 break-words text-sm font-medium tabular-nums text-slate-200">
          {{ screenDisplay }}
          <span v-if="props.devicePixelRatio != null" class="text-xs text-slate-400">
            @ {{ pixelRatioDisplay }}×
          </span>
        </dd>
      </div>

      <div v-if="props.hardwareConcurrency" class="min-w-0 rounded-lg bg-slate-900/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">CPU Cores</dt>
        <dd class="mt-1 break-words text-sm font-medium tabular-nums text-slate-200">
          {{ props.hardwareConcurrency }}
        </dd>
      </div>

      <div class="min-w-0 rounded-lg bg-slate-900/60 px-3 py-2">
        <dt class="text-[0.7rem] text-slate-400">Language</dt>
        <dd class="mt-1 break-words text-sm font-medium text-slate-200">
          {{ languageDisplay }}
        </dd>
      </div>
    </dl>

    <!-- Status Indicators -->
    <div class="flex flex-wrap gap-2">
      <div
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
        :class="
          props.cookiesEnabled
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-slate-800 text-slate-400'
        "
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="props.cookiesEnabled ? 'bg-emerald-400' : 'bg-slate-600'"
        />
        Cookies {{ props.cookiesEnabled ? 'On' : 'Off' }}
      </div>
      <div
        v-if="props.doNotTrack === '1' || props.doNotTrack === 'yes'"
        class="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-300"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-blue-400" />
        DNT Enabled
      </div>
      <div
        v-if="props.timezone"
        class="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-2.5 py-1 text-xs text-purple-300"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-purple-400" />
        {{ props.timezone }}
      </div>
    </div>
  </div>
</template>
