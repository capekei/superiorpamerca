import { logAction } from './logger';

/**
 * Función para envolver código propenso a errores con manejo adecuado
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T> | T,
  errorContext: Record<string, unknown> = {},
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logAction(
      'error',
      'OPERATION_ERROR',
      error instanceof Error ? error.message : String(error),
      {
        ...errorContext,
        stack: error instanceof Error ? error.stack : undefined
      },
      'system'
    );
    
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Decorador para funciones de componentes que podrían fallar
 */
export function errorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  context: string,
  fallback?: ReturnType<T>
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      logAction(
        'error',
        'COMPONENT_ERROR',
        `Error en ${context}`,
        {
          args: JSON.stringify(args),
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        'system'
      );
      
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  };
}
