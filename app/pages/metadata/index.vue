<template><span /></template>

<script setup>
// The workspace is rendered inside the metadata layout so switching between
// Pins/Drafts/Schedules/Posted is just a prop change — no remount, no refetch.
definePageMeta({
  layout: 'metadata',
  gallery: { viewLabel: 'Pins' },
})
</script>
