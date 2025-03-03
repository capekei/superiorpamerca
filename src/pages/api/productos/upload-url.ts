import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../utils/auth';
import { logAction } from '../../../utils/logger';

// Endpoint para registrar URLs de imágenes externas
export const POST: APIRoute = async ({ request }) => {
  console.log('[API:upload-url] Iniciando procesamiento de URL de imagen');
  
  try {
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    console.log(`[API:upload-url] ¿Usuario autenticado? ${isAuth ? 'Sí' : 'No'}`);
    
    if (!isAuth) {
      console.log('[API:upload-url] Acceso denegado: usuario no autenticado');
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del body
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.imageUrl) {
      console.log('[API:upload-url] Error: No se proporcionó URL de imagen');
      return new Response(JSON.stringify({ error: 'No se proporcionó URL de imagen' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!data.productId) {
      console.log('[API:upload-url] Error: No se proporcionó ID de producto');
      return new Response(JSON.stringify({ error: 'No se proporcionó ID de producto' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validar formato de URL
    let url;
    try {
      url = new URL(data.imageUrl);
      // Verificar que sea http o https
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('La URL debe comenzar con http:// o https://');
      }
    } catch (error) {
      console.log('[API:upload-url] Error: URL inválida', error);
      return new Response(JSON.stringify({ 
        error: 'URL inválida',
        details: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Registrar la acción
    logAction('info', 'imagen_url_registrada', `URL de imagen registrada para el producto ${data.productId}: ${data.imageUrl}`);
    
    // Devolver respuesta exitosa
    return new Response(JSON.stringify({
      success: true,
      imageUrl: data.imageUrl,
      message: 'URL de imagen registrada correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[API:upload-url] Error al procesar URL de imagen:', error);
    logAction('error', 'api_upload_url_post', `Error al procesar URL de imagen: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: 'Error al procesar la URL de imagen',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
