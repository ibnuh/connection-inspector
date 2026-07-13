<script setup lang="ts">
  const props = defineProps<{
    id?: string
    title?: string
    description?: string
    loading?: boolean
    class?: string
  }>()
</script>

<template>
  <div
    :id="props.id"
    :class="[
      'flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4',
      props.class
    ]"
  >
    <div
      v-if="props.title || props.description || props.loading"
      class="flex items-center justify-between gap-2"
    >
      <div>
        <h2 v-if="props.title" class="text-sm font-semibold text-slate-100">
          {{ props.title }}
        </h2>
        <p v-if="props.description" class="text-xs text-slate-400">
          {{ props.description }}
        </p>
      </div>
      <span v-if="props.loading" class="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
    </div>
    <slot />
  </div>
</template>
