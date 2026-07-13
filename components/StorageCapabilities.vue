<script setup lang="ts">
  import { formatBytes } from '@/utils/format'

  const props = defineProps<{
    localStorageEnabled: boolean | null
    sessionStorageEnabled?: boolean | null
    indexedDBSupported?: boolean | null
    storageQuota: number | null
    storageUsage: number | null
  }>()

  function label(value: boolean | null | undefined): string {
    if (value == null) {
      return 'Unknown'
    }
    return value ? 'Available' : 'Blocked / disabled'
  }

  function dotClass(value: boolean | null | undefined): string {
    if (value == null) {
      return 'bg-slate-600'
    }
    return value ? 'bg-emerald-400' : 'bg-rose-400'
  }
</script>

<template>
  <div
    class="mt-3 min-w-0 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400"
  >
    <p class="mb-1 font-medium text-slate-200">Storage and capabilities</p>
    <ul class="grid grid-cols-2 gap-2">
      <li class="flex min-w-0 items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="dotClass(props.localStorageEnabled)"
        />
        <span class="break-words">localStorage: {{ label(props.localStorageEnabled) }}</span>
      </li>
      <li class="flex min-w-0 items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="dotClass(props.sessionStorageEnabled)"
        />
        <span class="break-words">sessionStorage: {{ label(props.sessionStorageEnabled) }}</span>
      </li>
      <li class="flex min-w-0 items-center gap-1.5">
        <span
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="dotClass(props.indexedDBSupported)"
        />
        <span class="break-words">IndexedDB: {{ label(props.indexedDBSupported) }}</span>
      </li>
      <li class="flex min-w-0 items-center gap-1.5">
        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        <span class="break-words">JavaScript: Enabled</span>
      </li>
      <li
        v-if="props.storageQuota != null"
        class="col-span-2 flex min-w-0 flex-col text-[0.7rem] text-slate-400"
      >
        <span class="flex min-w-0 items-center gap-1.5">
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
          <span class="break-words">
            Storage quota:
            <span class="font-medium tabular-nums text-slate-200">
              {{ formatBytes(props.storageQuota) }}
            </span>
          </span>
        </span>
        <span v-if="props.storageUsage != null" class="ml-3 mt-0.5 break-words text-slate-500">
          Approx. usage:
          <span class="font-medium tabular-nums text-slate-200">
            {{ formatBytes(props.storageUsage) }}
          </span>
        </span>
      </li>
      <li v-else class="col-span-2 flex min-w-0 items-center gap-1.5 text-[0.7rem] text-slate-500">
        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
        <span class="break-words">Storage quota: Not reported by this browser.</span>
      </li>
    </ul>
  </div>
</template>
