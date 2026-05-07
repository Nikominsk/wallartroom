<script setup lang="ts">
definePageMeta({ middleware: [] })

// /app → /app/dashboard
if (import.meta.client) {
  await navigateTo('/app/dashboard', { replace: true })
} else {
  await navigateTo('/app/dashboard', { replace: true, redirectCode: 302 })
}
</script>

<template><div /></template>
