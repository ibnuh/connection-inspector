<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
    <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
            Connection Inspector
          </h1>
          <p class="mt-1 max-w-xl text-sm text-slate-400">
            A compact, mobile-friendly view of your IP address, browser, device, and connection
            details &mdash; inspired by
            <a
              href="https://www.deviceinfo.me/"
              target="_blank"
              rel="noreferrer"
              class="font-medium text-sky-400 underline-offset-4 hover:underline"
            >
              deviceinfo.me
            </a>
            .
          </p>
        </div>
        <div class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 shadow-soft backdrop-blur">
          <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.35)]" />
          <span>Client-side only • No data stored</span>
        </div>
      </header>

      <main>
        <NuxtPage />
      </main>
    </div>
  </div>
</template>


