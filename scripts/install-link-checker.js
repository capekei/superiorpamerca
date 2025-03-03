/**
 * Script de instalación para el verificador de enlaces
 * 
 * Este script instala las dependencias necesarias para ejecutar el verificador de enlaces
 * y configura un hook de pre-commit para verificar enlaces antes de cada commit.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== Instalador del Verificador de Enlaces ====${colors.reset}\n`);

// Verificar si estamos en la raíz del proyecto
if (!fs.existsSync('package.json')) {
  console.error(`${colors.red}Error: Este script debe ejecutarse desde la raíz del proyecto${colors.reset}`);
  process.exit(1);
}

try {
  // Paso 1: Instalar dependencias
  console.log(`${colors.yellow}Instalando dependencias...${colors.reset}`);
  execSync('npm install --save-dev glob', { stdio: 'inherit' });
  
  // Paso 2: Crear directorio de scripts si no existe
  if (!fs.existsSync('scripts')) {
    console.log(`${colors.yellow}Creando directorio de scripts...${colors.reset}`);
    fs.mkdirSync('scripts');
  }
  
  // Paso 3: Verificar si el verificador de enlaces ya existe
  if (!fs.existsSync('scripts/link-checker.js')) {
    console.error(`${colors.red}Error: No se encontró el archivo scripts/link-checker.js${colors.reset}`);
    console.log(`${colors.yellow}Por favor, crea primero el archivo scripts/link-checker.js${colors.reset}`);
    process.exit(1);
  }
  
  // Paso 4: Agregar script al package.json
  console.log(`${colors.yellow}Actualizando package.json...${colors.reset}`);
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['check-links'] = 'node scripts/link-checker.js';
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  // Paso 5: Crear hook de pre-commit si git está inicializado
  if (fs.existsSync('.git')) {
    console.log(`${colors.yellow}Configurando hook de pre-commit...${colors.reset}`);
    
    const hooksDir = '.git/hooks';
    const preCommitPath = path.join(hooksDir, 'pre-commit');
    
    const preCommitScript = `#!/bin/sh
# Hook de pre-commit para verificar enlaces rotos
echo "🔍 Verificando enlaces rotos..."
node scripts/link-checker.js

# Si el verificador de enlaces falla, detener el commit
if [ $? -ne 0 ]; then
  echo "❌ Se encontraron enlaces rotos. Por favor, corrígelos antes de hacer commit."
  exit 1
fi

exit 0
`;
    
    fs.writeFileSync(preCommitPath, preCommitScript);
    fs.chmodSync(preCommitPath, '755'); // Hacer ejecutable
  }
  
  console.log(`\n${colors.green}${colors.bright}✅ Instalación completada con éxito${colors.reset}`);
  console.log(`\nPuedes ejecutar el verificador de enlaces con: ${colors.cyan}npm run check-links${colors.reset}`);
  
} catch (error) {
  console.error(`\n${colors.red}Error durante la instalación:${colors.reset}`, error.message);
  process.exit(1);
}
