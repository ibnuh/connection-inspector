<script setup lang="ts">
  const props = defineProps<{
    reverseDnsLoading: boolean
    reverseDnsError: string | null
    reverseDnsHostnames: string[] | null
    runReverseDnsLookup: () => Promise<void> | void
  }>()
</script>

<template>
  <div class="flex flex-col gap-1 rounded-lg bg-slate-950/60 px-3 py-2">
    <div class="flex items-center justify-between gap-2">
      <dt class="text-[0.7rem] font-medium text-slate-300">Reverse DNS (PTR)</dt>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-800 active:bg-slate-700"
        :disabled="props.reverseDnsLoading"
        @click="props.runReverseDnsLookup"
      >
        <span v-if="props.reverseDnsLoading" class="h-1.5 w-1.5 rounded-full bg-sky-400" />
        <span>{{ props.reverseDnsLoading ? 'Checking…' : 'Check DNS' }}</span>
      </button>
    </div>
    <dd class="mt-0.5 text-[0.72rem] text-slate-400">
      <span v-if="props.reverseDnsError">
        {{ props.reverseDnsError }}
      </span>
      <span v-else-if="props.reverseDnsHostnames && props.reverseDnsHostnames.length === 0">
        No reverse DNS records found for this IP.
      </span>
      <span v-else-if="props.reverseDnsHostnames && props.reverseDnsHostnames.length">
        Hostnames:
        <span class="font-medium text-slate-200">
          {{ props.reverseDnsHostnames.join(', ') }}
        </span>
      </span>
      <span v-else> Run a lookup to see PTR records (if any) for your current IP. </span>
    </dd>
  </div>
</template>
