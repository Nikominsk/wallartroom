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
  },

  // Stripe + AI keys live in private runtime config (server-only).
  // The webhook signing secret is checked on every webhook hit; the secret
  // key signs API requests; price IDs are not actually secret but live here
  // alongside the rest of the billing config to keep one source of truth.
  runtimeConfig: {
    stripe: {
      secretKey:      process.env.STRIPE_SECRET_KEY      || '',
      webhookSecret:  process.env.STRIPE_WEBHOOK_SECRET  || '',
      pricePro:       process.env.STRIPE_PRICE_PRO       || '',
      pricePack25:    process.env.STRIPE_PRICE_PACK_25   || '',
      pricePack100:   process.env.STRIPE_PRICE_PACK_100  || '',
      pricePack300:   process.env.STRIPE_PRICE_PACK_300  || '',
    },
    public: {
      // Base URL used to build Checkout success/cancel return URLs in dev.
      // In production, NUXT_PUBLIC_SITE_URL should be set to the deployed origin.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },
})
