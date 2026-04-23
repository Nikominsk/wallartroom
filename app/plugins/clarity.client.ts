import { defineNuxtPlugin } from '#app'
import Clarity from '@microsoft/clarity'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    Clarity.init('wfutw3o9jt')
  }
})