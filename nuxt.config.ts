// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  compatibilityDate: '2025-07-15',
  vite: {
    css: {
        preprocessorOptions: {
            scss: {
              additionalData: `
$color-primary: #111827;
$color-accent: #ff6b35;
$color-bg: #f7f7f7;
$radius-md: 12px;
$radius-lg: 20px;
`,
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
