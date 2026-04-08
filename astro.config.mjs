import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), sitemap()],
  output: 'static',
  site: 'https://shinymetal.bot',
  server: {
    host: true,
    port: 80
  },
  vite: {
    preview: {
      allowedHosts: ['shinymetal.bot', 'localhost']
    }
  }
});
