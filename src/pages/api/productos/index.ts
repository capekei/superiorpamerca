import type { APIRoute } from 'astro';
import { getCollection, addEntry, updateEntry, removeEntry } from '../../../utils/contentUtils';
import { isAuthenticated } from '../../../utils/auth';
import { logAction } from '../../../utils/logger';
import { logApiDebug } from '../../../logs/debug-api.js';

// Endpoint para obtener todos los productos
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

    // Obtener productos
    const productos = await getCollection('productos');
    
    return new Response(JSON.stringify({ productos }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    logAction('error', 'api_productos_get', `Error al obtener productos: ${error.message}`);
    
    return new Response(JSON.stringify({ error: 'Error al obtener productos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Endpoint para crear un nuevo producto
export const POST: APIRoute = async ({ request }) => {
  try {
    // Depuración - Inicio del POST
    logApiDebug('/api/productos', 'request_start', { method: 'POST', url: request.url });
    
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    logApiDebug('/api/productos', 'auth_check', { isAuth });
    
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del producto del body
    const data = await request.json();
    logApiDebug('/api/productos', 'request_data', { dataKeys: Object.keys(data) });
    
    // Validar datos mínimos requeridos
    if (!data.nombre || !data.precio) {
      logApiDebug('/api/productos', 'validation_error', { missing: { nombre: !data.nombre, precio: !data.precio } });
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos (nombre, precio)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // ID para el nuevo producto
    const productoId = data.id || `producto-${Date.now().toString(36)}`;
    logApiDebug('/api/productos', 'producto_id', { id: productoId });
    
    // Preparar datos para guardar
    const productoData = {
      nombre: data.nombre,
      precio: parseFloat(data.precio),
      descripcion: data.descripcion || '',
      stock: parseInt(data.stock || '0'),
      categorias: data.categorias || [],
      caracteristicas: data.caracteristicas || [],
      destacado: data.destacado || false,
      imagenes: Array.isArray(data.imagenes) ? data.imagenes.map(img => {
        // Si es un string (formato antiguo), convertirlo al nuevo formato
        if (typeof img === 'string') {
          return {
            url: img,
            tipo: img.startsWith('http') ? 'url' : 'local',
            principal: false
          };
        }
        // Si ya tiene el formato nuevo, asegurarse de que tenga todos los campos
        return {
          url: img.url,
          tipo: img.tipo || (img.url.startsWith('http') ? 'url' : 'local'),
          principal: img.principal || false
        };
      }) : []
    };
    
    logApiDebug('/api/productos', 'pre_save_data', { productoId, productoData });
    
    // Crear nuevo producto
    const nuevoProducto = await addEntry('productos', productoId, productoData);
    
    // Registrar la acción
    logAction('info', 'producto_creado', `Producto creado: ${data.nombre} (${nuevoProducto.id})`);
    
    return new Response(JSON.stringify({ success: true, producto: nuevoProducto }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    logAction('error', 'api_productos_post', `Error al crear producto: ${error.message}`);
    logApiDebug('/api/productos', 'error', { 
      message: error.message, 
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ error: 'Error al crear producto' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
