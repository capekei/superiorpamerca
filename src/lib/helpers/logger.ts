import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../../../logs');

// Asegurar que el directorio de logs existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Tipos de logs
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Interfaz para el log
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  message: string;
  details?: any;
}

/**
 * Registra una acción en el sistema
 * @param level Nivel de log
 * @param action Acción realizada
 * @param message Mensaje descriptivo
 * @param details Detalles adicionales (opcional)
 */
export function logAction(level: LogLevel, action: string, message: string, details?: any): void {
  try {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      action,
      message,
      details
    };
    
    // Crear mensaje de log
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${action}] ${message}`;
    
    // Mostrar en consola
    switch (level) {
      case 'error':
        console.error(logMessage, details || '');
        break;
      case 'warn':
        console.warn(logMessage, details || '');
        break;
      case 'debug':
        console.debug(logMessage, details || '');
        break;
      default:
        console.log(logMessage, details || '');
    }
    
    // Guardar en archivo
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(logsDir, `${today}.log`);
    
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Error al registrar log:', error);
  }
}

/**
 * Obtiene los logs del día actual
 * @returns Array de entradas de log
 */
export function getTodayLogs(): LogEntry[] {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(logsDir, `${today}.log`);
    
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    return lines.map(line => JSON.parse(line) as LogEntry);
  } catch (error) {
    console.error('Error al obtener logs:', error);
    return [];
  }
}

/**
 * Limpia logs antiguos (más de 30 días)
 * @returns Número de archivos eliminados
 */
export function cleanupOldLogs(): number {
  try {
    const files = fs.readdirSync(logsDir);
    const now = new Date();
    let deleted = 0;
    
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const fileDate = new Date(stats.mtime);
      
      // Calcular diferencia en días
      const diffDays = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }
    
    return deleted;
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error);
    return 0;
  }
}
