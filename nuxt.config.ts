import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-03-28',
  ssr: false,
  typescript: {
    strict: true,
    typeCheck: true
  },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  nitro: {
    preset: process.env.NITRO_PRESET || 'cloudflare-pages',
    prerender: {
      crawlLinks: false
    }
  },
  app: {
    head: {
      title: 'Connection Inspector',
      meta: [
        {
          name: 'description',
          content:
            'Inspect your IP address, browser, device, and connection details in one simple, mobile-friendly page.'
        },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})


