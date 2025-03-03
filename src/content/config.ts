import { defineCollection, z } from 'astro:content';

// Definir el esquema para la colección de productos
const productosCollection = defineCollection({
  type: 'data', // Tipo de colección: data (JSON, YAML, etc.)
  schema: z.object({
    nombre: z.string(),
    precio: z.number(),
    descripcion: z.string().optional(),
    // Esquema para imágenes
    imagenes: z.array(
      z.object({
        url: z.string(),
        tipo: z.enum(['local', 'url']).default('local'),
        principal: z.boolean().default(false)
      })
    ).default([]),
    stock: z.number().default(0),
    categorias: z.array(z.string()).optional(),
    caracteristicas: z.array(z.string()).optional(),
    destacado: z.boolean().default(false),
  }),
});

// Exportar las colecciones
export const collections = {
  'productos': productosCollection,
};
