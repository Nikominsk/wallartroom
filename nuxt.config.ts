// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  compatibilityDate: '2025-07-15',
  css: ['~/assets/scss/main.scss'],
  vite: {
    css: {
        preprocessorOptions: {
            scss: {
              additionalData: `@use "@/assets/scss/variables" as *;`,
            },
        },
    },
     optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },
    supabase: {
    redirect: false
  }
})
