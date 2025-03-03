export type SerializableRouteParam = string | number;

/**
 * Convierte de forma segura un parámetro en un string válido para URL
 * Previene el problema [object Object] en rutas
 */
export function toRouteParam(value: unknown): string {
  if (value === null || value === undefined) {
    throw new Error('El parámetro de ruta no puede ser null o undefined');
  }
  
  // Si es un objeto con un método toSlug o similar, úsalo
  if (typeof value === 'object' && value !== null) {
    if ('slug' in value && typeof value.slug === 'string') {
      return value.slug;
    }
    if ('id' in value) {
      return String(value.id);
    }
    if ('toSlug' in value && typeof value.toSlug === 'function') {
      return value.toSlug();
    }
    
    throw new Error(`No se puede convertir el objeto a parámetro de ruta: ${JSON.stringify(value)}`);
  }
  
  // Para primitivos
  return String(value);
}

/**
 * Genera una URL segura para navegación
 */
export function createSafeUrl(basePath: string, ...params: unknown[]): string {
  const safePath = [basePath]
    .concat(params.map(param => toRouteParam(param)))
    .filter(Boolean)
    .join('/');
    
  return safePath.startsWith('/') ? safePath : `/${safePath}`;
}
