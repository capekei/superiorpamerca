import { defineMiddleware } from 'astro:middleware';
import { routeExists } from './utils/linkMonitor';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Solo procesar rutas de administración
  if (path.startsWith('/admin')) {
    // Verificar si la ruta existe
    const exists = routeExists(path);
    
    if (!exists) {
      // Redirigir a la página 404 personalizada de admin
      return context.redirect('/admin/404');
    }
  }
  
  // Continuar con la solicitud normal
  return next();
});
