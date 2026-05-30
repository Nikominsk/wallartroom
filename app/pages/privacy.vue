<template>
  <div class="priv">
    <div class="priv__inner">
      <NuxtLink to="/" class="priv__back">← WallArtRoom</NuxtLink>
      <h1 class="priv__h1">Privacy Policy</h1>
      <p class="priv__date">Last updated: May 2026</p>

      <p class="priv__lead">
        WallArtRoom is a Pinterest metadata management tool. This policy explains what data we collect,
        how we use it, and what cookies we set.
      </p>

      <section class="priv__section">
        <h2 class="priv__h2">1. Who we are</h2>
        <p>WallArtRoom is operated as a sole-trader product. For privacy enquiries contact:
          <a href="mailto:digidesignadobe@gmail.com" class="priv__link">digidesignadobe@gmail.com</a>
        </p>
      </section>

      <section class="priv__section">
        <h2 class="priv__h2">2. Data we collect</h2>
        <table class="priv__table">
          <thead>
            <tr><th>Data</th><th>Why</th><th>Kept until</th></tr>
          </thead>
          <tbody>
            <tr><td>Email address &amp; name (via Google OAuth)</td><td>Account identity</td><td>Account deletion</td></tr>
            <tr><td>Pinterest metadata you enter (titles, descriptions, board names, links, publish dates)</td><td>Core service</td><td>Account deletion</td></tr>
            <tr><td>Images you upload</td><td>Stored in Cloudflare R2 to generate Pinterest pins</td><td>Account deletion or manual delete</td></tr>
            <tr><td>Plan usage counters (uploads, AI generations)</td><td>Enforcing free-plan limits</td><td>Account deletion</td></tr>
            <tr><td>Pinterest analytics CSV you import (impressions, saves, engagement per board)</td><td>Feeds AI board suggestions</td><td>Account deletion</td></tr>
          </tbody>
        </table>
        <p>We do <strong>not</strong> sell, share, or use your data for advertising.</p>
      </section>

      <section class="priv__section">
        <h2 class="priv__h2">3. Cookies</h2>
        <p>We set only <strong>strictly necessary</strong> cookies. No consent banner is required for these under the ePrivacy Directive.</p>
        <table class="priv__table">
          <thead>
            <tr><th>Cookie name</th><th>Purpose</th><th>Type</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sb-*</code> (Supabase)</td>
              <td>Authentication session — keeps you logged in</td>
              <td>Strictly necessary</td>
            </tr>
            <tr>
              <td><code>w__metadata_project</code></td>
              <td>Remembers which project is active so every API call loads the right data without asking</td>
              <td>Strictly necessary</td>
            </tr>
          </tbody>
        </table>
        <p>No analytics, advertising, or third-party tracking cookies are set.</p>
      </section>

      <section class="priv__section">
        <h2 class="priv__h2">4. Third-party services</h2>
        <table class="priv__table">
          <thead>
            <tr><th>Service</th><th>Purpose</th><th>Privacy policy</th></tr>
          </thead>
          <tbody>
            <tr><td>Supabase</td><td>Authentication &amp; database</td><td><a href="https://supabase.com/privacy" target="_blank" rel="noopener" class="priv__link">supabase.com/privacy</a></td></tr>
            <tr><td>Cloudflare R2</td><td>Image storage</td><td><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener" class="priv__link">cloudflare.com/privacypolicy</a></td></tr>
            <tr><td>OpenAI</td><td>AI metadata generation (only when you trigger it)</td><td><a href="https://openai.com/privacy" target="_blank" rel="noopener" class="priv__link">openai.com/privacy</a></td></tr>
            <tr><td>Stripe</td><td>Payment processing (paid plans only)</td><td><a href="https://stripe.com/privacy" target="_blank" rel="noopener" class="priv__link">stripe.com/privacy</a></td></tr>
          </tbody>
        </table>
      </section>

      <section class="priv__section">
        <h2 class="priv__h2">5. Your rights (GDPR)</h2>
        <p>If you are in the EU or UK you have the right to access, correct, export, or delete your data. To exercise any of these rights, email
          <a href="mailto:digidesignadobe@gmail.com" class="priv__link">digidesignadobe@gmail.com</a>.
          You can also delete your account and all associated data directly from
          <NuxtLink to="/metadata/settings" class="priv__link">Settings → Account</NuxtLink>.
        </p>
      </section>

      <section class="priv__section">
        <h2 class="priv__h2">6. Data retention</h2>
        <p>All data is deleted within 30 days of account deletion. Images stored in Cloudflare R2 are deleted immediately on request or when you delete them via the app.</p>
      </section>

      <section class="priv__section">
        <h2 class="priv__h2">7. Changes to this policy</h2>
        <p>We may update this policy. The "last updated" date at the top will always reflect the most recent version. Continued use of the service after changes constitutes acceptance.</p>
      </section>

      <section class="priv__section">
        <h2 class="priv__h2">8. Contact</h2>
        <p><a href="mailto:digidesignadobe@gmail.com" class="priv__link">digidesignadobe@gmail.com</a></p>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })
useHead({ title: 'Privacy Policy · WallArtRoom' })
</script>

<style scoped lang="scss">
.priv {
  min-height: 100vh;
  background: #faf9f7;
  padding: 48px 24px 80px;

  &__inner {
    max-width: 720px;
    margin: 0 auto;
  }

  &__back {
    display: inline-block;
    font-size: 13px;
    color: #6b7280;
    text-decoration: none;
    margin-bottom: 32px;

    &:hover { color: #111; }
  }

  &__h1 {
    font-size: 28px;
    font-weight: 700;
    color: #111;
    margin: 0 0 6px;
  }

  &__date {
    font-size: 13px;
    color: #9ca3af;
    margin: 0 0 24px;
  }

  &__lead {
    font-size: 15px;
    color: #374151;
    line-height: 1.65;
    margin: 0 0 40px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  &__section {
    margin-bottom: 36px;
    padding-bottom: 36px;
    border-bottom: 1px solid #f3f4f6;

    &:last-child { border-bottom: none; }
  }

  &__h2 {
    font-size: 16px;
    font-weight: 700;
    color: #111;
    margin: 0 0 12px;
  }

  p {
    font-size: 14px;
    color: #374151;
    line-height: 1.65;
    margin: 0 0 10px;
  }

  &__link {
    color: #f97316;
    text-decoration: underline;

    &:hover { color: #ea6c0a; }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-bottom: 12px;

    th, td {
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
      line-height: 1.5;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    td { color: #4b5563; }

    code {
      font-size: 12px;
      background: #f3f4f6;
      padding: 1px 5px;
      border-radius: 4px;
    }
  }
}
</style>
