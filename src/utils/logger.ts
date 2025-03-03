import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../logs');

// Asegurar que el directorio de logs existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Tipos de logs
type LogLevel = 'info' | 'warning' | 'error' | 'debug';

// Interfaz para un registro de log
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  message: string;
  user?: string;
  details?: any;
}

/**
 * Registra una acción en el sistema
 */
export function logAction(
  level: LogLevel,
  action: string,
  message: string,
  details?: any,
  user?: string
): void {
  try {
    // Crear objeto de log
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
      user,
      details
    };
    
    // Determinar archivo de log basado en la fecha
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `${today}.log`);
    
    // Escribir en el archivo de log
    fs.appendFileSync(
      logFile,
      JSON.stringify(logEntry) + '\n'
    );
    
    // También mostrar en consola para desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${level.toUpperCase()}] ${action}: ${message}`);
    }
  } catch (error) {
    console.error('Error al registrar log:', error);
  }
}

/**
 * Obtiene los logs para una fecha específica
 */
export function getLogs(date: string): LogEntry[] {
  try {
    const logFile = path.join(logsDir, `${date}.log`);
    
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Error al obtener logs:', error);
    return [];
  }
}

/**
 * Obtiene los logs para un rango de fechas
 */
export function getLogsRange(startDate: string, endDate: string): LogEntry[] {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = new Date(start);
    const logs: LogEntry[] = [];
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      logs.push(...getLogs(dateStr));
      
      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return logs;
  } catch (error) {
    console.error('Error al obtener rango de logs:', error);
    return [];
  }
}

/**
 * Busca logs que coincidan con ciertos criterios
 */
export function searchLogs(
  criteria: {
    level?: LogLevel;
    action?: string;
    message?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
  }
): LogEntry[] {
  try {
    const { startDate, endDate, ...filters } = criteria;
    
    // Obtener logs para el rango de fechas
    const logs = startDate && endDate
      ? getLogsRange(startDate, endDate)
      : startDate
        ? getLogs(startDate)
        : [];
    
    // Filtrar logs según criterios
    return logs.filter(log => {
      for (const [key, value] of Object.entries(filters)) {
        if (value && log[key] !== value) {
          return false;
        }
      }
      return true;
    });
  } catch (error) {
    console.error('Error al buscar logs:', error);
    return [];
  }
}

// Crear objeto logger para exportar todas las funciones
export const logger = {
  /**
   * Registra un mensaje informativo
   */
  info(message: string, details?: any): void {
    logAction('info', 'INFO', message, details);
  },

  /**
   * Registra un mensaje de error
   */
  error(message: string, details?: any): void {
    logAction('error', 'ERROR', message, details);
    // También mostrar en consola para facilitar depuración
    console.error(`[ERROR] ${message}`, details || '');
  },

  /**
   * Registra un mensaje de advertencia
   */
  warn(message: string, details?: any): void {
    logAction('warning', 'WARNING', message, details);
  },

  /**
   * Registra un mensaje de depuración
   */
  debug(message: string, details?: any): void {
    logAction('debug', 'DEBUG', message, details);
  },
  
  /**
   * Método específico para errores de sintaxis
   */
  syntaxError(file: string, line: number, message: string, code?: string): void {
    logAction(
      'error',
      'SYNTAX_ERROR',
      `Error de sintaxis en ${file}:${line}: ${message}`,
      { file, line, message, code },
      'system'
    );
  },
  
  /**
   * Método específico para errores de navegación
   */
  navigationError(from: string, to: string, context?: Record<string, unknown>): void {
    logAction(
      'error',
      'NAVIGATION_ERROR',
      `Error de navegación: ${from} -> ${to}`,
      { from, to, ...context },
      'system'
    );
  }
};

// Exportar funciones individuales para compatibilidad con código existente
export const { info, error, warn, debug, syntaxError, navigationError } = logger;
