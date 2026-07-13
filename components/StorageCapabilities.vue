<script setup lang="ts">
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
    class="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-400"
  >
    <p class="mb-1 font-medium text-slate-200">Storage and capabilities</p>
    <ul class="grid grid-cols-2 gap-2">
      <li class="flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full" :class="dotClass(props.localStorageEnabled)" />
        <span>localStorage: {{ label(props.localStorageEnabled) }}</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full" :class="dotClass(props.sessionStorageEnabled)" />
        <span>sessionStorage: {{ label(props.sessionStorageEnabled) }}</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full" :class="dotClass(props.indexedDBSupported)" />
        <span>IndexedDB: {{ label(props.indexedDBSupported) }}</span>
      </li>
      <li class="flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>JavaScript: Enabled</span>
      </li>
      <li
        v-if="props.storageQuota != null"
        class="col-span-2 flex flex-col text-[0.7rem] text-slate-400"
      >
        <span class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span>
            Storage quota:
            <span class="font-medium text-slate-200">
              {{ (props.storageQuota / (1024 * 1024)).toFixed(1) }} MB
            </span>
          </span>
        </span>
        <span v-if="props.storageUsage != null" class="ml-3 mt-0.5 text-slate-500">
          Approx. usage:
          <span class="font-medium text-slate-200">
            {{ (props.storageUsage / (1024 * 1024)).toFixed(1) }} MB
          </span>
        </span>
      </li>
      <li v-else class="col-span-2 flex items-center gap-1.5 text-[0.7rem] text-slate-500">
        <span class="h-1.5 w-1.5 rounded-full bg-slate-600" />
        <span>Storage quota: Not reported by this browser.</span>
      </li>
    </ul>
  </div>
</template>
