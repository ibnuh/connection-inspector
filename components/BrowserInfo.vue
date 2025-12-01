<script setup lang="ts">
const props = defineProps<{
  userAgent: string | null
}>()
</script>

<template>
  <div>
    <p class="text-xs font-semibold text-slate-400">Browser</p>
    <p class="mt-1 text-sm font-medium text-slate-50">
      {{ props.userAgent || 'Detecting browser…' }}
    </p>
  </div>
</template>

