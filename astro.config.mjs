import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://shinymetal.bot',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  // Coolify's proxy terminates TLS; trust its X-Forwarded-* for these hosts so the
  // same-origin check on POST /api/subscribe sees https://shinymetal.bot.
  security: {
    allowedDomains: [
      { hostname: 'shinymetal.bot', protocol: 'https' },
      { hostname: 'www.shinymetal.bot', protocol: 'https' },
    ],
  },
  server: { host: true, port: 4321 },
  vite: { plugins: [tailwindcss()] },
});
