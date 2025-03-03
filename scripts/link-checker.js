/**
 * Link Checker para Superior Pamerca Admin Panel
 * 
 * Este script analiza el código fuente para encontrar enlaces internos y verificar si las rutas existen.
 * Ayuda a identificar enlaces rotos (404) en el panel de administración.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const config = {
  // Directorios a escanear
  scanDirs: [
    'src/pages/admin',
    'src/components',
    'src/layouts'
  ],
  // Extensiones de archivos a analizar
  fileExtensions: ['.astro', '.tsx', '.jsx', '.ts', '.js'],
  // Patrones de enlaces a buscar (regex)
  linkPatterns: [
    /href=["'](\/admin\/[^"']+)["']/g,
    /window\.location\.href\s*=\s*["'](\/admin\/[^"']+)["']/g,
    /Astro\.redirect\(["'](\/admin\/[^"']+)["']\)/g
  ],
  // Ignorar estas rutas (no se verificarán)
  ignorePaths: [
    '/admin/login'
  ]
};

// Almacenar todos los enlaces encontrados: { source: 'archivo.astro', link: '/admin/ruta', line: 23 }
const foundLinks = [];

// Almacenar todas las rutas de páginas existentes
const existingPages = [];

// Función principal
async function checkLinks() {
  console.log('🔍 Iniciando verificación de enlaces...');
  
  // 1. Encontrar todas las páginas existentes
  findExistingPages();
  
  // 2. Escanear archivos para encontrar enlaces
  await scanFilesForLinks();
  
  // 3. Verificar enlaces
  const brokenLinks = verifyLinks();
  
  // 4. Mostrar resultados
  displayResults(brokenLinks);
}

// Encontrar todas las páginas existentes en el proyecto
function findExistingPages() {
  console.log('📄 Buscando páginas existentes...');
  
  // Buscar archivos en src/pages
  const pageFiles = globSync('src/pages/**/*.{astro,tsx,jsx}');
  
  pageFiles.forEach(file => {
    // Convertir ruta de archivo a ruta web
    let webPath = file
      .replace('src/pages', '')
      .replace(/\.(astro|tsx|jsx)$/, '')
      .replace(/\/index$/, '/');
    
    // Manejar rutas dinámicas [param]
    webPath = webPath.replace(/\[([^\]]+)\]/g, ':$1');
    
    existingPages.push(webPath);
  });
  
  console.log(`✅ Encontradas ${existingPages.length} páginas.`);
}

// Escanear archivos para encontrar enlaces
async function scanFilesForLinks() {
  console.log('🔎 Escaneando archivos para encontrar enlaces...');
  
  // Para cada directorio configurado
  for (const dir of config.scanDirs) {
    const pattern = `${dir}/**/*{${config.fileExtensions.join(',')}}`;
    const files = globSync(pattern);
    
    for (const file of files) {
      await analyzeFile(file);
    }
  }
  
  console.log(`✅ Encontrados ${foundLinks.length} enlaces en total.`);
}

// Analizar un archivo para encontrar enlaces
async function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Buscar enlaces usando los patrones configurados
      for (const pattern of config.linkPatterns) {
        pattern.lastIndex = 0; // Resetear el regex
        let match;
        
        while ((match = pattern.exec(line)) !== null) {
          const link = match[1];
          
          // Ignorar enlaces en la lista de ignorados
          if (!config.ignorePaths.includes(link)) {
            foundLinks.push({
              source: filePath,
              link: link,
              line: lineNumber
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error al analizar ${filePath}:`, error.message);
  }
}

// Verificar si los enlaces encontrados apuntan a páginas existentes
function verifyLinks() {
  console.log('🧪 Verificando enlaces...');
  
  const brokenLinks = [];
  
  for (const linkInfo of foundLinks) {
    let linkPath = linkInfo.link;
    
    // Manejar enlaces dinámicos para comparación
    const dynamicLinkPath = linkPath.replace(/\/[^\/]+$/, '/:id');
    
    // Verificar si la página existe (directa o como ruta dinámica)
    const pageExists = existingPages.some(page => 
      page === linkPath || page === dynamicLinkPath
    );
    
    if (!pageExists) {
      brokenLinks.push(linkInfo);
    }
  }
  
  return brokenLinks;
}

// Mostrar resultados
function displayResults(brokenLinks) {
  console.log('\n📊 RESULTADOS DE LA VERIFICACIÓN DE ENLACES');
  console.log('==========================================');
  console.log(`Total de enlaces analizados: ${foundLinks.length}`);
  console.log(`Enlaces rotos encontrados: ${brokenLinks.length}`);
  
  if (brokenLinks.length > 0) {
    console.log('\n❌ ENLACES ROTOS DETECTADOS:');
    console.log('---------------------------');
    
    brokenLinks.forEach((link, index) => {
      console.log(`${index + 1}. Enlace: ${link.link}`);
      console.log(`   Archivo: ${link.source}`);
      console.log(`   Línea: ${link.line}`);
      console.log('   Posible solución: Crear la página correspondiente o actualizar el enlace');
      console.log('---------------------------');
    });
    
    console.log('\n🛠️ RECOMENDACIONES:');
    console.log('1. Crear las páginas faltantes para estos enlaces');
    console.log('2. Actualizar los enlaces para que apunten a páginas existentes');
    console.log('3. Implementar redirecciones para rutas que han cambiado');
  } else {
    console.log('\n✅ ¡No se encontraron enlaces rotos!');
  }
}

// Ejecutar la verificación
checkLinks().catch(error => {
  console.error('Error durante la verificación:', error);
});
