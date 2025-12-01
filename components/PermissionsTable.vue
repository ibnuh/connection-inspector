<script setup lang="ts">
const props = defineProps<{
  permissionGeolocation: string | null
  permissionNotifications: string | null
  permissionCamera: string | null
  permissionMicrophone: string | null
  permissionClipboardRead: string | null
  permissionLastChecked: Record<string, string>
  requestGeolocationPermission: () => void
  requestNotificationPermission: () => void
  requestCameraPermission: () => void
  requestMicrophonePermission: () => void
  requestClipboardReadPermission: () => void
}>()
</script>

<template>
  <div class="border-t border-slate-800 pt-2">
    <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
      Permissions (browser view)
    </p>
    <div class="space-y-1.5 text-[0.7rem]">
      <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="props.permissionGeolocation === 'granted' ? 'bg-emerald-400' : props.permissionGeolocation === 'denied' ? 'bg-rose-400' : props.permissionGeolocation === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
            />
            <span>Geolocation: {{ props.permissionGeolocation ?? 'unknown' }}</span>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
            @click="props.requestGeolocationPermission"
          >
            Check
          </button>
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="props.permissionNotifications === 'granted' ? 'bg-emerald-400' : props.permissionNotifications === 'denied' ? 'bg-rose-400' : props.permissionNotifications === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
            />
            <span>Notifications: {{ props.permissionNotifications ?? 'unknown' }}</span>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
            @click="props.requestNotificationPermission"
          >
            Check
          </button>
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="props.permissionCamera === 'granted' ? 'bg-emerald-400' : props.permissionCamera === 'denied' ? 'bg-rose-400' : props.permissionCamera === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
            />
            <span>Camera: {{ props.permissionCamera ?? 'unknown' }}</span>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
            @click="props.requestCameraPermission"
          >
            Check
          </button>
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="props.permissionMicrophone === 'granted' ? 'bg-emerald-400' : props.permissionMicrophone === 'denied' ? 'bg-rose-400' : props.permissionMicrophone === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
            />
            <span>Microphone: {{ props.permissionMicrophone ?? 'unknown' }}</span>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
            @click="props.requestMicrophonePermission"
          >
            Check
          </button>
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="props.permissionClipboardRead === 'granted' ? 'bg-emerald-400' : props.permissionClipboardRead === 'denied' ? 'bg-rose-400' : props.permissionClipboardRead === 'prompt' ? 'bg-amber-400' : 'bg-slate-600'"
            />
            <span>Clipboard read: {{ props.permissionClipboardRead ?? 'unknown' }}</span>
          </div>
          <button
            type="button"
            class="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200 hover:border-slate-500"
            @click="props.requestClipboardReadPermission"
          >
            Check
          </button>
        </div>
      </div>
      <p class="mt-1 text-[0.65rem] text-slate-500">
        This table reflects the browser&rsquo;s current understanding of permission state. Use
        &ldquo;Check&rdquo; to actively prompt for a permission and refresh the status.
      </p>
      <p
        v-if="Object.keys(props.permissionLastChecked).length"
        class="text-[0.65rem] text-slate-500"
      >
        Last checked:
        <span
          v-for="(val, key, idx) in props.permissionLastChecked"
          :key="key"
          class="mr-1"
        >
          <span class="text-slate-400">{{ key }}:</span>
          <span class="text-slate-300">{{ val }}</span>
          <span v-if="idx < Object.keys(props.permissionLastChecked).length - 1">•</span>
        </span>
      </p>
    </div>
  </div>
</template>

