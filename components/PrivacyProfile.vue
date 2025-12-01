<script setup lang="ts">
const props = defineProps<{
  languages: string[]
  cookiesEnabled: boolean | null
  doNotTrack: string | null
  privacyNotes: string[]
}>()
</script>

<template>
  <div class="mt-2 rounded-lg border border-slate-800/70 bg-slate-950/60 p-2">
    <p class="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
      Privacy profile
    </p>
    <p class="text-[0.7rem] text-slate-400">
      Languages:
      <span class="font-medium text-slate-200">
        {{ props.languages.length || 0 }}
      </span>
      &bull;
      Cookies:
      <span class="font-medium text-slate-200">
        {{ props.cookiesEnabled === false ? 'disabled or blocked' : 'enabled' }}
      </span>
      <span v-if="props.doNotTrack" class="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[0.65rem] text-slate-200">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
        DNT: {{ props.doNotTrack }}
      </span>
    </p>
    <ul v-if="props.privacyNotes.length" class="mt-1 list-disc space-y-0.5 pl-4 text-[0.7rem] text-slate-400">
      <li v-for="note in props.privacyNotes" :key="note">
        {{ note }}
      </li>
    </ul>
    <p v-else class="mt-1 text-[0.7rem] text-slate-500">
      No strong privacy signals detected beyond standard browser defaults.
    </p>
  </div>
</template>

