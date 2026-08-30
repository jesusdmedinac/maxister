import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
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
      },
    },
  },
  integrations: [
    react(),
    tailwind(),
  ],
});
