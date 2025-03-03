#!/usr/bin/env node
/**
 * Script para pre-procesar imágenes durante el build
 * Ejecutar con: node scripts/process-images.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Configuración
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const sourceDir = path.join(rootDir, 'src', 'assets', 'images');
const outputDir = path.join(rootDir, 'public', 'images');
const placeholderDir = path.join(outputDir, 'placeholders');

// Tamaños para imágenes responsivas
const sizes = [
  { width: 640, suffix: 'sm' },
  { width: 1024, suffix: 'md' },
  { width: 1920, suffix: 'lg' }
];

// Formatos a generar
const formats = ['webp', 'jpg'];

// Asegurar que los directorios existan
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✅ Directorio creado/verificado: ${dir}`);
  } catch (error) {
    console.error(`❌ Error al crear directorio ${dir}:`, error);
    throw error;
  }
}

// Procesar una imagen
async function processImage(filePath, fileName) {
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const outputPath = path.join(outputDir, fileName);
  
  try {
    // Cargar la imagen con sharp
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // Copiar la imagen original
    await image.toFile(outputPath);
    console.log(`✅ Imagen original copiada: ${outputPath}`);
    
    // Generar versiones en diferentes tamaños y formatos
    for (const size of sizes) {
      for (const format of formats) {
        const resizedImage = image.clone().resize({
          width: size.width,
          height: null, // Mantener proporción
          fit: 'inside',
          withoutEnlargement: true
        });
        
        // Aplicar formato
        if (format === 'webp') {
          resizedImage.webp({ quality: 80 });
        } else if (format === 'jpg') {
          resizedImage.jpeg({ quality: 80, progressive: true });
        }
        
        // Guardar la imagen procesada
        const resizedFileName = `${fileNameWithoutExt}-${size.suffix}.${format}`;
        const resizedPath = path.join(outputDir, resizedFileName);
        await resizedImage.toFile(resizedPath);
        console.log(`✅ Imagen procesada: ${resizedPath}`);
      }
    }
    
    // Generar placeholder de baja resolución
    const placeholderPath = path.join(placeholderDir, `${fileNameWithoutExt}-placeholder.jpg`);
    await image
      .clone()
      .resize({ width: 20, height: null })
      .blur(5)
      .jpeg({ quality: 60 })
      .toFile(placeholderPath);
    console.log(`✅ Placeholder generado: ${placeholderPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error al procesar imagen ${filePath}:`, error);
    return false;
  }
}

// Procesar todas las imágenes en el directorio
async function processAllImages() {
  try {
    // Asegurar que los directorios existan
    await ensureDir(outputDir);
    await ensureDir(placeholderDir);
    
    // Leer el directorio de imágenes
    const files = await fs.readdir(sourceDir);
    console.log(`🔍 Encontradas ${files.length} imágenes para procesar`);
    
    // Filtrar solo archivos de imagen
    const imageFiles = files.filter(file => /\.(jpe?g|png|gif|webp)$/i.test(file));
    console.log(`🖼️ Procesando ${imageFiles.length} archivos de imagen`);
    
    // Crear imagen placeholder por defecto si no existe
    const defaultPlaceholder = path.join(outputDir, 'placeholder.jpg');
    if (!fs.existsSync(defaultPlaceholder)) {
      await sharp({
        create: {
          width: 640,
          height: 480,
          channels: 3,
          background: { r: 200, g: 200, b: 200 }
        }
      })
      .jpeg()
      .toFile(defaultPlaceholder);
      console.log(`✅ Imagen placeholder por defecto creada: ${defaultPlaceholder}`);
    }
    
    // Procesar cada imagen
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of imageFiles) {
      const filePath = path.join(sourceDir, file);
      console.log(`🔄 Procesando: ${file}`);
      
      const success = await processImage(filePath, file);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log('\n📊 Resumen del procesamiento:');
    console.log(`✅ Imágenes procesadas con éxito: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`🏁 Proceso completado`);
    
  } catch (error) {
    console.error('❌ Error durante el procesamiento de imágenes:', error);
    process.exit(1);
  }
}

// Ejecutar el script
console.log('🚀 Iniciando pre-procesamiento de imágenes...');
processAllImages();
