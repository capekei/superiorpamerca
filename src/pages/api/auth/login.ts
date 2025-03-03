import type { APIRoute } from 'astro';
import { generateToken, setAuthCookie } from '../../../utils/auth';

// En un entorno real, esto estaría en una base de datos segura
// ¡IMPORTANTE! Esto es solo para demostración
const ADMIN_USERS = [
  {
    id: '1',
    email: 'admin@superiorpamerca.com',
    username: 'admin',
    password: 'superior2025!', // En producción, usar contraseñas hasheadas
    name: 'Administrador',
    role: 'admin'
  },
  {
    id: '2',
    email: 'editor@superiorpamerca.com',
    username: 'editor',
    password: 'editor123',
    name: 'Editor',
    role: 'editor'
  },
  {
    id: '3',
    email: 'admin_pamerca@superiorpamerca.com',
    username: 'admin_pamerca',
    password: 'P@merc4_2025!',
    name: 'Admin Pamerca',
    role: 'admin'
  }
];

export const POST: APIRoute = async ({ request }) => {
  try {
    // Obtener datos del cuerpo de la solicitud
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('Error al parsear JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Formato de solicitud inválido' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { email, password } = data;
    console.log(`Intento de login para: ${email || 'email no proporcionado'}`);
    
    // Validar datos
    if (!email || !password) {
      console.log('Login fallido: Datos incompletos');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email y contraseña son requeridos' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar usuario por email o username (en un entorno real, esto sería una consulta a la base de datos)
    const user = ADMIN_USERS.find(u => 
      (u.email === email || u.username === email) && u.password === password
    );
    
    if (!user) {
      console.log(`Login fallido: Credenciales inválidas para ${email}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Credenciales inválidas' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generar token JWT
    console.log(`Generando token para usuario: ${user.email}`);
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'editor'
    });
    
    // Crear respuesta
    console.log('Creando respuesta de login exitoso');
    const response = new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
    // Establecer cookie de autenticación
    console.log('Estableciendo cookie de autenticación');
    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
