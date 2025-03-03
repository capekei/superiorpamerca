# Estructura Estandarizada de Proyecto Astro

```
/
├── public/                    # Archivos estáticos accesibles públicamente
│   ├── fonts/                 # Fuentes
│   ├── img/                   # Imágenes estáticas (logos, iconos)
│   └── uploads/               # Archivos subidos por usuarios
│       └── productos/         # Imágenes de productos
│
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── common/            # Componentes genéricos (botones, inputs, etc.)
│   │   ├── layout/            # Componentes de estructura (header, footer, etc.)
│   │   └── ui/                # Componentes de interfaz específicos
│   │       ├── admin/         # Componentes para el panel de administración
│   │       └── shop/          # Componentes para la tienda
│   │
│   ├── config/                # Configuración centralizada
│   │   ├── constants.ts       # Constantes globales
│   │   ├── paths.ts           # Rutas y directorios
│   │   └── theme.ts           # Configuración de tema y estilos
│   │
│   ├── content/               # Contenido estructurado (usando Content Collections)
│   │   └── productos/         # Colección de productos
│   │
│   ├── layouts/               # Layouts de página
│   │   ├── AdminLayout.astro  # Layout para admin
│   │   └── ShopLayout.astro   # Layout para tienda
│   │
│   ├── lib/                   # Bibliotecas y utilidades
│   │   ├── auth/              # Autenticación
│   │   ├── db/                # Acceso a datos
│   │   ├── files/             # Manejo de archivos
│   │   └── helpers/           # Funciones auxiliares
│   │
│   ├── pages/                 # Páginas de la aplicación
│   │   ├── admin/             # Páginas de administración
│   │   ├── api/               # Endpoints de API
│   │   └── shop/              # Páginas de tienda
│   │
│   └── stores/                # Estado global (usando Nanostores)
│
├── astro.config.mjs           # Configuración de Astro
├── tailwind.config.js         # Configuración de Tailwind CSS
└── tsconfig.json              # Configuración de TypeScript
```

## Convenciones de Nomenclatura

1. **Componentes**:
   - PascalCase para nombres de archivos y componentes
   - Sufijos descriptivos para tipos de componentes (ej: ProductCard, ProductForm)

2. **Utilidades**:
   - camelCase para nombres de archivos y funciones
   - Nombres descriptivos que indiquen su propósito

3. **API Endpoints**:
   - kebab-case para rutas de URL
   - Nombres de recursos en plural (ej: /api/productos)

4. **Directorios**:
   - kebab-case para nombres de directorios
   - Nombres en singular para categorías (ej: component/, layout/)
   - Nombres en plural para colecciones (ej: productos/, uploads/)
