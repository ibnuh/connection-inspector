<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'

  const activeSection = ref<string | null>('connection-overview')

  const groups = [
    {
      label: 'Start',
      items: [
        { id: 'connection-overview', label: 'Overview' },
        { id: 'network-ip-details', label: 'Network and IP' },
        { id: 'screen-device-details', label: 'Screen and device' }
      ]
    },
    {
      label: 'Privacy and network',
      items: [
        { id: 'webrtc-leak', label: 'WebRTC exposure' },
        { id: 'network-probes', label: 'Connectivity probes' },
        { id: 'dns-leak-test', label: 'DNS resolvers' }
      ]
    },
    {
      label: 'Details',
      items: [{ id: 'detail-sections', label: 'Deep dive groups' }]
    }
  ]

  const flatItems = groups.flatMap(g => g.items)

  function scrollToSection(id: string) {
    const element = document.getElementById(id)
    if (!element) {
      return
    }
    const offset = 80
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth'
    })
    activeSection.value = id
  }

  function updateActiveSection() {
    const scrollPosition = window.scrollY + 150
    let current: string | null = flatItems[0]?.id ?? null

    for (const item of flatItems) {
      const element = document.getElementById(item.id)
      if (!element) {
        continue
      }
      if (element.offsetTop <= scrollPosition) {
        current = item.id
      }
    }

    activeSection.value = current
  }

  onMounted(() => {
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    updateActiveSection()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', updateActiveSection)
  })
</script>

<template>
  <div class="lg:sticky lg:top-6 lg:self-start">
    <!-- Mobile jump nav -->
    <div class="lg:hidden">
      <label for="section-jump" class="sr-only">Jump to section</label>
      <select
        id="section-jump"
        class="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        :value="activeSection || ''"
        @change="scrollToSection(($event.target as HTMLSelectElement).value)"
      >
        <optgroup v-for="group in groups" :key="group.label" :label="group.label">
          <option v-for="item in group.items" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Desktop in-flow sticky nav -->
    <nav
      class="hidden max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/90 p-3 lg:block"
      aria-label="On this page"
    >
      <p class="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
        On this page
      </p>
      <div v-for="group in groups" :key="group.label" class="mb-3 last:mb-0">
        <p class="mb-1 text-[0.6rem] uppercase tracking-wide text-slate-600">{{ group.label }}</p>
        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.id">
            <button
              type="button"
              class="w-full rounded-lg px-2 py-1 text-left text-[0.7rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              :class="
                activeSection === item.id
                  ? 'bg-sky-500/15 font-medium text-sky-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              "
              :aria-current="activeSection === item.id ? 'location' : undefined"
              @click="scrollToSection(item.id)"
            >
              {{ item.label }}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>
