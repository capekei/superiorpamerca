import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Directorios principales
export const PATHS = {
  // Directorios raíz
  ROOT: rootDir,
  SRC: path.join(rootDir, 'src'),
  PUBLIC: path.join(rootDir, 'public'),
  
  // Directorios de contenido
  CONTENT: path.join(rootDir, 'src/content'),
  PRODUCTOS_CONTENT: path.join(rootDir, 'src/content/productos'),
  
  // Directorios de uploads
  UPLOADS: path.join(rootDir, 'public/uploads'),
  PRODUCTOS_UPLOADS: path.join(rootDir, 'public/uploads/productos'),
  
  // URLs relativas para acceso web
  UPLOADS_URL: '/uploads',
  PRODUCTOS_UPLOADS_URL: '/uploads/productos',
};

/**
 * Obtiene la ruta completa de un directorio de uploads para un producto específico
 * @param productId ID del producto
 * @returns Ruta completa al directorio
 */
export function getProductUploadDir(productId: string): string {
  return path.join(PATHS.PRODUCTOS_UPLOADS, productId);
}

/**
 * Obtiene la URL relativa para un archivo de producto
 * @param productId ID del producto
 * @param fileName Nombre del archivo
 * @returns URL relativa para acceso web
 */
export function getProductFileUrl(productId: string, fileName: string): string {
  return `${PATHS.PRODUCTOS_UPLOADS_URL}/${productId}/${fileName}`;
}

/**
 * Asegura que todos los directorios necesarios existan
 * @param productId ID opcional del producto para crear su directorio específico
 * @returns Objeto con el resultado de la operación
 */
export function ensureDirectoriesExist(productId?: string): { success: boolean; created: string[]; errors: string[]; permissions?: any } {
  const fs = require('fs');
  const dirsToCheck = [
    PATHS.UPLOADS,
    PATHS.PRODUCTOS_UPLOADS
  ];
  
  // Si se proporciona un ID de producto, añadir su directorio específico
  if (productId) {
    dirsToCheck.push(getProductUploadDir(productId));
  }
  
  const created: string[] = [];
  const errors: string[] = [];
  let permissionsInfo = null;
  
  // Verificar permisos del directorio public
  try {
    const publicStats = fs.statSync(PATHS.PUBLIC);
    const publicMode = publicStats.mode;
    const canWrite = (publicStats.mode & 0o200) !== 0; // Verificar permiso de escritura
    
    permissionsInfo = {
      directory: PATHS.PUBLIC,
      mode: publicMode.toString(8),
      canWrite: canWrite
    };
    
    if (!canWrite) {
      errors.push(`No hay permisos de escritura en ${PATHS.PUBLIC}. Modo actual: ${publicMode.toString(8)}`);
    }
  } catch (error) {
    errors.push(`Error al verificar permisos de ${PATHS.PUBLIC}: ${error.message}`);
  }
  
  // Crear directorios necesarios
  for (const dir of dirsToCheck) {
    try {
      if (!fs.existsSync(dir)) {
        console.log(`Creando directorio: ${dir}`);
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 }); // Establecer permisos explícitos
        created.push(dir);
        
        // Verificar que el directorio se creó correctamente
        if (!fs.existsSync(dir)) {
          throw new Error(`El directorio no existe después de intentar crearlo`);
        }
        
        // Verificar permisos después de crear
        const stats = fs.statSync(dir);
        const canWrite = (stats.mode & 0o200) !== 0;
        if (!canWrite) {
          throw new Error(`Directorio creado pero sin permisos de escritura. Modo: ${stats.mode.toString(8)}`);
        }
      } else {
        // Verificar permisos si el directorio ya existe
        const stats = fs.statSync(dir);
        const canWrite = (stats.mode & 0o200) !== 0;
        if (!canWrite) {
          errors.push(`El directorio ${dir} existe pero no tiene permisos de escritura. Modo: ${stats.mode.toString(8)}`);
        }
      }
    } catch (error) {
      errors.push(`Error al crear o verificar ${dir}: ${error.message}`);
    }
  }
  
  return {
    success: errors.length === 0,
    created,
    errors,
    permissions: permissionsInfo
  };
}
