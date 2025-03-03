import type { APIRoute } from 'astro';
import { clearAuthCookie } from '../../../utils/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Crear respuesta
    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'Sesión cerrada correctamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
    // Limpiar cookie de autenticación
    return clearAuthCookie(response);
  } catch (error) {
    console.error('Error en logout:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
