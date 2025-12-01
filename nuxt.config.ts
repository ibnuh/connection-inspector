import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: false,
  typescript: {
    strict: true,
    typeCheck: true
  },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
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


