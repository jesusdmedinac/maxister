import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: { enabled: true, persist: true },
  }),
  experimental: {
    env: {
      schema: {
        GEMINI_API_KEY: envField.string({
          context: 'server',
          access: 'secret',
          optional: true,
        }),
        GEMINI_MODEL: envField.string({
          context: 'server',
          access: 'secret',
          optional: true,
          default: 'gemini-flash-lite-latest',
        }),
        ROOT_ADMIN_EMAIL: envField.string({
          context: 'server',
          access: 'secret',
          optional: true,
        }),
        ROOT_ADMIN_PASSWORD: envField.string({
          context: 'server',
          access: 'secret',
          optional: true,
        }),
        ROOT_ADMIN_EMAILS: envField.string({
          context: 'server',
          access: 'secret',
          optional: true,
          default: 'admin@desde0.dev',
        }),
        DEV_ROOT_ADMIN_EMAIL: envField.string({
          context: 'server',
          access: 'public',
          optional: true,
          default: 'admin@desde0.dev',
        }),
      },
    },
  },
  integrations: [
    react(),
    tailwind(),
  ],
});
