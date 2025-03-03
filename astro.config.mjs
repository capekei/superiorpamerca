// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";

/**
 * Configuración optimizada para Astro.js con Cloudflare
 * - Soporte mejorado para imágenes
 * - Optimizaciones de rendimiento
 * - Configuración específica para Cloudflare Pages
 */
export default defineConfig({
  site: "https://example.com",
  output: "server", // Habilitar SSR (Server-Side Rendering)
  integrations: [
    mdx(), 
    sitemap(),
    tailwind(),
  ],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    mode: "advanced", // Modo avanzado para mejor soporte de características
    // Configuración específica para imágenes
    imageService: "passthrough", // No usar procesamiento en runtime
    // Habilitar compatibilidad con imágenes de Cloudflare
    images: {
      formats: ['avif', 'webp', 'jpeg', 'jpg', 'png', 'svg', 'gif'],
      domains: ['example.com'], // Dominios permitidos para imágenes remotas
      sizes: [640, 1024, 1920], // Tamaños predefinidos para imágenes responsivas
    },
  }),
  vite: {
    build: {
      // Optimizar el build para Cloudflare
      target: 'esnext',
      minify: 'terser',
      // Excluir Sharp del bundle
      rollupOptions: {
        external: ['sharp']
      },
      // Optimizaciones adicionales
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // Límite para inlinear assets pequeños
    },
    ssr: {
      // Evitar que Sharp se incluya en el SSR
      noExternal: ['@astrojs/cloudflare'],
      external: ['sharp']
    },
    // Optimizaciones para Cloudflare
    optimizeDeps: {
      exclude: ['sharp']
    },
    // Configuración de servidor de desarrollo
    server: {
      hmr: true,
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/_*', '**/backups/**', '**/*.bak', '**/*.bak.*', '**/*.backup', '**/*.old', '**/*~']
      }
    }
  },
  // Configuración para imágenes estáticas
  image: {
    // Usar un servicio de imágenes compatible con Cloudflare
    service: { entrypoint: 'astro/assets/services/noop' },
    // Configuración de calidad y formatos
    domains: ['example.com'], // Dominios permitidos para imágenes remotas
    remotePatterns: [{ protocol: 'https' }], // Patrones permitidos para imágenes remotas
  },
  // Scripts de pre-procesamiento
  hooks: {
    'astro:build:start': async () => {
      // Aquí podríamos llamar a nuestro script de procesamiento de imágenes
      // pero lo hacemos manualmente para evitar problemas de dependencias
      console.log('🚀 Iniciando build con optimización de imágenes...');
    }
  }
});
