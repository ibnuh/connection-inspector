<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const activeSection = ref<string | null>(null)
const sections = ref<{ id: string; label: string }[]>([])

const headings = [
  { id: 'connection-overview', label: 'Connection Overview' },
  { id: 'network-ip-details', label: 'Network & IP Details' },
  { id: 'screen-device-details', label: 'Screen & Device Details' },
  { id: 'device-type', label: 'Device Type / Model' },
  { id: 'operating-system', label: 'Operating System' },
  { id: 'browser', label: 'Browser' },
  { id: 'date-time', label: 'Date & Time' },
  { id: 'fingerprinting-resistance', label: 'Fingerprinting Resistance' },
  { id: 'http-headers', label: 'HTTP Request Headers' },
  { id: 'browser-window', label: 'Browser Window Size' },
  { id: 'screen', label: 'Screen' },
  { id: 'battery-status', label: 'Battery Status' },
  { id: 'bluetooth', label: 'Bluetooth' },
  { id: 'device-orientation', label: 'Device Orientation' },
  { id: 'device-pointing', label: 'Device Pointing Method' },
  { id: 'speakers', label: 'Speakers' },
  { id: 'microphones', label: 'Microphones' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'browser-plugins', label: 'Browser Plugins' },
  { id: 'mime-types', label: 'Browser MIME Types' },
  { id: 'content-filtering', label: 'Content Filtering' },
  { id: 'tls-ssl', label: 'TLS / SSL' },
  { id: 'webgl', label: 'WebGL' },
  { id: 'speech-synthesis', label: 'SpeechSynthesis' },
  { id: 'fonts', label: 'Fonts' },
  { id: 'page-visibility', label: 'Page Visibility' },
  { id: 'performance', label: 'Performance' },
  { id: 'websocket', label: 'WebSocket' },
  { id: 'storage', label: 'Storage' },
  { id: 'history', label: 'History' },
  { id: 'page-referrer', label: 'Page Referrer' },
  { id: 'private-browsing', label: 'Private Browsing' },
  { id: 'keys-pressed', label: 'Keys Pressed' },
  { id: 'mouse-position', label: 'Mouse Position' },
  { id: 'scroll-position', label: 'Scroll Position' }
]

function scrollToSection(id: string) {
  const element = document.getElementById(id)
  if (element) {
    const offset = 80 // Account for any fixed headers
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

function updateActiveSection() {
  const scrollPosition = window.scrollY + 150 // Offset for better detection

  // Check which sections are visible
  let currentSection: string | null = null
  
  for (let i = headings.length - 1; i >= 0; i--) {
    const element = document.getElementById(headings[i].id)
    if (element) {
      const elementTop = element.offsetTop
      const elementBottom = elementTop + element.offsetHeight
      
      // Check if section is in viewport
      if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
        currentSection = headings[i].id
        break
      }
      // Also check if we've scrolled past this section
      if (scrollPosition >= elementTop) {
        currentSection = headings[i].id
        break
      }
    }
  }
  
  activeSection.value = currentSection
}

onMounted(() => {
  sections.value = headings
  updateActiveSection()
  window.addEventListener('scroll', updateActiveSection)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
})
</script>

<template>
  <nav
    class="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 transform lg:block"
    style="max-height: calc(100vh - 2rem)"
  >
    <div class="w-48 rounded-lg border border-slate-800 bg-slate-900/95 p-3 shadow-lg backdrop-blur">
      <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Contents
      </h3>
      <ul class="space-y-1 overflow-y-auto" style="max-height: calc(100vh - 8rem)">
        <li v-for="section in sections" :key="section.id">
          <button
            :id="`toc-${section.id}`"
            type="button"
            class="w-full text-left text-xs transition-colors hover:text-emerald-300"
            :class="
              activeSection === section.id
                ? 'font-semibold text-emerald-400'
                : 'text-slate-400'
            "
            @click="scrollToSection(section.id)"
          >
            <span class="block truncate whitespace-nowrap">{{ section.label }}</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

