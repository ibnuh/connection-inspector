<script setup lang="ts">
  import { onMounted } from 'vue'
  import { provideInspector } from '@/composables/useInspector'
  import ErrorBoundary from '@/components/ErrorBoundary.vue'

  const inspector = provideInspector()

  onMounted(() => {
    inspector.detectCritical()
    inspector.scheduleDeferred()
  })
</script>

<template>
  <div class="flex flex-col gap-6 lg:pl-48">
    <TableOfContents />

    <ErrorBoundary>
      <ConnectionOverview />
    </ErrorBoundary>

    <section class="grid gap-4 md:grid-cols-2">
      <ErrorBoundary>
        <NetworkIpDetails />
      </ErrorBoundary>
      <ErrorBoundary>
        <ScreenDeviceDetails />
      </ErrorBoundary>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <ErrorBoundary>
        <WebRtcLeakPanel />
      </ErrorBoundary>
      <ErrorBoundary>
        <NetworkProbesPanel />
      </ErrorBoundary>
    </section>

    <section id="dns-leak-test">
      <ErrorBoundary>
        <DnsLeakTest />
      </ErrorBoundary>
    </section>

    <section id="detail-sections" class="space-y-3">
      <div>
        <h2 class="text-sm font-semibold text-slate-100">Deep dive</h2>
        <p class="text-xs text-slate-400">
          Expand a group for browser, privacy, device, media, and advanced signals.
        </p>
      </div>
      <ErrorBoundary>
        <DetailSections />
      </ErrorBoundary>
    </section>
  </div>
</template>
