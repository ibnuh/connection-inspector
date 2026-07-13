<template>
  <div
    class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50"
  >
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sky-600 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
    >
      Skip to content
    </a>
    <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:max-w-6xl lg:px-8">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Connection Inspector</h1>
          <p class="mt-1 max-w-xl text-sm text-slate-400">
            A compact, mobile-friendly view of your IP address, browser, device, and connection
            details made by me for me.
          </p>
        </div>
        <div
          class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 shadow-soft backdrop-blur"
        >
          <span
            class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.35)] motion-reduce:shadow-none"
          />
          <span>Client-side only · No data stored</span>
        </div>
      </header>

      <main id="main-content">
        <NuxtPage />
      </main>

      <footer class="border-t border-slate-800 pt-4 text-xs text-slate-500">
        <p class="mb-3">
          Snapshot generated at runtime in your browser. Edge helpers only echo request metadata and
          proxy DNS lookups; nothing is persisted on the server.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <a
            href="https://ibnuhx.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            ibnuhx.com
          </a>
          <span class="text-slate-700">·</span>
          <a
            href="https://github.com/ibnuh"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            GitHub @ibnuh
          </a>
        </div>
      </footer>
    </div>
  </div>
</template>
