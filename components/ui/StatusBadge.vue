<script setup lang="ts">
const props = defineProps<{
  status: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  label?: string
}>()

const statusClasses = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium',
      statusClasses[props.status]
    ]"
  >
    <span
      v-if="props.status !== 'neutral'"
      :class="['mr-1.5 h-1 w-1 rounded-full', statusClasses[props.status].split(' ')[1].replace('text-', 'bg-')]"
    />
    <slot>{{ props.label }}</slot>
  </span>
</template>
