/**
 * Sistema de monitoreo de enlaces para Superior Pamerca Admin Panel
 * 
 * Este módulo proporciona funciones para:
 * 1. Registrar intentos de navegación a páginas inexistentes
 * 2. Notificar a los administradores sobre enlaces rotos
 * 3. Redirigir a los usuarios a páginas alternativas cuando sea posible
 */

// Interfaz para eventos de enlaces rotos
interface BrokenLinkEvent {
  url: string;
  referrer: string;
  timestamp: Date;
  userAgent: string;
  userId?: string;
}

// Almacén de eventos de enlaces rotos (en producción, esto se guardaría en una base de datos)
const brokenLinkEvents: BrokenLinkEvent[] = [];

// Mapa de redirecciones para enlaces conocidos como rotos
const redirectMap: Record<string, string> = {
  // Redirecciones específicas para Superior Pamerca
  '/admin/productos/eliminar': '/admin/productos',
  '/admin/usuarios': '/admin/productos', // Temporal hasta que se implemente
  '/admin/usuarios/nuevo': '/admin/productos', // Temporal hasta que se implemente
  '/admin/configuracion': '/admin', // Temporal hasta que se implemente
  '/admin/perfil': '/admin', // Temporal hasta que se implemente
  '/admin/estadisticas': '/admin', // Temporal hasta que se implemente
  '/admin/ventas': '/admin', // Temporal hasta que se implemente
  '/admin/categorias': '/admin/productos', // Temporal hasta que se implemente
  
  // Redirecciones para las rutas faltantes detectadas
  '/admin/pedidos': '/admin', // Temporal hasta que se implemente
  '/admin/reportes': '/admin', // Temporal hasta que se implemente
  '/admin/clientes': '/admin', // Temporal hasta que se implemente
};

/**
 * Registra un evento de enlace roto
 */
export function logBrokenLink(request: Request): void {
  const url = new URL(request.url);
  const event: BrokenLinkEvent = {
    url: url.pathname,
    referrer: request.headers.get('referer') || 'desconocido',
    timestamp: new Date(),
    userAgent: request.headers.get('user-agent') || 'desconocido',
  };
  
  // Guardar el evento
  brokenLinkEvents.push(event);
  
  // En producción, aquí se enviaría a una base de datos o servicio de monitoreo
  console.error(`[404 Monitor] Enlace roto detectado: ${event.url} (Referrer: ${event.referrer})`);
}

/**
 * Verifica si existe una redirección para una URL específica
 */
export function getRedirectForBrokenLink(path: string): string | null {
  return redirectMap[path] || null;
}

/**
 * Maneja una solicitud a una página inexistente
 * Registra el evento y devuelve una redirección si está disponible
 */
export function handleNotFoundPage(request: Request): { redirect?: string } {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Registrar el enlace roto
  logBrokenLink(request);
  
  // Verificar si hay una redirección configurada
  const redirectPath = getRedirectForBrokenLink(path);
  
  if (redirectPath) {
    return { redirect: redirectPath };
  }
  
  // Sin redirección disponible
  return {};
}

/**
 * Obtiene un resumen de los enlaces rotos recientes
 * Útil para mostrar en un dashboard de administración
 */
export function getBrokenLinksSummary() {
  // Agrupar por URL
  const urlCounts: Record<string, number> = {};
  
  brokenLinkEvents.forEach(event => {
    if (!urlCounts[event.url]) {
      urlCounts[event.url] = 0;
    }
    urlCounts[event.url]++;
  });
  
  // Convertir a array para ordenar
  const summary = Object.entries(urlCounts)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count);
  
  return summary;
}

/**
 * Verifica si una ruta existe en el sistema
 * (Esta es una implementación que verifica contra las rutas conocidas del panel de administración)
 */
export function routeExists(path: string): boolean {
  // Rutas estáticas conocidas en el panel de administración
  const knownRoutes = [
    '/admin',
    '/admin/login',
    '/admin/productos',
    '/admin/productos/nuevo',
    '/admin/404'
  ];
  
  // Verificar rutas exactas
  if (knownRoutes.includes(path)) {
    return true;
  }
  
  // Verificar rutas dinámicas
  if (path.startsWith('/admin/productos/editar/')) {
    // Rutas de edición de productos con ID
    return true;
  }
  
  // Verificar si hay una redirección configurada para esta ruta
  // (consideramos que si hay una redirección, la ruta original no existe)
  if (redirectMap[path]) {
    return false;
  }
  
  // Verificar si es la ruta de API de autenticación
  if (path.startsWith('/api/auth/')) {
    return true;
  }
  
  return false;
}
