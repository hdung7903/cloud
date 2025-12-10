<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white shadow-sm">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div class="text-lg font-semibold text-slate-800">Cloud Drive</div>
        <nav class="flex items-center gap-4 text-sm text-slate-600">
          <a href="https://github.com/hdung7903/cloud" class="hover:text-slate-900" target="_blank" rel="noreferrer">
            Repo
          </a>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>
