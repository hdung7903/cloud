<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <label class="text-sm text-slate-600">Folder ID</label>
      <input
        v-model="folderId"
        type="text"
        class="rounded border border-slate-300 px-2 py-1 text-sm"
        placeholder="e.g., 1"
      />
      <button
        class="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
        @click="load"
      >
        Load
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <input
        v-model="newFolderName"
        type="text"
        class="rounded border border-slate-300 px-2 py-1 text-sm"
        placeholder="New folder name"
      />
      <button
        class="rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white hover:bg-green-700"
        @click="create"
      >
        Create Folder
      </button>
      <span class="text-sm text-slate-500">Parent: {{ folderId || 'root' }}</span>
    </div>

    <div class="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700">Folders</h3>
        <span class="text-xs text-slate-500" v-if="folders.length === 0">None</span>
      </div>
      <ul class="space-y-1">
        <li
          v-for="f in folders"
          :key="f.id"
          class="flex items-center justify-between rounded border border-slate-100 px-2 py-1 text-sm"
        >
          <span>📁 {{ f.name }} (id: {{ f.id }})</span>
        </li>
      </ul>
    </div>

    <div class="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700">Files</h3>
        <span class="text-xs text-slate-500" v-if="files.length === 0">None</span>
      </div>
      <ul class="space-y-1">
        <li
          v-for="f in files"
          :key="f.id"
          class="flex items-center justify-between rounded border border-slate-100 px-2 py-1 text-sm"
        >
          <span>📄 {{ f.name }} (id: {{ f.id }})</span>
          <span class="text-xs text-slate-500">{{ formatSize(f.sizeBytes) }}</span>
        </li>
      </ul>
    </div>

    <div v-if="error" class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createFolder, listChildren } from '../api'

type FileItem = { id: string; name: string; sizeBytes: string }
type FolderItem = { id: string; name: string }

const folderId = ref<string>('1')
const newFolderName = ref('')
const files = ref<FileItem[]>([])
const folders = ref<FolderItem[]>([])
const error = ref('')

async function load() {
  error.value = ''
  try {
    const data = await listChildren(folderId.value)
    files.value = data.files ?? []
    folders.value = data.folders ?? []
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function create() {
  if (!newFolderName.value.trim()) return
  error.value = ''
  try {
    await createFolder(newFolderName.value.trim(), folderId.value)
    newFolderName.value = ''
    await load()
  } catch (e) {
    error.value = (e as Error).message
  }
}

function formatSize(size: string) {
  const num = Number(size)
  if (Number.isNaN(num)) return size
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / 1024 / 1024).toFixed(1)} MB`
}

load()
</script>

