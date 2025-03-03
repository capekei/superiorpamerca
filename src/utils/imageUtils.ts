import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logAction } from './logger';

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../public');
const uploadsDir = path.join(publicDir, 'uploads');
const productsImagesDir = path.join(uploadsDir, 'productos');

// Asegurar que los directorios existen
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(productsImagesDir)) {
  fs.mkdirSync(productsImagesDir, { recursive: true });
}

/**
 * Guarda una imagen subida para un producto
 * @param file Archivo de imagen
 * @param productId ID del producto
 * @returns URL relativa de la imagen guardada o null si hubo un error
 */
export async function saveUploadedImage(file: File, productId: string): Promise<string | null> {
  console.log(`[saveUploadedImage] Iniciando guardado de imagen para producto ${productId}`);
  console.log(`[saveUploadedImage] Nombre de archivo original: ${file.name}, tamaño: ${file.size} bytes, tipo: ${file.type}`);
  
  try {
    // Validar el archivo
    if (!file || file.size === 0) {
      throw new Error(`El archivo está vacío o no es válido`);
    }
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error(`El archivo no es una imagen válida. Tipo: ${file.type}`);
    }
    
    // Validar tamaño máximo (10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new Error(`El archivo excede el tamaño máximo permitido de 10MB. Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }
    
    // Validar extensión
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.name).toLowerCase();
    if (fileExtension && !validExtensions.includes(fileExtension)) {
      throw new Error(`Tipo de archivo no permitido. Extensiones válidas: ${validExtensions.join(', ')}`);
    }
    
    // Verificar rutas de directorios
    console.log(`[saveUploadedImage] Directorio público: ${publicDir}`);
    console.log(`[saveUploadedImage] Directorio de uploads: ${uploadsDir}`);
    console.log(`[saveUploadedImage] Directorio de imágenes de productos: ${productsImagesDir}`);
    
    // Asegurar que los directorios existen
    try {
      if (!fs.existsSync(publicDir)) {
        console.log(`[saveUploadedImage] Creando directorio público: ${publicDir}`);
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      if (!fs.existsSync(uploadsDir)) {
        console.log(`[saveUploadedImage] Creando directorio de uploads: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      if (!fs.existsSync(productsImagesDir)) {
        console.log(`[saveUploadedImage] Creando directorio de imágenes de productos: ${productsImagesDir}`);
        fs.mkdirSync(productsImagesDir, { recursive: true });
      }
      
      // Crear directorio específico para el producto si no existe
      const productDir = path.join(productsImagesDir, productId);
      console.log(`[saveUploadedImage] Directorio específico del producto: ${productDir}`);
      
      if (!fs.existsSync(productDir)) {
        console.log(`[saveUploadedImage] Creando directorio para el producto: ${productDir}`);
        fs.mkdirSync(productDir, { recursive: true });
      }
      
      // Verificar permisos de escritura
      try {
        fs.accessSync(productDir, fs.constants.W_OK);
        console.log(`[saveUploadedImage] Permisos de escritura verificados para: ${productDir}`);
      } catch (accessError) {
        throw new Error(`No hay permisos de escritura en el directorio: ${productDir}. Error: ${accessError.message}`);
      }
    } catch (dirError) {
      throw new Error(`Error al crear directorios: ${dirError.message}`);
    }
    
    // Generar nombre de archivo único
    const timestamp = Date.now();
    const safeExtension = fileExtension || '.jpg'; // Usar .jpg por defecto si no hay extensión
    const sanitizedFileName = file.name
      .replace(/\.[^/.]+$/, "") // Eliminar extensión
      .replace(/[^a-z0-9]/gi, '-') // Reemplazar caracteres no alfanuméricos
      .toLowerCase()
      .substring(0, 50); // Limitar longitud del nombre
    
    const fileName = `${sanitizedFileName}-${timestamp}${safeExtension}`;
    const productDir = path.join(productsImagesDir, productId);
    const filePath = path.join(productDir, fileName);
    console.log(`[saveUploadedImage] Ruta completa del archivo: ${filePath}`);
    
    // Leer el contenido del archivo
    console.log(`[saveUploadedImage] Leyendo contenido del archivo...`);
    let buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log(`[saveUploadedImage] Contenido leído, tamaño del buffer: ${buffer.length} bytes`);
    } catch (readError) {
      throw new Error(`Error al leer el contenido del archivo: ${readError.message}`);
    }
    
    // Escribir el archivo
    try {
      console.log(`[saveUploadedImage] Escribiendo archivo en disco...`);
      await fs.promises.writeFile(filePath, buffer);
      console.log(`[saveUploadedImage] Archivo escrito correctamente`);
    } catch (writeError) {
      throw new Error(`Error al escribir el archivo en disco: ${writeError.message}`);
    }
    
    // Verificar que el archivo se haya creado
    const fileExists = fs.existsSync(filePath);
    console.log(`[saveUploadedImage] ¿Archivo creado correctamente? ${fileExists ? 'Sí' : 'No'}`);
    if (!fileExists) {
      throw new Error(`El archivo no se pudo crear en ${filePath}`);
    }
    
    // Verificar tamaño del archivo creado
    try {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error(`El archivo se creó pero está vacío (0 bytes)`);
      }
      console.log(`[saveUploadedImage] Tamaño del archivo guardado: ${stats.size} bytes`);
    } catch (statError) {
      throw new Error(`Error al verificar el archivo guardado: ${statError.message}`);
    }
    
    // Devolver la URL relativa
    const relativePath = `/uploads/productos/${productId}/${fileName}`;
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
 */
export function deleteProductImage(imagePath: string): boolean {
  try {
    // Convertir URL relativa a ruta de archivo
    const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const filePath = path.join(publicDir, relativePath);
    
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
 */
export function deleteAllProductImages(productId: string): { success: boolean; deleted: number; errors: string[] } {
  try {
    const productDir = path.join(productsImagesDir, productId);
    
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
