import type { APIContext } from 'astro';

// Interfaz para el usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

// Interfaz para el token JWT
interface JWTPayload {
  sub: string; // ID del usuario
  email: string;
  name: string;
  role: string;
  exp: number; // Tiempo de expiración
}

// Función para verificar si el usuario está autenticado
export async function isAuthenticated(request: Request): Promise<boolean> {
  try {
    console.log('Verificando autenticación...');
    // Obtener el token de la cookie de forma síncrona
    const token = getTokenFromCookie(request);
    if (!token) {
      console.log('No se encontró token de autenticación');
      return false;
    }
    
    // Verificar el token (operación síncrona en nuestra implementación)
    const payload = verifyToken(token);
    const isValid = !!payload;
    console.log(`Token verificado: ${isValid ? 'válido' : 'inválido'}`);
    return isValid;
  } catch (error) {
    console.error('Error de autenticación:', error);
    return false;
  }
}

// Función centralizada para requerir autenticación
// Retorna un objeto con redirección o estado de autenticación
export async function requireAuth(request: Request) {
  console.log('Ejecutando requireAuth...');
  
  // Verificar si estamos en la página de login para evitar redirecciones infinitas
  const url = new URL(request.url);
  if (url.pathname === '/admin/login') {
    console.log('Ya estamos en la página de login, no es necesario redirigir');
    return { isAuthenticated: false };
  }
  
  const isAuth = await isAuthenticated(request);
  
  if (!isAuth) {
    console.log('Usuario no autenticado, preparando redirección');
    return { redirect: '/admin/login', isAuthenticated: false };
  }
  
  console.log('Usuario autenticado correctamente');
  return { isAuthenticated: true };
}

// Función para obtener el usuario actual
export async function getCurrentUser(request: Request): Promise<User | null> {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return null;
    
    // Verificar y decodificar el token
    const payload = verifyToken(token);
    if (!payload) return null;
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role as 'admin' | 'editor',
    };
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    return null;
  }
}

// Función para verificar si el usuario tiene permisos de administrador
export async function isAdmin(request: Request): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === 'admin';
}

// Función para obtener el token de la cookie
function getTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
  
  if (!authCookie) return null;
  return authCookie.split('=')[1];
}

// Función para verificar y decodificar el token JWT
function verifyToken(token: string): JWTPayload | null {
  try {
    // En un entorno real, usaríamos una biblioteca como jose o jsonwebtoken
    // para verificar la firma y decodificar el token
    
    // Simulación de verificación de token para desarrollo
    // ¡IMPORTANTE! Reemplazar esto con una verificación real en producción
    const [headerB64, payloadB64, signature] = token.split('.');
    
    // Decodificar el payload
    const payloadJson = atob(payloadB64);
    const payload = JSON.parse(payloadJson) as JWTPayload;
    
    // Verificar expiración
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expirado
    }
    
    return payload;
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return null;
  }
}

// Función para generar un token JWT
export function generateToken(user: User, expiresIn: number = 3600): string {
  // En un entorno real, usaríamos una biblioteca como jose o jsonwebtoken
  // para firmar y generar el token
  
  // Simulación de generación de token para desarrollo
  // ¡IMPORTANTE! Reemplazar esto con una generación real en producción
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + expiresIn
  };
  
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  
  // En un entorno real, aquí generaríamos una firma criptográfica real
  const signature = 'simulated_signature';
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

// Función para establecer la cookie de autenticación
export function setAuthCookie(response: Response, token: string): Response {
  // Configurar la cookie de forma segura
  response.headers.set(
    'Set-Cookie',
    `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`
  );
  
  return response;
}

// Función para eliminar la cookie de autenticación
export function clearAuthCookie(response: Response): Response {
  response.headers.set(
    'Set-Cookie',
    'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  );
  
  return response;
}
