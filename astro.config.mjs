// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://bleepboard.com',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  compressHTML: true,
});
