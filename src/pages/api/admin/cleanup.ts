import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../utils/auth';
import { logAction } from '../../../utils/logger';
import { 
  identifyTestProducts, 
  backupProducts, 
  cleanupTestProducts 
} from '../../../utils/cleanupUtils';

// Endpoint para identificar productos de prueba
export const GET: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Identificar productos de prueba
    const testProducts = await identifyTestProducts();
    
    // Formatear respuesta
    const formattedProducts = testProducts.map(({ product, reasons }) => ({
      id: product.id,
      nombre: product.data.nombre,
      precio: product.data.precio,
      reasons,
      data: product.data
    }));
    
    return new Response(JSON.stringify({ 
      success: true,
      testProducts: formattedProducts,
      count: formattedProducts.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al identificar productos de prueba:', error);
    logAction('error', 'api_cleanup_get', `Error al identificar productos de prueba: ${error.message}`);
    
    return new Response(JSON.stringify({ error: 'Error al identificar productos de prueba' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Endpoint para realizar la limpieza de productos
export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener IDs de productos a eliminar
    const body = await request.json();
    const { productIds } = body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No se proporcionaron IDs de productos válidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Crear backup antes de eliminar
    const backupPath = await backupProducts();
    
    // Realizar limpieza
    const result = await cleanupTestProducts(productIds);
    
    // Registrar acción
    logAction('info', 'productos_limpieza', 
      `Limpieza de productos completada. Eliminados: ${result.removed.length}, Errores: ${result.errors.length}`,
      { removed: result.removed, errors: result.errors }
    );
    
    return new Response(JSON.stringify({ 
      success: true,
      result,
      backupPath
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al limpiar productos:', error);
    logAction('error', 'api_cleanup_post', `Error al limpiar productos: ${error.message}`);
    
    return new Response(JSON.stringify({ error: 'Error al limpiar productos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
