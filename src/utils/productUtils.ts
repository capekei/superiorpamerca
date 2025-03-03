import { toRouteParam } from './routing';

/**
 * Genera una URL segura para un producto
 * @param productId - ID o slug del producto
 * @returns URL completa para el producto
 */
export function getProductUrl(productId: unknown): string {
  return `/tienda/producto/${toRouteParam(productId)}`;
}

/**
 * Genera una URL para la imagen principal de un producto
 * @param imagenes - Array de imágenes del producto
 * @param fallbackUrl - URL de respaldo si no hay imágenes
 * @returns URL de la imagen principal
 */
export function getProductMainImage(
  imagenes: Array<{ url: string; principal?: boolean }> | undefined,
  fallbackUrl: string = '/images/producto-placeholder.jpg'
): string {
  if (!imagenes || imagenes.length === 0) {
    return fallbackUrl;
  }
  
  // Buscar imagen marcada como principal
  const imagenPrincipal = imagenes.find(img => img.principal);
  
  // Si no hay imagen principal, usar la primera
  return imagenPrincipal?.url || imagenes[0].url;
}

/**
 * Formatea el precio del producto
 * @param precio - Precio del producto
 * @param locale - Configuración regional (por defecto es-ES)
 * @returns Precio formateado
 */
export function formatProductPrice(precio: number, locale: string = 'es-ES'): string {
  return precio.toLocaleString(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
}

/**
 * Verifica si un producto está en stock
 * @param stock - Cantidad en stock
 * @returns true si hay stock disponible
 */
export function isProductInStock(stock: number): boolean {
  return stock > 0;
}

/**
 * Trunca la descripción de un producto para mostrar en vistas previas
 * @param descripcion - Descripción completa
 * @param maxLength - Longitud máxima (por defecto 100 caracteres)
 * @returns Descripción truncada
 */
export function truncateDescription(descripcion: string, maxLength: number = 100): string {
  if (!descripcion || descripcion.length <= maxLength) {
    return descripcion || '';
  }
  
  return descripcion.substring(0, maxLength) + '...';
}
