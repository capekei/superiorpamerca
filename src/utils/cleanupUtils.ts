import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCollection } from 'astro:content';
import { logAction } from './logger';

// Obtener la ruta base del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, '../content');
const backupDir = path.join(__dirname, '../backups');

// Patrones para identificar productos de prueba
const TEST_NAME_PATTERNS = [
  /ejemplo/i,
  /test/i,
  /prueba/i,
  /demo/i,
  /temporal/i,
  /placeholder/i,
  /muestra/i,
  /sample/i
];

const TEST_PRICE_VALUES = [
  0.00,
  1.00,
  9.99,
  99.99,
  999.99,
  123.45,
  1234.56
];

/**
 * Verifica si un producto parece ser un dato de prueba
 */
export function isTestProduct(product: any): { isTest: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Verificar nombre
  if (TEST_NAME_PATTERNS.some(pattern => pattern.test(product.data.nombre))) {
    reasons.push(`Nombre sospechoso: "${product.data.nombre}"`);
  }
  
  // Verificar precio
  if (TEST_PRICE_VALUES.includes(product.data.precio)) {
    reasons.push(`Precio sospechoso: $${product.data.precio.toFixed(2)}`);
  }
  
  // Verificar imágenes
  if (!product.data.imagenes || product.data.imagenes.length === 0) {
    reasons.push('Sin imágenes');
  } else {
    // Verificar si las imágenes contienen patrones de placeholder
    const hasPlaceholderImages = product.data.imagenes.some((img: string) => 
      img.includes('placeholder') || 
      img.includes('ejemplo') || 
      img.includes('test') ||
      img.includes('sample') ||
      img.includes('demo')
    );
    
    if (hasPlaceholderImages) {
      reasons.push('Contiene imágenes de placeholder');
    }
  }
  
  // Verificar descripción
  if (!product.data.descripcion || 
      product.data.descripcion.length < 20 ||
      TEST_NAME_PATTERNS.some(pattern => pattern.test(product.data.descripcion))) {
    reasons.push('Descripción sospechosa o muy corta');
  }
  
  return {
    isTest: reasons.length > 0,
    reasons
  };
}

/**
 * Crea una copia de seguridad de todos los productos
 */
export async function backupProducts(): Promise<string> {
  try {
    // Crear directorio de backup si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `productos_backup_${timestamp}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    // Obtener todos los productos
    const productos = await getCollection('productos');
    
    // Guardar backup
    fs.writeFileSync(
      backupFilePath, 
      JSON.stringify(productos, null, 2)
    );
    
    logAction('info', 'backup_creado', `Backup de productos creado: ${backupFileName}`);
    
    return backupFilePath;
  } catch (error) {
    console.error('Error al crear backup de productos:', error);
    logAction('error', 'backup_error', `Error al crear backup: ${error.message}`);
    throw error;
  }
}

/**
 * Identifica productos que parecen ser datos de prueba
 */
export async function identifyTestProducts(): Promise<Array<{ product: any; reasons: string[] }>> {
  try {
    const productos = await getCollection('productos');
    const testProducts = [];
    
    for (const product of productos) {
      const { isTest, reasons } = isTestProduct(product);
      if (isTest) {
        testProducts.push({ product, reasons });
      }
    }
    
    return testProducts;
  } catch (error) {
    console.error('Error al identificar productos de prueba:', error);
    logAction('error', 'identify_test_error', `Error al identificar productos de prueba: ${error.message}`);
    throw error;
  }
}

/**
 * Elimina un producto específico
 */
export async function removeProduct(productId: string): Promise<boolean> {
  try {
    const productPath = path.join(contentDir, 'productos', `${productId}.json`);
    
    if (!fs.existsSync(productPath)) {
      throw new Error(`El producto ${productId} no existe`);
    }
    
    fs.unlinkSync(productPath);
    logAction('info', 'producto_eliminado', `Producto eliminado: ${productId}`);
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar producto ${productId}:`, error);
    logAction('error', 'remove_product_error', `Error al eliminar producto ${productId}: ${error.message}`);
    throw error;
  }
}

/**
 * Realiza la limpieza de productos de prueba
 */
export async function cleanupTestProducts(productIdsToRemove: string[]): Promise<{ 
  success: boolean; 
  removed: string[]; 
  errors: Array<{ id: string; error: string }>; 
}> {
  // Crear backup primero
  await backupProducts();
  
  const removed: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];
  
  for (const productId of productIdsToRemove) {
    try {
      await removeProduct(productId);
      removed.push(productId);
    } catch (error) {
      errors.push({ id: productId, error: error.message });
    }
  }
  
  // Registrar resultado
  logAction('info', 'cleanup_completado', `Limpieza completada. Eliminados: ${removed.length}, Errores: ${errors.length}`);
  
  return {
    success: errors.length === 0,
    removed,
    errors
  };
}
