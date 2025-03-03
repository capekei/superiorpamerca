import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';
import { logAction } from '../../../lib/helpers/logger';
import { saveUploadedImage } from '../../../lib/files/imageUtils';
import { PATHS, ensureDirectoriesExist } from '../../../config/paths';
import { PRODUCTS } from '../../../config/constants';
import fs from 'fs';
import path from 'path';

// Endpoint para subir imágenes de productos
export const POST: APIRoute = async ({ request }) => {
  console.log('[API:upload] Iniciando procesamiento de carga de imágenes');
  
  try {
    // Asegurar que los directorios existen
    console.log('[API:upload] Verificando directorios de carga');
    
    // Obtener productId
    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    console.log(`[API:upload] ID del producto: ${productId}`);
    
    if (!productId) {
      console.log('[API:upload] Error: No se proporcionó ID de producto');
      return new Response(JSON.stringify({ error: 'No se proporcionó ID de producto' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar y crear directorios necesarios, incluyendo el directorio específico del producto
    const dirResult = ensureDirectoriesExist(productId);
    
    if (!dirResult.success) {
      console.error('[API:upload] Error al crear directorios:', dirResult.errors);
      
      // Intentar solucionar problemas de permisos
      let errorDetails = dirResult.errors;
      let errorMessage = 'Error al crear directorios de carga';
      
      // Si hay problemas de permisos, proporcionar información más detallada
      if (dirResult.permissions && !dirResult.permissions.canWrite) {
        errorMessage = 'Error de permisos en directorios de carga';
        errorDetails = [
          ...errorDetails,
          `Se requieren permisos de escritura en ${dirResult.permissions.directory}`,
          'Ejecute: chmod -R 755 public/uploads para resolver este problema'
        ];
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        permissions: dirResult.permissions
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    console.log(`[API:upload] ¿Usuario autenticado? ${isAuth ? 'Sí' : 'No'}`);
    
    if (!isAuth) {
      console.log('[API:upload] Acceso denegado: usuario no autenticado');
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Obtener archivos
    const files = formData.getAll('images') as File[];
    console.log(`[API:upload] Número de archivos recibidos: ${files.length}`);
    
    // Mostrar información de cada archivo
    files.forEach((file, index) => {
      console.log(`[API:upload] Archivo #${index+1}: nombre=${file.name}, tipo=${file.type}, tamaño=${file.size} bytes`);
    });
    
    if (!files || files.length === 0) {
      console.log('[API:upload] Error: No se proporcionaron imágenes');
      return new Response(JSON.stringify({ error: 'No se proporcionaron imágenes' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validar tipos de archivos
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(f => f.name).join(', ');
      console.log(`[API:upload] Error: Archivos no válidos detectados: ${invalidNames}`);
      return new Response(JSON.stringify({ 
        error: 'Algunos archivos no son imágenes válidas',
        details: invalidFiles.map(f => `${f.name} (${f.type || 'tipo desconocido'})`)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar límite de archivos
    if (files.length > PRODUCTS.IMAGES_PER_PRODUCT) {
      console.log(`[API:upload] Error: Demasiadas imágenes. Máximo permitido: ${PRODUCTS.IMAGES_PER_PRODUCT}`);
      return new Response(JSON.stringify({ 
        error: `Se excedió el límite de imágenes. Máximo permitido: ${PRODUCTS.IMAGES_PER_PRODUCT}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Guardar las imágenes y obtener las URLs
    console.log('[API:upload] Iniciando guardado de imágenes...');
    const imageUrls = [];
    const errors = [];
    const fileDetails = [];
    
    for (const file of files) {
      try {
        // Verificar tamaño del archivo
        if (file.size === 0) {
          console.log(`[API:upload] Omitiendo archivo vacío: ${file.name}`);
          errors.push(`El archivo "${file.name}" está vacío (0 bytes)`);
          fileDetails.push({
            name: file.name,
            status: 'error',
            error: 'Archivo vacío',
            size: 0
          });
          continue;
        }
        
        // Verificar tamaño máximo (10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB en bytes
        if (file.size > maxSize) {
          console.log(`[API:upload] Archivo demasiado grande: ${file.name} (${file.size} bytes)`);
          errors.push(`El archivo "${file.name}" excede el tamaño máximo permitido de 10MB`);
          fileDetails.push({
            name: file.name,
            status: 'error',
            error: 'Tamaño excedido',
            size: file.size
          });
          continue;
        }
        
        console.log(`[API:upload] Guardando imagen: ${file.name}`);
        const imageUrl = await saveUploadedImage(file, productId);
        console.log(`[API:upload] Resultado de guardar imagen: ${imageUrl || 'ERROR - No se pudo guardar'}`);
        
        if (imageUrl) {
          imageUrls.push(imageUrl);
          console.log(`[API:upload] Imagen guardada con éxito: ${imageUrl}`);
          fileDetails.push({
            name: file.name,
            status: 'success',
            url: imageUrl,
            size: file.size
          });
        } else {
          errors.push(`No se pudo guardar la imagen: ${file.name}`);
          fileDetails.push({
            name: file.name,
            status: 'error',
            error: 'Error al guardar',
            size: file.size
          });
        }
      } catch (fileError) {
        console.error(`[API:upload] Error al procesar el archivo ${file.name}:`, fileError);
        errors.push(`Error al procesar "${file.name}": ${fileError.message || 'Error desconocido'}`);
        fileDetails.push({
          name: file.name,
          status: 'error',
          error: fileError.message || 'Error desconocido',
          size: file.size
        });
      }
    }

    // Registrar la acción
    console.log(`[API:upload] Total de imágenes guardadas: ${imageUrls.length}`);
    logAction('info', 'imagenes_subidas', `${imageUrls.length} imágenes subidas para el producto ${productId}`);
    
    // Verificar que las imágenes existen físicamente
    console.log('[API:upload] Verificando archivos guardados:');
    const existingImages = [];
    
    for (const url of imageUrls) {
      const relativePath = url.replace(/^\//, ''); // Quitar la barra inicial
      const fullPath = path.join(PATHS.PUBLIC, relativePath);
      const exists = fs.existsSync(fullPath);
      console.log(`[API:upload] Imagen: ${fullPath} - ¿Existe? ${exists ? 'Sí' : 'No'}`);
      
      if (exists) {
        existingImages.push(url);
      } else {
        errors.push(`Archivo creado pero no encontrado en la verificación: ${url}`);
      }
    }
    
    // Devolver respuesta
    const hasErrors = errors.length > 0;
    console.log(hasErrors 
      ? `[API:upload] Proceso completado con ${errors.length} errores` 
      : '[API:upload] Proceso de carga completado con éxito');
    
    // Calcular estado general de la operación
    const allFailed = existingImages.length === 0 && files.length > 0;
    const partialSuccess = existingImages.length > 0 && hasErrors;
    const fullSuccess = existingImages.length > 0 && !hasErrors;
    
    // Determinar código de estado HTTP apropiado
    let statusCode = 200; // Éxito por defecto
    
    if (allFailed) {
      statusCode = 500; // Error interno del servidor si todo falló
    } else if (partialSuccess) {
      statusCode = 207; // Multi-Status para éxito parcial
    }
    
    return new Response(JSON.stringify({ 
      success: existingImages.length > 0,
      status: fullSuccess ? 'success' : (partialSuccess ? 'partial' : 'error'),
      imageUrls: existingImages,
      errors: errors.length > 0 ? errors : undefined,
      details: fileDetails, // Incluir detalles de cada archivo
      summary: {
        total: files.length,
        successful: existingImages.length,
        failed: errors.length
      },
      message: `${existingImages.length} imágenes subidas correctamente${hasErrors ? ` (con ${errors.length} errores)` : ''}`
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[API:upload] Error al subir imágenes:', error);
    logAction('error', 'api_upload_post', `Error al subir imágenes: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: 'Error al procesar la subida de imágenes',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
