import { getCollection } from 'astro:content';
import { logger } from './logger';

/**
 * Verifica si un producto existe en la colección
 * @param productId - ID del producto a verificar
 * @returns Promesa que resuelve a true si el producto existe
 */
export async function productExists(productId: string | undefined): Promise<boolean> {
  try {
    if (!productId) {
      logger.warn('Se intentó verificar un producto con ID vacío');
      return false;
    }
    
    const productos = await getCollection('productos');
    const exists = productos.some(producto => producto.id === productId);
    
    if (!exists) {
      logger.warn(`Producto no encontrado: ${productId}`);
    }
    
    return exists;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al verificar existencia del producto ${productId}: ${errorMessage}`);
    return false;
  }
}

/**
 * Obtiene un producto por su ID
 * @param productId - ID del producto a obtener
 * @returns Producto o null si no existe
 */
export async function getProductById(productId: string | undefined) {
  try {
    if (!productId) {
      logger.warn('Se intentó obtener un producto con ID vacío');
      return null;
    }
    
    const productos = await getCollection('productos');
    const producto = productos.find(p => p.id === productId);
    
    if (!producto) {
      logger.warn(`Producto no encontrado: ${productId}`);
      return null;
    }
    
    return {
      id: producto.id,
      ...producto.data
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`Error al obtener producto ${productId}: ${errorMessage}`);
    return null;
  }
}

/**
 * Valida que un ID de producto tenga un formato válido
 * @param productId - ID del producto a validar
 * @returns true si el formato es válido
 */
export function isValidProductId(productId: string | undefined): boolean {
  // Validar que no sea vacío o undefined
  if (!productId) {
    logger.warn('ID de producto vacío o undefined');
    return false;
  }
  
  // Validar formato (alfanumérico con guiones)
  const validFormat = /^[a-z0-9-]+$/i.test(productId);
  
  if (!validFormat) {
    logger.warn(`ID de producto con formato inválido: ${productId}`);
  }
  
  return validFormat;
}
