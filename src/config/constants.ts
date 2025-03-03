/**
 * Constantes globales para la aplicación
 * Centralizar aquí todos los valores constantes para evitar duplicidades
 */

// Información de la empresa
export const COMPANY = {
  NAME: 'Superior Pamerca',
  SLOGAN: 'Calidad superior en cada producto',
  CONTACT_EMAIL: 'info@superiorpamerca.com',
  PHONE: '+1 (555) 123-4567',
  ADDRESS: 'Avenida Principal #123, Ciudad',
  SOCIAL_MEDIA: {
    FACEBOOK: 'https://facebook.com/superiorpamerca',
    INSTAGRAM: 'https://instagram.com/superiorpamerca',
    TWITTER: 'https://twitter.com/superiorpamerca',
  }
};

// Configuración de autenticación
export const AUTH = {
  TOKEN_EXPIRY: 3600, // 1 hora en segundos
  COOKIE_NAME: 'auth_token',
  ROLES: {
    ADMIN: 'admin',
    EDITOR: 'editor',
    USER: 'user'
  }
};

// Configuración de productos
export const PRODUCTS = {
  DEFAULT_IMAGE: '/img/productos/placeholder.jpg',
  IMAGES_PER_PRODUCT: 5,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 48,
};

// Configuración de la tienda
export const SHOP = {
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
  TAX_RATE: 0.16, // 16%
  SHIPPING_COST: 15.00,
};

// Paleta de colores (según Tailwind)
export const COLORS = {
  PRIMARY: '#1E2A3C', // Azul grisáceo oscuro
  SECONDARY: '#EDEDED', // Gris claro
  ACCENT: '#D42C17', // Rojo
  TEXT: '#121212', // Negro suave
  TEXT_SECONDARY: '#6c7983', // Gris
  BACKGROUND: '#FFFFFF', // Blanco puro
};

// Configuración de API
export const API = {
  BASE_URL: '/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      ME: '/api/auth/me',
    },
    PRODUCTS: {
      LIST: '/api/productos',
      DETAIL: '/api/productos/:id',
      CREATE: '/api/productos',
      UPDATE: '/api/productos/:id',
      DELETE: '/api/productos/:id',
      UPLOAD: '/api/productos/upload',
    },
  },
};
