# Guía de Gestión de Backups en Proyectos Astro

## Introducción

Esta guía documenta las mejores prácticas para gestionar archivos de respaldo (backups) en proyectos Astro.js, evitando advertencias y problemas durante el desarrollo y la compilación.

## Estructura Recomendada

### 1. Ubicación de Backups

Los archivos de respaldo deben almacenarse siguiendo estas directrices:

- **Directorio dedicado**: `/backups/` en la raíz del proyecto (fuera de `/src/`)
- **Archivos temporales**: Si necesitan estar en `/src/pages/`, deben tener prefijo underscore (`_`)

### 2. Convenciones de Nomenclatura

- **Archivos en directorio de backups**: `{nombre-original}.{timestamp}`
- **Archivos en directorios de código**: `_{nombre-original}`

## Soluciones para Advertencias de Astro

### Prefijo Underscore

Astro ignora automáticamente los archivos que comienzan con underscore (`_`). Esta es la solución recomendada para archivos de respaldo que deben permanecer en directorios de código fuente.

```bash
# Renombrar un archivo con prefijo underscore
mv archivo.astro _archivo.astro
```

### Configuración de astro.config.mjs

Para ignorar patrones específicos de archivos de respaldo, se ha configurado lo siguiente:

```javascript
// En astro.config.mjs
export default defineConfig({
  // ... otras configuraciones
  vite: {
    server: {
      watch: {
        ignored: [
          '**/node_modules/**', 
          '**/dist/**', 
          '**/_*',              // Archivos con prefijo underscore
          '**/backups/**',      // Directorio de backups
          '**/*.bak',           // Extensiones comunes de backup
          '**/*.bak.*',
          '**/*.backup',
          '**/*.old',
          '**/*~'
        ]
      }
    }
  }
});
```

### Archivo .astroignore

Se ha creado un archivo `.astroignore` en la raíz del proyecto para excluir patrones de archivos de respaldo:

```
# Archivos de respaldo que Astro debe ignorar
**/*.bak
**/*.bak.*
**/*.backup
**/*.old
**/*~
**/backups/
```

## Herramientas de Gestión de Backups

Se han implementado scripts para facilitar la gestión de backups:

### 1. Gestor de Backups

El script `scripts/backup-manager.mjs` proporciona una interfaz completa para:

- Crear backups de archivos
- Renombrar archivos con prefijo underscore
- Mover archivos a directorio de backups
- Restaurar archivos desde backups
- Listar todos los backups disponibles

#### Uso:

```bash
# Crear backup con prefijo underscore
npm run backup src/pages/admin/productos/nuevo.astro --underscore

# Listar todos los backups
npm run backup:list

# Restaurar desde un backup
npm run backup:restore src/pages/admin/productos/_nuevo.astro
```

### 2. Limpieza Automática

El script `scripts/cleanup-backups.mjs` realiza automáticamente:

- Eliminación de backups antiguos (más de 7 días)
- Movimiento de archivos de respaldo dispersos al directorio centralizado
- Aplicación de prefijo underscore a archivos en `/src/pages/`

#### Uso:

```bash
# Ejecutar limpieza de backups
npm run cleanup-backups
```

## Flujo de Trabajo Recomendado

1. **Antes de modificaciones importantes**:
   ```bash
   npm run backup src/pages/ruta/archivo.astro --underscore
   ```

2. **Después de confirmar cambios**:
   ```bash
   npm run cleanup-backups
   ```

3. **Para restaurar un archivo**:
   ```bash
   npm run backup:list
   npm run backup:restore ruta/al/archivo/backup
   ```

## Integración con Git

Se ha configurado `.gitignore` para excluir archivos de respaldo:

```
# backup files
*.bak
*.bak.*
*.backup
*.old
*~
/backups/
```

## Solución de Problemas Comunes

### Advertencia: "Unsupported file type found"

**Problema**: Astro detecta un archivo con extensión no soportada.

**Solución**:
1. Renombrar el archivo con prefijo underscore:
   ```bash
   mv archivo.problematico _archivo.problematico
   ```
2. O moverlo al directorio de backups:
   ```bash
   npm run backup archivo.problematico --move
   ```

### Error: "Cannot find module"

**Problema**: Referencias a archivos que han sido movidos o renombrados.

**Solución**:
1. Verificar rutas de importación
2. Restaurar el archivo si es necesario:
   ```bash
   npm run backup:restore ruta/al/backup
   ```

## Automatización con Hooks

Para implementar una gestión automática de backups, considere añadir estos hooks a su flujo de trabajo:

1. **Pre-commit hook**: Ejecutar limpieza de backups antes de confirmar cambios
2. **Post-checkout hook**: Verificar y renombrar archivos problemáticos después de cambiar de rama

## Conclusión

Siguiendo estas prácticas, se evitarán advertencias relacionadas con archivos de respaldo en proyectos Astro, manteniendo un entorno de desarrollo limpio y organizado.
