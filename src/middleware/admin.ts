import type { APIContext, APIRoute } from 'astro';
import { isAuthenticated } from '../utils/auth';
import { logAction } from '../utils/logger';

type AdminMiddlewareResult = {
  success: boolean;
  response?: Response;
  error?: Error;
  context?: Record<string, unknown>;
};

/**
 * Middleware para proteger rutas administrativas
 */
export async function adminMiddleware(
  context: APIContext
): Promise<AdminMiddlewareResult> {
  try {
    // 1. Verificar autenticación
    const isAuth = await isAuthenticated(context.request);
    if (!isAuth) {
      logAction(
        'warning',
        'UNAUTHORIZED_ACCESS',
        'Acceso no autorizado a ruta admin',
        {
          path: context.url.pathname,
          ip: context.clientAddress,
          timestamp: new Date().toISOString()
        },
        'anonymous'
      );
      
      // Redireccionar a login con retorno
      const redirectUrl = `/admin/login?redirect=${encodeURIComponent(context.url.pathname)}`;
      return {
        success: false,
        response: new Response(null, {
          status: 302,
          headers: { Location: redirectUrl }
        })
      };
    }
    
    // 2. Verificar permisos específicos si es necesario
    // ...
    
    // 3. Todo correcto, continuar
    return { success: true, context: { user: isAuth } };
  } catch (error) {
    // Capturar y registrar cualquier error
    logAction(
      'error',
      'MIDDLEWARE_ERROR',
      'Error en middleware admin',
      {
        path: context.url.pathname,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      'system'
    );
    
    // Respuesta de error genérica
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      response: new Response(JSON.stringify({
        error: 'Error interno del servidor',
        path: context.url.pathname
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
}

/**
 * HOF para proteger endpoints de API admin
 */
export function protectAdminRoute(handler: APIRoute): APIRoute {
  return async (context) => {
    const middlewareResult = await adminMiddleware(context);
    
    if (!middlewareResult.success) {
      return middlewareResult.response;
    }
    
    // Continuar con el handler original
    try {
      return await handler(context);
    } catch (error) {
      logAction(
        'error',
        'ADMIN_ROUTE_ERROR',
        'Error en ruta admin protegida',
        {
          path: context.url.pathname,
          error: error instanceof Error ? error.message : String(error)
        },
        'system'
      );
      
      return new Response(JSON.stringify({
        error: 'Error procesando la solicitud',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error)) 
          : undefined
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
