/**
 * Utilidades para optimizar imágenes con Cloudflare
 * Proporciona funciones para procesar imágenes y generar URLs optimizadas
 */

/**
 * Interfaz para opciones de optimización de imágenes
 */
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  aspectRatio?: number | string;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
  brightness?: number;
  contrast?: number;
  sharpen?: number;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'entropy';
}

/**
 * Genera una URL de imagen optimizada para Cloudflare Images
 * @param src URL original de la imagen
 * @param options Opciones de optimización
 * @returns URL optimizada
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    fit = 'cover',
    format = 'auto',
    quality = 80,
    brightness,
    contrast,
    sharpen,
    position
  } = options;
  
  // Normalizar la ruta de la imagen
  const normalizedSrc = normalizeImagePath(src);
  
  // Si la URL ya es absoluta, asumimos que es una URL externa
  if (normalizedSrc.startsWith('http')) {
    // Para URLs externas, podemos usar el proxy de Cloudflare Images
    // Ejemplo: https://example.com/cdn-cgi/image/width=800,height=600,fit=cover/https://example.com/image.jpg
    const baseUrl = new URL(normalizedSrc).origin;
    const imagePath = normalizedSrc.replace(baseUrl, '');
    
    // Construir los parámetros de transformación
    const params = buildImageParams({
      width,
      height,
      fit,
      format,
      quality,
      brightness,
      contrast,
      sharpen,
      position
    });
    
    return `${baseUrl}/cdn-cgi/image/${params}${imagePath}`;
  }
  
  // Para imágenes locales
  // Construir los parámetros de transformación
  const params = buildImageParams({
    width,
    height,
    fit,
    format,
    quality,
    brightness,
    contrast,
    sharpen,
    position
  });
  
  // Construir la URL final con los parámetros
  return `/cdn-cgi/image/${params}${normalizedSrc}`;
}

/**
 * Construye los parámetros de URL para la optimización de imágenes
 * @param options Opciones de optimización
 * @returns String de parámetros formateado
 */
function buildImageParams(options: ImageOptimizationOptions): string {
  const params = [];
  
  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.fit) params.push(`fit=${options.fit}`);
  if (options.format) params.push(`format=${options.format}`);
  if (options.quality) params.push(`quality=${options.quality}`);
  if (options.brightness) params.push(`brightness=${options.brightness}`);
  if (options.contrast) params.push(`contrast=${options.contrast}`);
  if (options.sharpen) params.push(`sharpen=${options.sharpen}`);
  if (options.position) params.push(`position=${options.position}`);
  
  return params.join(',');
}

/**
 * Normaliza una ruta de imagen para asegurar que sea válida
 * @param src Ruta de la imagen
 * @param defaultPath Ruta por defecto para imágenes relativas
 * @returns Ruta normalizada
 */
export function normalizeImagePath(src: string, defaultPath: string = '/images'): string {
  if (!src) return `${defaultPath}/placeholder.jpg`;
  if (src.startsWith('http') || src.startsWith('/')) {
    return src;
  }
  return `${defaultPath}/${src}`;
}

/**
 * Genera un conjunto de srcset para imágenes responsivas
 * @param src URL base de la imagen
 * @param options Opciones para generar srcset
 * @returns String de srcset formateado
 */
export function generateSrcSet(
  src: string,
  options: {
    widths?: number[];
    height?: number;
    aspectRatio?: number;
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
  } = {}
): string {
  const {
    widths = [640, 768, 1024, 1280, 1536, 1920],
    height,
    aspectRatio,
    fit = 'cover',
    format = 'auto',
    quality = 80
  } = options;
  
  return widths
    .map(width => {
      // Calcular altura proporcional si se proporciona aspectRatio
      let calculatedHeight = height;
      if (!height && aspectRatio && aspectRatio > 0) {
        calculatedHeight = Math.round(width / aspectRatio);
      }
      
      const optimizedUrl = getOptimizedImageUrl(src, {
        width,
        height: calculatedHeight,
        fit,
        format,
        quality
      });
      
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Genera tamaños responsivos para usar con srcset
 * @param sizes Configuración de tamaños para diferentes breakpoints
 * @returns String de sizes formateado
 */
export function generateSizes(
  sizes: { breakpoint: string; width: string }[] = [
    { breakpoint: '640px', width: '100vw' },
    { breakpoint: '768px', width: '50vw' },
    { breakpoint: '1024px', width: '33vw' },
  ]
): string {
  // Ordenar de menor a mayor breakpoint para correcta evaluación
  const sortedSizes = [...sizes].sort((a, b) => {
    const aValue = parseInt(a.breakpoint.replace(/[^0-9]/g, ''));
    const bValue = parseInt(b.breakpoint.replace(/[^0-9]/g, ''));
    return aValue - bValue;
  });
  
  // Generar string de sizes
  return sortedSizes
    .map(({ breakpoint, width }) => `(min-width: ${breakpoint}) ${width}`)
    .join(', ') + ', 100vw'; // Fallback para viewport más pequeños
}

/**
 * Genera un placeholder de baja resolución para carga progresiva
 * @param src URL de la imagen
 * @param size Tamaño del placeholder (ancho en píxeles)
 * @returns URL del placeholder
 */
export function getPlaceholderUrl(src: string, size: number = 20): string {
  return getOptimizedImageUrl(src, {
    width: size,
    fit: 'cover',
    quality: 60,
    format: 'webp'
  });
}

/**
 * Verifica si una URL de imagen es válida
 * @param url URL a verificar
 * @returns Promesa que resuelve a true si la imagen es válida
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    console.error(`Error verificando URL de imagen: ${url}`, error);
    return false;
  }
}

/**
 * Genera atributos HTML para una imagen optimizada
 * @param src URL de la imagen
 * @param alt Texto alternativo
 * @param options Opciones adicionales
 * @returns Objeto con atributos HTML
 */
export function getImageAttributes(
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    aspectRatio?: number | string;
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
    quality?: number;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    sizes?: string;
    breakpoints?: number[];
    className?: string;
    usePlaceholder?: boolean;
    placeholderSize?: number;
    objectPosition?: string;
    priority?: boolean;
  } = {}
) {
  const {
    width,
    height,
    aspectRatio,
    fit = 'cover',
    format = 'auto',
    quality = 80,
    loading = 'lazy',
    decoding = 'async',
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    breakpoints = [640, 768, 1024, 1280, 1536, 1920],
    className = '',
    usePlaceholder = true,
    placeholderSize = 20,
    objectPosition = 'center',
    priority = false
  } = options;
  
  // Convertir aspectRatio de string a número si es necesario
  let aspectRatioNum: number | undefined;
  if (typeof aspectRatio === 'string') {
    const [width, height] = aspectRatio.split('/').map(Number);
    if (!isNaN(width) && !isNaN(height) && height !== 0) {
      aspectRatioNum = width / height;
    }
  } else {
    aspectRatioNum = aspectRatio;
  }
  
  // Generar srcset para diferentes tamaños
  const srcset = generateSrcSet(src, {
    widths: breakpoints,
    height,
    aspectRatio: aspectRatioNum,
    fit,
    format,
    quality
  });
  
  // Generar URL optimizada para src
  const optimizedSrc = getOptimizedImageUrl(src, {
    width: width || 800, // Valor por defecto si no se especifica
    height,
    fit,
    format,
    quality
  });
  
  // Atributos base
  const attributes: Record<string, any> = {
    src: optimizedSrc,
    alt,
    width,
    height,
    loading: priority ? 'eager' : loading,
    fetchpriority: priority ? 'high' : 'auto',
    decoding,
    srcset,
    sizes,
    class: className,
    style: objectPosition !== 'center' ? `object-position: ${objectPosition};` : undefined
  };
  
  // Añadir placeholder si está habilitado
  if (usePlaceholder) {
    const placeholder = getPlaceholderUrl(src, placeholderSize);
    attributes['data-placeholder'] = placeholder;
    
    // Añadir estilo de fondo con placeholder
    const bgStyle = `background-image: url('${placeholder}'); background-size: cover; background-position: center;`;
    attributes.style = attributes.style ? `${attributes.style} ${bgStyle}` : bgStyle;
  }
  
  // Eliminar atributos undefined
  Object.keys(attributes).forEach(key => {
    if (attributes[key] === undefined) {
      delete attributes[key];
    }
  });
  
  return attributes;
}
