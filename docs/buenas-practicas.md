# Guía de Buenas Prácticas para Prevenir Duplicidades

## Principios Generales

1. **DRY (Don't Repeat Yourself)**
   - Centraliza la lógica común en módulos reutilizables
   - Extrae funcionalidades repetidas a componentes y utilidades

2. **Configuración Centralizada**
   - Utiliza los archivos en `/src/config/` para todas las constantes y rutas
   - Nunca definas rutas o valores constantes en múltiples lugares

3. **Modularidad**
   - Crea componentes pequeños y específicos
   - Compón interfaces complejas a partir de componentes simples

4. **Consistencia**
   - Sigue las convenciones de nomenclatura establecidas
   - Mantén una estructura de directorios coherente

## Estructura de Archivos

1. **Componentes**
   - Ubica todos los componentes en `/src/components/`
   - Organiza por categoría: `/ui/`, `/layout/`, `/common/`
   - Usa PascalCase para nombres de componentes (ej: `ProductCard.astro`)

2. **Utilidades**
   - Coloca todas las utilidades en `/src/lib/`
   - Organiza por dominio: `/auth/`, `/files/`, `/helpers/`
   - Usa camelCase para nombres de archivos (ej: `imageUtils.ts`)

3. **Páginas**
   - Mantén la estructura de rutas clara en `/src/pages/`
   - Separa por secciones: `/admin/`, `/shop/`, `/api/`

4. **Recursos Estáticos**
   - Usa exclusivamente `/public/` para archivos estáticos
   - Nunca crees directorios duplicados en `/src/public/`

## Estilos

1. **Tailwind CSS**
   - Usa Tailwind CSS para todos los estilos
   - Evita mezclar SCSS, CSS vanilla y Tailwind
   - Extiende la configuración en `tailwind.config.js` en lugar de crear estilos personalizados

2. **Componentes Estilizados**
   - Crea componentes base reutilizables para elementos comunes (botones, tarjetas, etc.)
   - Mantén la consistencia visual usando las clases de utilidad de Tailwind

## Manejo de Archivos

1. **Rutas Centralizadas**
   - Usa siempre `PATHS` de `/src/config/paths.ts` para referencias a directorios
   - Nunca construyas rutas manualmente con `path.join()`

2. **Subida de Archivos**
   - Usa las utilidades en `/src/lib/files/` para todas las operaciones de archivos
   - Verifica siempre la existencia de directorios antes de escribir archivos

## Autenticación

1. **Sistema Unificado**
   - Usa siempre las funciones de `/src/lib/auth/` para la autenticación
   - Configura el modo de desarrollo con variables de entorno, no con archivos separados

## Prevención de Duplicidades

1. **Antes de Crear un Nuevo Componente**
   - Verifica si existe un componente similar que pueda ser adaptado
   - Considera crear un componente base con variantes en lugar de múltiples componentes similares

2. **Antes de Escribir una Nueva Función**
   - Busca en las utilidades existentes si ya existe una función similar
   - Extiende funciones existentes en lugar de crear nuevas

3. **Revisión de Código**
   - Realiza revisiones periódicas para identificar duplicidades
   - Refactoriza código duplicado cuando lo encuentres

## Convenciones de Nomenclatura

1. **Componentes**
   - PascalCase para nombres de archivos y componentes
   - Nombres descriptivos que indiquen su propósito
   - Sufijos para indicar variantes (ej: `ButtonPrimary`, `ButtonSecondary`)

2. **Utilidades**
   - camelCase para nombres de archivos y funciones
   - Prefijos para agrupar funcionalidades relacionadas (ej: `formatDate`, `formatCurrency`)

3. **APIs**
   - Usa nombres de recursos en plural para endpoints (ej: `/api/productos/`)
   - Sigue patrones RESTful para las operaciones CRUD

## Resolución de Problemas Comunes

1. **Componentes Duplicados**
   - Identifica las diferencias clave entre componentes similares
   - Crea un componente base con props para configurar las variaciones

2. **Lógica Duplicada**
   - Extrae la lógica común a funciones de utilidad
   - Usa composición para combinar funcionalidades

3. **Estilos Duplicados**
   - Crea clases de utilidad personalizadas en Tailwind para patrones repetidos
   - Usa componentes estilizados para UI consistente

## Herramientas de Auditoría

Ejecuta periódicamente estos comandos para identificar posibles duplicidades:

```bash
# Buscar archivos con nombres similares
find src -type f -name "*.ts" | sort

# Buscar directorios duplicados
find src -type d | grep -i "uploads"

# Buscar funciones con nombres similares
grep -r "function" --include="*.ts" src/
```

Recuerda que mantener un código limpio y bien organizado es una responsabilidad continua. Dedica tiempo regularmente a refactorizar y mejorar la estructura del proyecto.
