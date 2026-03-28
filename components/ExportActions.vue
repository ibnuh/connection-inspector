<script setup lang="ts">
const props = defineProps<{
  copySummaryStatus: 'idle' | 'copied' | 'error'
  copyDebugStatus: 'idle' | 'copied' | 'error'
  copySummaryToClipboard: () => Promise<void> | void
  downloadSnapshot: (format: 'json' | 'csv' | 'markdown') => void
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
    <div class="relative inline-flex items-center gap-1">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-l-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 active:bg-slate-800"
        @click="() => props.downloadSnapshot('json')"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-sky-400" />
        <span>Download JSON</span>
      </button>
      <div class="relative inline-block">
        <select
          class="appearance-none rounded-r-full border border-l-0 border-slate-800 bg-slate-950/80 px-2 py-1 pr-6 text-[0.7rem] font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-900 focus:outline-none"
          @change="(e) => props.downloadSnapshot((e.target as HTMLSelectElement).value as 'json' | 'csv' | 'markdown')"
        >
          <option value="json" selected>JSON</option>
          <option value="csv">CSV</option>
          <option value="markdown">Markdown</option>
        </select>
        <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.5rem] text-slate-400">
          ▼
        </span>
      </div>
    </div>
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

