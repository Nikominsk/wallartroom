// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  vite: {
    css: {
        preprocessorOptions: {
            sass: {
            additionalData: '@import "@/assets/scss/main.scss"',
            },
        },
    },
  },
})
