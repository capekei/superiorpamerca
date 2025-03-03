#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/productos');
const MAX_BACKUP_AGE_DAYS = 7; // Mantener backups por 7 días
const BACKUP_PATTERNS = [
  '**/*.bak',
  '**/*.bak.*',
  '**/*.backup',
  '**/*.old',
  '**/*~',
  '**/_*.astro',
  '**/_*.ts',
  '**/_*.js',
  '**/_*.tsx',
  '**/_*.jsx'
];

async function findBackupFiles(dir, patterns) {
  const backupFiles = [];
  
  async function scanDir(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // No escanear node_modules ni .git
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          await scanDir(fullPath);
        }
      } else if (entry.isFile()) {
        // Verificar si el archivo coincide con algún patrón de backup
        const isBackup = patterns.some(pattern => {
          if (pattern.startsWith('**/*')) {
            // Patrón de extensión o sufijo
            const suffix = pattern.slice(3);
            return entry.name.endsWith(suffix);
          }
          return false;
        });
        
        if (isBackup) {
          backupFiles.push(fullPath);
        }
      }
    }
  }
  
  await scanDir(dir);
  return backupFiles;
}

// Función para renombrar archivos con prefijo underscore
async function renameWithUnderscore(filePath) {
  const dirName = path.dirname(filePath);
  const baseName = path.basename(filePath);
  
  // Si ya tiene prefijo underscore, no hacer nada
  if (baseName.startsWith('_')) {
    return filePath;
  }
  
  const newPath = path.join(dirName, `_${baseName}`);
  await fs.rename(filePath, newPath);
  console.log(`Renombrado: ${baseName} -> _${baseName}`);
  return newPath;
}

async function cleanupBackups() {
  try {
    console.log('Iniciando limpieza de archivos de respaldo...');
    
    // Asegurar que el directorio de backups existe
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // 1. Limpiar directorio de backups
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const maxAge = MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000;
    
    console.log(`Revisando ${backupFiles.length} archivos en el directorio de backups...`);
    
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      
      // Eliminar archivos más antiguos que MAX_BACKUP_AGE_DAYS
      if (now - stats.mtime.getTime() > maxAge) {
        console.log(`Eliminando backup antiguo: ${file}`);
        await fs.unlink(filePath);
      }
    }
    
    // 2. Buscar y mover archivos de respaldo dispersos
    console.log('Buscando archivos de respaldo en el proyecto...');
    const dispersedBackups = await findBackupFiles(PROJECT_ROOT, BACKUP_PATTERNS);
    
    console.log(`Encontrados ${dispersedBackups.length} archivos de respaldo dispersos.`);
    
    for (const filePath of dispersedBackups) {
      // Ignorar archivos que ya están en el directorio de backups
      if (filePath.startsWith(BACKUP_DIR)) continue;
      
      const fileName = path.basename(filePath);
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Determinar si el archivo debe quedarse en su lugar con prefijo underscore
      // o moverse al directorio de backups
      const isInSrcPages = filePath.includes('/src/pages/');
      
      if (isInSrcPages) {
        // Para archivos en src/pages, aplicar prefijo underscore si no lo tienen
        try {
          if (!fileName.startsWith('_')) {
            await renameWithUnderscore(filePath);
          }
          console.log(`Archivo en src/pages renombrado con prefijo underscore: ${relativePath}`);
        } catch (err) {
          console.error(`Error al renombrar ${filePath}: ${err.message}`);
        }
      } else {
        // Para otros archivos, moverlos al directorio de backups
        const newFileName = `${fileName}.${timestamp}`;
        const destPath = path.join(BACKUP_DIR, newFileName);
        
        console.log(`Moviendo: ${relativePath} -> backups/productos/${newFileName}`);
        
        try {
          await fs.copyFile(filePath, destPath);
          await fs.unlink(filePath);
        } catch (err) {
          console.error(`Error al mover ${filePath}: ${err.message}`);
        }
      }
    }
    
    console.log('Limpieza de backups completada');
  } catch (error) {
    console.error('Error al limpiar backups:', error);
  }
}

// Ejecutar la limpieza
cleanupBackups();
