// Script para depurar API endpoints
// Ubicar en /logs/debug-api.js
import fs from 'fs';
import path from 'path';

// Configuración
const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'api-debug.log');

// Asegurar que el directorio de logs existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Función para registrar mensajes de depuración
export function logApiDebug(endpoint, type, data) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    endpoint,
    type,
    data
  };
  
  // Escribir en el archivo de log
  fs.appendFileSync(
    logFile, 
    JSON.stringify(logEntry) + '\n',
    { encoding: 'utf-8' }
  );
  
  // También imprimir en consola
  console.log(`[API-DEBUG] ${timestamp} | ${endpoint} | ${type} | ${JSON.stringify(data)}`);
  
  return logEntry;
}

// Exportar función principal
export default logApiDebug;
