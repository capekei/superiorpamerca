import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../utils/auth';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Obtener usuario actual
    const user = await getCurrentUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No autenticado' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Devolver información del usuario
    return new Response(
      JSON.stringify({
        success: true,
        user
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
