<script setup lang="ts">
const props = defineProps<{
  cookiesEnabled: boolean | null
  online: boolean | null
  timezone: string | null
  languages: string[]
  doNotTrack: string | null
}>()
</script>

<template>
  <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    <div>
      <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">JS</dt>
      <dd class="mt-0.5 font-medium text-emerald-300">
        Enabled
      </dd>
    </div>
    <div>
      <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Cookies</dt>
      <dd class="mt-0.5 font-medium" :class="props.cookiesEnabled ? 'text-emerald-300' : 'text-rose-300'">
        {{ props.cookiesEnabled == null ? 'Unknown' : props.cookiesEnabled ? 'Enabled' : 'Disabled' }}
      </dd>
    </div>
    <div>
      <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Online</dt>
      <dd class="mt-0.5 font-medium" :class="props.online ? 'text-emerald-300' : 'text-rose-300'">
        {{ props.online == null ? 'Unknown' : props.online ? 'Yes' : 'No' }}
      </dd>
    </div>
    <div>
      <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Timezone</dt>
      <dd class="mt-0.5 font-medium">
        {{ props.timezone || 'Unknown' }}
      </dd>
    </div>
    <div>
      <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Language</dt>
      <dd class="mt-0.5 font-medium">
        {{ props.languages.join(', ') || 'Unknown' }}
      </dd>
    </div>
    <div>
      <dt class="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">DNT</dt>
      <dd class="mt-0.5 font-medium">
        {{ props.doNotTrack ?? 'Not reported' }}
      </dd>
    </div>
  </dl>
</template>

