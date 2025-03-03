#!/usr/bin/env node

/**
 * Backup Manager para Astro.js
 * 
 * Este script proporciona funcionalidades para gestionar archivos de respaldo
 * en proyectos Astro.js, siguiendo las mejores prácticas.
 * 
 * Funcionalidades:
 * - Crear copias de seguridad de archivos
 * - Renombrar archivos con prefijo underscore (_) para que Astro los ignore
 * - Mover archivos de respaldo a un directorio dedicado
 * - Restaurar archivos de respaldo
 * - Limpiar archivos de respaldo antiguos
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuración
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/productos');
const MAX_BACKUP_AGE_DAYS = 7; // Mantener backups por 7 días

// Asegurar que el directorio de backups existe
await fs.mkdir(BACKUP_DIR, { recursive: true });

// Función para crear una copia de seguridad de un archivo
async function createBackup(filePath, options = {}) {
  const { moveToBackupDir = false, addUnderscore = false } = options;
  
  try {
    // Verificar que el archivo existe
    await fs.access(filePath);
    
    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (moveToBackupDir) {
      // Mover a directorio de backups
      const backupPath = path.join(BACKUP_DIR, `${baseName}.${timestamp}`);
      await fs.copyFile(filePath, backupPath);
      console.log(`Backup creado en: ${backupPath}`);
      return backupPath;
    } else if (addUnderscore) {
      // Renombrar con prefijo underscore
      if (baseName.startsWith('_')) {
        console.log(`El archivo ya tiene prefijo underscore: ${filePath}`);
        return filePath;
      }
      
      const newPath = path.join(dirName, `_${baseName}`);
      await fs.rename(filePath, newPath);
      console.log(`Archivo renombrado: ${filePath} -> ${newPath}`);
      return newPath;
    } else {
      // Crear backup en el mismo directorio
      const backupPath = path.join(dirName, `${baseName}.bak.${timestamp}`);
      await fs.copyFile(filePath, backupPath);
      console.log(`Backup creado: ${backupPath}`);
      return backupPath;
    }
  } catch (error) {
    console.error(`Error al crear backup de ${filePath}:`, error.message);
    return null;
  }
}

// Función para restaurar un archivo de backup
async function restoreBackup(backupPath, options = {}) {
  const { force = false } = options;
  
  try {
    // Verificar que el backup existe
    await fs.access(backupPath);
    
    // Determinar la ruta original
    let originalPath;
    const baseName = path.basename(backupPath);
    
    if (backupPath.includes(BACKUP_DIR)) {
      // Si está en el directorio de backups, extraer el nombre original
      const originalName = baseName.split('.').slice(0, -1).join('.');
      // Preguntar al usuario dónde restaurar
      console.log(`Restaurando desde directorio de backups. Especifique la ruta completa de destino.`);
      return null;
    } else {
      // Si es un backup local con prefijo underscore
      if (baseName.startsWith('_')) {
        originalPath = path.join(path.dirname(backupPath), baseName.substring(1));
      } else {
        // Si es un backup local con extensión .bak
        originalPath = backupPath.replace(/\.bak\.[^.]+$/, '');
      }
    }
    
    // Verificar si el archivo original existe
    try {
      await fs.access(originalPath);
      if (!force) {
        console.log(`El archivo original ya existe: ${originalPath}. Use --force para sobrescribir.`);
        return null;
      }
    } catch (error) {
      // El archivo original no existe, podemos continuar
    }
    
    // Restaurar el archivo
    await fs.copyFile(backupPath, originalPath);
    console.log(`Archivo restaurado: ${backupPath} -> ${originalPath}`);
    return originalPath;
  } catch (error) {
    console.error(`Error al restaurar backup ${backupPath}:`, error.message);
    return null;
  }
}

// Función para listar backups
async function listBackups() {
  try {
    console.log('Backups en directorio dedicado:');
    const backups = await fs.readdir(BACKUP_DIR);
    
    if (backups.length === 0) {
      console.log('  No hay backups en el directorio dedicado.');
    } else {
      for (const backup of backups) {
        const stats = await fs.stat(path.join(BACKUP_DIR, backup));
        const date = stats.mtime.toISOString().split('T')[0];
        console.log(`  ${backup} (${date})`);
      }
    }
    
    console.log('\nBackups con prefijo underscore en src/pages:');
    const underscoreFiles = execSync(
      `find ${PROJECT_ROOT}/src/pages -type f -name "_*" | sort`,
      { encoding: 'utf8' }
    ).trim().split('\n');
    
    if (!underscoreFiles[0]) {
      console.log('  No hay archivos con prefijo underscore.');
    } else {
      for (const file of underscoreFiles) {
        if (file) {
          const relativePath = path.relative(PROJECT_ROOT, file);
          console.log(`  ${relativePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error al listar backups:', error.message);
  }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
Uso: node backup-manager.mjs <comando> [opciones]

Comandos:
  backup <archivo>       Crear una copia de seguridad del archivo
    --move               Mover al directorio de backups
    --underscore         Renombrar con prefijo underscore
  
  restore <backup>       Restaurar un archivo desde su backup
    --force              Sobrescribir el archivo original si existe
  
  list                   Listar todos los backups
  
  cleanup                Eliminar backups antiguos (más de ${MAX_BACKUP_AGE_DAYS} días)
  
Ejemplos:
  node backup-manager.mjs backup src/pages/admin/productos/nuevo.astro --underscore
  node backup-manager.mjs restore src/pages/admin/productos/_nuevo.astro
  node backup-manager.mjs list
  node backup-manager.mjs cleanup
  `);
  process.exit(0);
}

switch (command) {
  case 'backup':
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: Debe especificar un archivo para hacer backup');
      process.exit(1);
    }
    
    const moveToBackupDir = args.includes('--move');
    const addUnderscore = args.includes('--underscore');
    
    await createBackup(filePath, { moveToBackupDir, addUnderscore });
    break;
    
  case 'restore':
    const backupPath = args[1];
    if (!backupPath) {
      console.error('Error: Debe especificar un archivo de backup para restaurar');
      process.exit(1);
    }
    
    const force = args.includes('--force');
    await restoreBackup(backupPath, { force });
    break;
    
  case 'list':
    await listBackups();
    break;
    
  case 'cleanup':
    // Importar y ejecutar el script de limpieza
    const { default: cleanupBackups } = await import('./cleanup-backups.mjs');
    await cleanupBackups();
    break;
    
  default:
    console.error(`Comando desconocido: ${command}`);
    process.exit(1);
}
