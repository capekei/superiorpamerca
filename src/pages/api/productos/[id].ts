import type { APIRoute } from 'astro';
import { getEntry, updateEntry, removeEntry } from '../../../utils/contentUtils';
// Temporalmente usar el bypass de autenticación para pruebas
import { isAuthenticated } from '../../../utils/authBypass';
import { logAction } from '../../../utils/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Endpoint para obtener un producto específico
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de producto no proporcionado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener producto
    const producto = await getEntry('productos', id);
    
    if (!producto) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ producto }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error al obtener producto ${params.id}:`, error);
    logAction('error', 'api_producto_get', `Error al obtener producto ${params.id}: ${error.message}`);
    
    return new Response(JSON.stringify({ error: 'Error al obtener producto' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Endpoint para actualizar un producto
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de producto no proporcionado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el producto existe
    const productoExistente = await getEntry('productos', id);
    if (!productoExistente) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos actualizados del body
    const data = await request.json();
    
    // Actualizar producto
    const productoActualizado = await updateEntry('productos', id, {
      nombre: data.nombre || productoExistente.data.nombre,
      precio: parseFloat(data.precio) || productoExistente.data.precio,
      descripcion: data.descripcion !== undefined ? data.descripcion : productoExistente.data.descripcion,
      stock: parseInt(data.stock) || productoExistente.data.stock,
      categorias: data.categorias || productoExistente.data.categorias,
      caracteristicas: data.caracteristicas || productoExistente.data.caracteristicas,
      destacado: data.destacado !== undefined ? data.destacado : productoExistente.data.destacado,
      imagenes: data.imagenes || productoExistente.data.imagenes
    });
    
    // Registrar la acción
    logAction('info', 'producto_actualizado', `Producto actualizado: ${data.nombre} (${id})`);
    
    return new Response(JSON.stringify({ success: true, producto: productoActualizado }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error al actualizar producto ${params.id}:`, error);
    logAction('error', 'api_producto_put', `Error al actualizar producto ${params.id}: ${error.message}`);
    
    return new Response(JSON.stringify({ error: 'Error al actualizar producto' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, '../../../content');

// Endpoint para eliminar un producto
export const DELETE: APIRoute = async ({ params, request }) => {
  console.log('DELETE API llamada para producto:', params.id);
  
  try {
    // Verificar autenticación
    const isAuth = await isAuthenticated(request);
    console.log('Autenticación:', isAuth);
    
    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      console.log('Error: ID de producto no proporcionado');
      return new Response(JSON.stringify({ error: 'ID de producto no proporcionado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el producto existe
    console.log('Buscando producto con ID:', id);
    const productoExistente = await getEntry('productos', id);
    console.log('Producto encontrado:', productoExistente ? 'Sí' : 'No');
    
    if (!productoExistente) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar la existencia del archivo directamente
    const filePath = path.join(contentDir, 'productos', `${id}.json`);
    const fileExists = fs.existsSync(filePath);
    console.log('Archivo de producto existe:', fileExists ? 'Sí' : 'No', filePath);
    
    if (fileExists) {
      console.log('Eliminando archivo:', filePath);
      fs.unlinkSync(filePath);
      console.log('Archivo eliminado correctamente');
    } else {
      console.log('ADVERTENCIA: El archivo no existe pero el producto sí fue encontrado por getEntry');
    }
    
    // Intentar eliminar mediante la función de utilidad
    try {
      console.log('Intentando eliminar producto con removeEntry');
      await removeEntry('productos', id);
      console.log('removeEntry ejecutado correctamente');
    } catch (removeError) {
      console.error('Error en removeEntry pero continuamos:', removeError);
      // Continuamos aunque falle removeEntry ya que ya eliminamos el archivo directamente
    }
    
    // Registrar la acción
    logAction('info', 'producto_eliminado', `Producto eliminado: ${productoExistente.data?.nombre || id} (${id})`);
    console.log('Producto eliminado exitosamente');
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Error al eliminar producto ${params.id}:`, error);
    logAction('error', 'api_producto_delete', `Error al eliminar producto ${params.id}: ${error.message}`);
    
    return new Response(JSON.stringify({ 
      error: 'Error al eliminar producto',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
