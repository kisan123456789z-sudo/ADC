import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'github-pages-sync',
        closeBundle() {
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const docsDir = path.resolve(import.meta.dirname, 'docs');
          const indexPath = path.resolve(distDir, 'index.html');
          const notFoundPath = path.resolve(distDir, '404.html');
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, notFoundPath);
          }
          try {
            if (fs.existsSync(docsDir)) {
              fs.rmSync(docsDir, { recursive: true, force: true });
            }
            fs.cpSync(distDir, docsDir, { recursive: true });
          } catch (e) {
            console.warn('Sync to docs directory note:', e);
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
