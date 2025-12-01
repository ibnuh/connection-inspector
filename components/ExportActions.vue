<script setup lang="ts">
const props = defineProps<{
  copySummaryStatus: 'idle' | 'copied' | 'error'
  copyDebugStatus: 'idle' | 'copied' | 'error'
  copySummaryToClipboard: () => Promise<void> | void
  downloadSnapshotJson: () => void
  copyDebugSnippet: () => Promise<void> | void
}>()
</script>

<template>
  <div class="sm:col-span-2 flex flex-wrap items-center justify-end gap-2 pt-1 text-xs">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
      @click="props.copySummaryToClipboard"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="props.copySummaryStatus === 'copied' ? 'bg-emerald-400' : props.copySummaryStatus === 'error' ? 'bg-rose-400' : 'bg-slate-500'"
      />
      <span v-if="props.copySummaryStatus === 'copied'">
        Copied summary JSON
      </span>
      <span v-else-if="props.copySummaryStatus === 'error'">
        Failed to copy
      </span>
      <span v-else>
        Copy summary as JSON
      </span>
    </button>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
      @click="props.downloadSnapshotJson"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-sky-400" />
      <span>Download JSON snapshot</span>
    </button>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
      @click="props.copyDebugSnippet"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="props.copyDebugStatus === 'copied' ? 'bg-emerald-400' : props.copyDebugStatus === 'error' ? 'bg-rose-400' : 'bg-slate-500'"
      />
      <span v-if="props.copyDebugStatus === 'copied'">
        Copied debug snippet
      </span>
      <span v-else-if="props.copyDebugStatus === 'error'">
        Failed to copy snippet
      </span>
      <span v-else>
        Copy debug snippet
      </span>
    </button>
  </div>
</template>

