# Guía de Manejo de Excepciones en Astro.js

## Patrones Recomendados para Manejo de Excepciones

### 1. Estructura Correcta de Bloques try/catch/finally

```typescript
try {
  // Código que puede generar errores
} catch (error) {
  // Manejo del error
  console.error('Mensaje descriptivo:', error);
  
  // Tipado seguro del error
  if (error instanceof Error) {
    // Acceder a propiedades específicas de Error
    logger.error(`${error.name}: ${error.message}`);
  } else {
    // Manejar casos donde error no es una instancia de Error
    logger.error(`Error desconocido: ${String(error)}`);
  }
} finally {
  // Código que siempre se ejecuta
  // Ideal para limpieza de recursos
}
```

### 2. Manejo de Promesas y async/await

```typescript
// Patrón recomendado con async/await
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error al obtener datos:', error);
    // Proporcionar un valor por defecto o lanzar un error personalizado
    return { error: true, message: 'No se pudieron cargar los datos' };
  }
}
```

### 3. Errores Personalizados

```typescript
// Definir clases de error personalizadas
class ProductoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductoError';
  }
}

// Uso
try {
  // Código que puede fallar
  if (!producto) {
    throw new ProductoError('Producto no encontrado');
  }
} catch (error) {
  if (error instanceof ProductoError) {
    // Manejo específico para errores de producto
  } else {
    // Manejo genérico
  }
}
```

## Mejores Prácticas en Componentes Astro

### 1. Manejo de Errores en la Carga de Datos

```astro
---
// Componente Astro
import { getProductById } from '../utils/productos';
import ProductoNoEncontrado from '../components/ProductoNoEncontrado.astro';
import { logger } from '../utils/logger';

const { id } = Astro.params;
let producto = null;
let error = null;

try {
  producto = await getProductById(id);
  if (!producto) {
    error = { tipo: 'notFound', mensaje: 'Producto no encontrado' };
  }
} catch (err) {
  logger.error(`Error al cargar producto ${id}:`, err);
  error = { tipo: 'error', mensaje: 'Error al cargar el producto' };
}
---

{error && error.tipo === 'notFound' && <ProductoNoEncontrado />}
{error && error.tipo === 'error' && <div class="error-message">{error.mensaje}</div>}
{producto && <ProductoDetalle producto={producto} />}
```

### 2. Componentes de Fallback

Siempre proporciona componentes de fallback para manejar estados de error:

```astro
---
// ErrorBoundary.astro
const { mensaje = 'Ha ocurrido un error inesperado' } = Astro.props;
---

<div class="error-boundary">
  <div class="error-icon">⚠️</div>
  <h2>Algo salió mal</h2>
  <p>{mensaje}</p>
  <a href="/" class="btn-volver">Volver al inicio</a>
</div>

<style>
  .error-boundary {
    padding: 2rem;
    border: 1px solid #f5c6cb;
    border-radius: 0.25rem;
    background-color: #f8d7da;
    color: #721c24;
    text-align: center;
    margin: 2rem 0;
  }
  /* Más estilos... */
</style>
```

### 3. Manejo de Errores en Formularios

```astro
---
// Componente de formulario
let errores = {};
let exito = false;

if (Astro.request.method === 'POST') {
  try {
    const formData = await Astro.request.formData();
    const nombre = formData.get('nombre');
    
    // Validación
    if (!nombre) {
      errores.nombre = 'El nombre es obligatorio';
    }
    
    // Si no hay errores, procesar
    if (Object.keys(errores).length === 0) {
      await guardarDatos(formData);
      exito = true;
    }
  } catch (error) {
    console.error('Error al procesar formulario:', error);
    errores.general = 'Error al procesar el formulario';
  }
}
---

<form method="POST">
  {errores.general && <div class="error">{errores.general}</div>}
  {exito && <div class="exito">Datos guardados correctamente</div>}
  
  <div class="campo">
    <label for="nombre">Nombre:</label>
    <input type="text" id="nombre" name="nombre" />
    {errores.nombre && <span class="error">{errores.nombre}</span>}
  </div>
  
  <button type="submit">Guardar</button>
</form>
```

## Herramientas de Linting Recomendadas

1. **ESLint con Configuración para TypeScript y Astro**

   Instalar:
   ```bash
   npm install --save-dev eslint eslint-plugin-astro @typescript-eslint/parser @typescript-eslint/eslint-plugin
   ```

   Configuración en `.eslintrc.js`:
   ```javascript
   module.exports = {
     parser: '@typescript-eslint/parser',
     extends: [
       'eslint:recommended',
       'plugin:@typescript-eslint/recommended',
       'plugin:astro/recommended',
     ],
     plugins: ['@typescript-eslint'],
     overrides: [
       {
         files: ['*.astro'],
         parser: 'astro-eslint-parser',
         parserOptions: {
           parser: '@typescript-eslint/parser',
           extraFileExtensions: ['.astro'],
         },
         rules: {
           // Reglas específicas para archivos Astro
         },
       },
     ],
     rules: {
       // Reglas para detectar problemas con try/catch
       'no-unsafe-finally': 'error',
       'no-unreachable': 'error',
     },
   };
   ```

2. **Prettier con Soporte para Astro**

   Instalar:
   ```bash
   npm install --save-dev prettier prettier-plugin-astro
   ```

   Configuración en `.prettierrc`:
   ```json
   {
     "plugins": ["prettier-plugin-astro"],
     "overrides": [
       {
         "files": "*.astro",
         "options": {
           "parser": "astro"
         }
       }
     ],
     "semi": true,
     "singleQuote": true,
     "trailingComma": "es5"
   }
   ```

## Script para Manejo de Archivos de Respaldo

Crear un script en `scripts/cleanup-backups.mjs`:

```javascript
#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

// Configuración
const BACKUP_DIR = 'src/pages/admin/productos/backups';
const MAX_BACKUP_AGE_DAYS = 7; // Mantener backups por 7 días

async function cleanupBackups() {
  try {
    // Asegurar que el directorio existe
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Listar archivos de respaldo
    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const maxAge = MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      
      // Eliminar archivos más antiguos que MAX_BACKUP_AGE_DAYS
      if (now - stats.mtime.getTime() > maxAge) {
        console.log(`Eliminando backup antiguo: ${file}`);
        await fs.unlink(filePath);
      }
    }
    
    console.log('Limpieza de backups completada');
  } catch (error) {
    console.error('Error al limpiar backups:', error);
  }
}

cleanupBackups();
```

## Recomendaciones Adicionales

1. **Implementar un sistema de logging robusto**
   - Usar niveles de log (debug, info, warn, error)
   - Incluir contexto en los mensajes de error
   - Considerar integración con servicios como Sentry

2. **Validación preventiva**
   - Validar datos de entrada antes de procesarlos
   - Usar TypeScript para detección temprana de errores
   - Implementar esquemas de validación (Zod, Yup, etc.)

3. **Manejo de errores en APIs**
   - Respuestas consistentes con códigos HTTP apropiados
   - Mensajes de error amigables para el usuario
   - Detalles técnicos solo en logs, no en respuestas al cliente

4. **Testing**
   - Incluir casos de prueba para escenarios de error
   - Simular fallos de red y otros errores externos
   - Verificar que los componentes de fallback se muestran correctamente
