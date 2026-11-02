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
        name: 'inline-splash-logo',
        transformIndexHtml(html: string) {
          const logoPath = path.resolve(import.meta.dirname, 'public/aj-logo.png');
          if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath).toString('base64');
            const dataUri = `data:image/png;base64,${logoBase64}`;
            return html.replace(/__AJ_LOGO_DATA_URI__/g, dataUri);
          }
          return html;
        }
      },
      {
        name: 'github-pages-sync',
        closeBundle() {
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const docsDir = path.resolve(import.meta.dirname, 'docs');
          const rootAssetsDir = path.resolve(import.meta.dirname, 'assets');
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
            // Also sync dist/assets to root assets/ so users deploying root / on GitHub Pages have all hashed bundles
            const distAssetsDir = path.resolve(distDir, 'assets');
            if (fs.existsSync(distAssetsDir)) {
              fs.cpSync(distAssetsDir, rootAssetsDir, { recursive: true });
            }
            // Ensure aj-logo.png is in root and root/assets
            const logoPath = path.resolve(import.meta.dirname, 'public/aj-logo.png');
            if (fs.existsSync(logoPath)) {
              fs.copyFileSync(logoPath, path.resolve(import.meta.dirname, 'aj-logo.png'));
              fs.copyFileSync(logoPath, path.resolve(rootAssetsDir, 'aj-logo.png'));
            }
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
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app-bundle.js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/app-style.css';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
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
