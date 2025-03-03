import fs from 'fs';
import path from 'path';
import { PATHS, getProductUploadDir, getProductFileUrl, ensureDirectoriesExist } from '../../config/paths';
import { PRODUCTS } from '../../config/constants';
import { logAction } from '../helpers/logger';

// Asegurar que los directorios existen al cargar el módulo
ensureDirectoriesExist();

/**
 * Guarda una imagen subida para un producto
 * @param file Archivo a guardar
 * @param productId ID del producto
 * @returns URL relativa de la imagen guardada o null si hay error
 */
export async function saveUploadedImage(file: File, productId: string): Promise<string | null> {
  console.log(`[saveUploadedImage] Iniciando guardado de imagen para producto ${productId}`);
  console.log(`[saveUploadedImage] Nombre de archivo original: ${file.name}, tamaño: ${file.size} bytes`);
  
  try {
    // Verificar que el archivo no exceda el tamaño máximo
    if (file.size > PRODUCTS.MAX_IMAGE_SIZE) {
      throw new Error(`El archivo excede el tamaño máximo permitido de ${PRODUCTS.MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
    }
    
    // Verificar extensión del archivo
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!PRODUCTS.ALLOWED_EXTENSIONS.includes(fileExtension) && fileExtension !== '') {
      throw new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${PRODUCTS.ALLOWED_EXTENSIONS.join(', ')}`);
    }
    
    // Crear directorio específico para el producto si no existe
    const productDir = getProductUploadDir(productId);
    console.log(`[saveUploadedImage] Directorio específico del producto: ${productDir}`);
    
    if (!fs.existsSync(productDir)) {
      console.log(`[saveUploadedImage] Creando directorio para el producto: ${productDir}`);
      fs.mkdirSync(productDir, { recursive: true });
    }
    
    // Generar nombre de archivo único
    const timestamp = Date.now();
    const extension = fileExtension || '.jpg'; // Usar .jpg por defecto si no hay extensión
    const sanitizedFileName = file.name
      .replace(/\.[^/.]+$/, "") // Eliminar extensión
      .replace(/[^a-z0-9]/gi, '-') // Reemplazar caracteres no alfanuméricos
      .toLowerCase();
    
    const fileName = `${sanitizedFileName}-${timestamp}${extension}`;
    const filePath = path.join(productDir, fileName);
    console.log(`[saveUploadedImage] Ruta completa del archivo: ${filePath}`);
    
    // Leer el contenido del archivo
    console.log(`[saveUploadedImage] Leyendo contenido del archivo...`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[saveUploadedImage] Contenido leído, tamaño del buffer: ${buffer.length} bytes`);
    
    // Escribir el archivo
    console.log(`[saveUploadedImage] Escribiendo archivo en disco...`);
    fs.writeFileSync(filePath, buffer);
    console.log(`[saveUploadedImage] Archivo escrito correctamente`);
    
    // Verificar que el archivo se haya creado
    const fileExists = fs.existsSync(filePath);
    console.log(`[saveUploadedImage] ¿Archivo creado correctamente? ${fileExists ? 'Sí' : 'No'}`);
    if (!fileExists) {
      throw new Error(`El archivo no se pudo crear en ${filePath}`);
    }
    
    // Devolver la URL relativa
    const relativePath = getProductFileUrl(productId, fileName);
    console.log(`[saveUploadedImage] URL relativa generada: ${relativePath}`);
    
    logAction('info', 'imagen_guardada', `Imagen guardada para producto ${productId}: ${relativePath}`);
    
    return relativePath;
  } catch (error) {
    console.error('[saveUploadedImage] Error al guardar imagen:', error);
    logAction('error', 'guardar_imagen_error', `Error al guardar imagen para producto ${productId}: ${error.message}`);
    return null;
  }
}

/**
 * Elimina una imagen de un producto
 * @param imagePath Ruta relativa de la imagen a eliminar
 * @returns true si se eliminó correctamente, false si hubo error
 */
export function deleteProductImage(imagePath: string): boolean {
  try {
    // Convertir URL relativa a ruta de archivo
    const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const filePath = path.join(PATHS.ROOT, 'public', relativePath);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`La imagen ${imagePath} no existe`);
    }
    
    // Eliminar archivo
    fs.unlinkSync(filePath);
    
    logAction('info', 'imagen_eliminada', `Imagen eliminada: ${imagePath}`);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    logAction('error', 'eliminar_imagen_error', `Error al eliminar imagen ${imagePath}: ${error.message}`);
    return false;
  }
}

/**
 * Elimina todas las imágenes de un producto
 * @param productId ID del producto
 * @returns Objeto con el resultado de la operación
 */
export function deleteAllProductImages(productId: string): { success: boolean; deleted: number; errors: string[] } {
  try {
    const productDir = getProductUploadDir(productId);
    
    // Verificar si el directorio existe
    if (!fs.existsSync(productDir)) {
      return { success: true, deleted: 0, errors: [] };
    }
    
    // Obtener todos los archivos en el directorio
    const files = fs.readdirSync(productDir);
    let deleted = 0;
    const errors: string[] = [];
    
    // Eliminar cada archivo
    for (const file of files) {
      try {
        const filePath = path.join(productDir, file);
        fs.unlinkSync(filePath);
        deleted++;
      } catch (error) {
        errors.push(`Error al eliminar ${file}: ${error.message}`);
      }
    }
    
    // Intentar eliminar el directorio
    try {
      fs.rmdirSync(productDir);
    } catch (error) {
      errors.push(`Error al eliminar directorio: ${error.message}`);
    }
    
    logAction('info', 'imagenes_producto_eliminadas', 
      `Eliminadas ${deleted} imágenes para el producto ${productId}. Errores: ${errors.length}`
    );
    
    return {
      success: errors.length === 0,
      deleted,
      errors
    };
  } catch (error) {
    console.error('Error al eliminar imágenes del producto:', error);
    logAction('error', 'eliminar_imagenes_error', 
      `Error al eliminar imágenes del producto ${productId}: ${error.message}`
    );
    
    return {
      success: false,
      deleted: 0,
      errors: [error.message]
    };
  }
}

/**
 * Verifica si una imagen es un placeholder común
 * @param imagePath Ruta de la imagen
 * @returns true si es un placeholder, false si no
 */
export function isPlaceholderImage(imagePath: string): boolean {
  const placeholderPatterns = [
    /placeholder/i,
    /example/i,
    /ejemplo/i,
    /sample/i,
    /muestra/i,
    /test/i,
    /demo/i,
    /dummy/i
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(imagePath));
}
