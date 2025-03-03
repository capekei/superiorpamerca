# Componentes de Imágenes Optimizados para Cloudflare

Este directorio contiene componentes optimizados para el manejo de imágenes en Astro.js con Cloudflare.

## Componentes Principales

### OptimizedImage.astro
Componente base para renderizar imágenes optimizadas. Características:
- Soporte para imágenes locales y remotas
- Carga perezosa (lazy loading)
- Manejo de errores con fallback
- Soporte para diferentes modos de object-fit

### ProductImage.astro
Componente especializado para mostrar imágenes de productos con funcionalidades avanzadas:
- Galería de imágenes con miniaturas
- Zoom en hover
- Modal de zoom con gestos
- Optimizado para diferentes tamaños de pantalla

### ProductGallery.astro
Componente para mostrar una galería de productos:
- Diseño responsivo en grid
- Soporte para etiquetas "próximamente"
- Optimizado para SEO y accesibilidad

### ImageUploader.astro
Componente para subir imágenes:
- Arrastrar y soltar (drag & drop)
- Vista previa de imágenes
- Validación de tipos y tamaños
- Barra de progreso durante la carga

## Utilidades

Para el procesamiento de imágenes, se incluyen las siguientes utilidades:

- `cloudflareImageUtils.ts`: Funciones para generar URLs optimizadas para Cloudflare
- `scripts/process-images.mjs`: Script para pre-procesar imágenes durante el build

## Uso

```astro
---
import OptimizedImage from '../components/OptimizedImage.astro';
---

<OptimizedImage 
  src="/ruta/a/imagen.jpg" 
  alt="Descripción de la imagen"
  width={800}
  height={600}
  objectFit="cover"
/>
```

## Configuración

La configuración para el manejo de imágenes se encuentra en `astro.config.mjs`, donde se ha optimizado para el despliegue en Cloudflare.
