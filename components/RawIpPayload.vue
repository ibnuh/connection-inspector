<script setup lang="ts">
  import { ref } from 'vue'
  import type { IpApiResponse } from '@/types'

  const props = defineProps<{
    ipInfo: IpApiResponse | null
  }>()

  const showRawIpPayload = ref(false)
</script>

<template>
  <div v-if="props.ipInfo" class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2">
    <button
      type="button"
      class="inline-flex items-center justify-between gap-2 text-[0.7rem] font-medium text-slate-300"
      @click="showRawIpPayload = !showRawIpPayload"
    >
      <span class="flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full bg-slate-500" />
        Raw ipapi.is payload
      </span>
      <span class="text-slate-500">
        {{ showRawIpPayload ? 'Hide' : 'Show' }}
      </span>
    </button>
    <pre
      v-if="showRawIpPayload"
      class="mt-1 max-h-52 overflow-auto rounded-md bg-slate-950 p-2 text-[0.65rem] leading-snug text-slate-300"
      >{{ JSON.stringify(props.ipInfo, null, 2) }}
    </pre>
  </div>
</template>
