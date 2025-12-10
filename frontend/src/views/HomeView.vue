<script setup lang="ts">
import { ref } from 'vue'
import FileBrowser from '../components/FileBrowser.vue'
import { devLogin } from '../api'

type User = { email: string; roles: string[] }

const email = ref('')
const loginError = ref('')
const user = ref<User | null>(null)

function loadUserFromStorage() {
  const stored = localStorage.getItem('user')
  if (stored) user.value = JSON.parse(stored)
}

loadUserFromStorage()

async function handleLogin() {
  loginError.value = ''
  try {
    const data = await devLogin(email.value.trim())
    localStorage.setItem('token', data.token)
    localStorage.setItem('refresh', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    user.value = data.user
  } catch (e) {
    loginError.value = (e as Error).message
  }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh')
  localStorage.removeItem('user')
  user.value = null
}
</script>

<template>
  <div class="grid gap-6 md:grid-cols-3">
    <div class="md:col-span-1">
      <div class="rounded border border-slate-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-slate-700">Dev Login</h2>
        <form class="space-y-3" @submit.prevent="handleLogin">
          <div>
            <label class="text-xs text-slate-500">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sign in (dev)
          </button>
          <p class="text-xs text-slate-500">
            Uses backend /auth/dev-login, stores JWT in localStorage, and calls folder APIs.
          </p>
        </form>
        <div v-if="loginError" class="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {{ loginError }}
        </div>
        <div v-if="user" class="mt-3 rounded border border-slate-100 bg-slate-50 p-2 text-xs text-slate-700">
          Logged in as {{ user.email }} (roles: {{ user.roles.join(', ') || 'none' }})
          <button class="mt-2 rounded bg-slate-200 px-2 py-1 text-xs" @click="logout">Logout</button>
        </div>
      </div>
    </div>
    <div class="md:col-span-2">
      <div class="rounded border border-slate-200 bg-white p-4 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-slate-700">Folder Browser</h2>
        <div v-if="!user" class="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Please login to load folders.
        </div>
        <FileBrowser v-else />
      </div>
    </div>
  </div>
</template>
