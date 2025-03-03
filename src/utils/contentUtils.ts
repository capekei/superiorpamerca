import { getCollection as getAstroCollection, getEntry as getAstroEntry } from 'astro:content';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar utilidades de depuración
try {
  var { logApiDebug } = await import('../logs/debug-api.js');
} catch (error) {
  console.warn('Debug logger no disponible, usando fallback');
  var logApiDebug = (endpoint, type, data) => {
    console.debug(`[DEBUG] ${endpoint} | ${type} | ${JSON.stringify(data)}`);
  };
}

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, '../content');

/**
 * Obtiene todos los elementos de una colección
 */
export async function getCollection(collectionName: string) {
  try {
    return await getAstroCollection(collectionName);
  } catch (error) {
    console.error(`Error al obtener la colección ${collectionName}:`, error);
    return [];
  }
}

/**
 * Obtiene un elemento específico de una colección
 */
export async function getEntry(collectionName: string, id: string) {
  try {
    return await getAstroEntry(collectionName, id);
  } catch (error) {
    console.error(`Error al obtener la entrada ${id} de la colección ${collectionName}:`, error);
    return null;
  }
}

/**
 * Añade un nuevo elemento a una colección
 */
export async function addEntry(collectionName: string, id: string, data: any) {
  logApiDebug('contentUtils', 'addEntry_start', { collectionName, id, dataKeys: Object.keys(data) });
  try {
    // Verificar que la carpeta de la colección existe
    const collectionPath = path.join(contentDir, collectionName);
    logApiDebug('contentUtils', 'collection_path', { collectionPath, exists: fs.existsSync(collectionPath) });
    
    if (!fs.existsSync(collectionPath)) {
      logApiDebug('contentUtils', 'creating_directory', { collectionPath });
      fs.mkdirSync(collectionPath, { recursive: true });
    }
    
    // Crear el archivo JSON para el nuevo elemento
    const filePath = path.join(collectionPath, `${id}.json`);
    logApiDebug('contentUtils', 'writing_file', { filePath });
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      logApiDebug('contentUtils', 'file_write_success', { filePath });
    } catch (writeError) {
      logApiDebug('contentUtils', 'file_write_error', { 
        filePath, 
        error: writeError.message,
        code: writeError.code
      });
      throw writeError;
    }
    
    // Verificar que el archivo se creó correctamente
    if (!fs.existsSync(filePath)) {
      const error = new Error(`El archivo ${filePath} no pudo ser creado`);
      logApiDebug('contentUtils', 'file_not_created', { filePath });
      throw error;
    }
    
    // Devolver el objeto creado
    logApiDebug('contentUtils', 'entry_created', { id });
    return { id, data };
  } catch (error) {
    console.error(`Error al añadir entrada a la colección ${collectionName}:`, error);
    logApiDebug('contentUtils', 'addEntry_error', { 
      collectionName, 
      id, 
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Actualiza un elemento existente en una colección
 */
export async function updateEntry(collectionName: string, id: string, data: any) {
  try {
    // Verificar que el archivo existe
    const filePath = path.join(contentDir, collectionName, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`La entrada ${id} no existe en la colección ${collectionName}`);
    }
    
    // Actualizar el archivo JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    // Devolver el objeto actualizado
    return { id, data };
  } catch (error) {
    console.error(`Error al actualizar la entrada ${id} en la colección ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Elimina un elemento de una colección
 */
export async function removeEntry(collectionName: string, id: string) {
  console.log(`[removeEntry] Intentando eliminar ${id} de la colección ${collectionName}`);
  try {
    // Verificar que el archivo existe
    const filePath = path.join(contentDir, collectionName, `${id}.json`);
    console.log(`[removeEntry] Ruta del archivo: ${filePath}`);
    console.log(`[removeEntry] Directorio de contenido: ${contentDir}`);
    console.log(`[removeEntry] Verificando si el archivo existe...`);
    
    const exists = fs.existsSync(filePath);
    console.log(`[removeEntry] ¿El archivo existe? ${exists ? 'Sí' : 'No'}`);
    
    if (!exists) {
      console.log(`[removeEntry] ERROR: El archivo no existe`);
      throw new Error(`La entrada ${id} no existe en la colección ${collectionName}`);
    }
    
    // Eliminar el archivo
    console.log(`[removeEntry] Eliminando archivo...`);
    fs.unlinkSync(filePath);
    console.log(`[removeEntry] Archivo eliminado correctamente`);
    
    return true;
  } catch (error) {
    console.error(`[removeEntry] Error al eliminar la entrada ${id} de la colección ${collectionName}:`, error);
    throw error;
  }
}
