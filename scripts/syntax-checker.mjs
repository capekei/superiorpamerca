import fs from 'fs';
import path from 'path';

/**
 * Verifica el balance de paréntesis en un archivo
 * @param {string} filePath - Ruta al archivo
 * @param {number} lineNumber - Número de línea donde se sospecha hay un error
 */
function checkParenthesisBalance(filePath, lineNumber) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extraer contexto alrededor de la línea problemática
    const startLine = Math.max(0, lineNumber - 10);
    const endLine = Math.min(lines.length, lineNumber + 5);
    const codeSegment = lines.slice(startLine, endLine).join('\n');
    
    console.log(`\nAnalizando líneas ${startLine+1}-${endLine} en ${filePath}:`);
    console.log('----------------------------------------');
    
    // Mostrar las líneas con números
    lines.slice(startLine, endLine).forEach((line, idx) => {
      const currentLineNumber = startLine + idx + 1;
      const marker = currentLineNumber === lineNumber ? '>' : ' ';
      console.log(`${marker} ${currentLineNumber}: ${line}`);
    });
    
    console.log('----------------------------------------');
    
    // Análisis de paréntesis
    const stack = [];
    const pairs = { '(': ')', '{': '}', '[': ']' };
    const openBrackets = Object.keys(pairs);
    let lineCounter = startLine;
    let charCounter = 0;
    
    // Para cada línea en el segmento
    for (let i = 0; i < lines.slice(startLine, endLine).length; i++) {
      const line = lines[startLine + i];
      lineCounter = startLine + i + 1;
      
      // Para cada carácter en la línea
      for (let j = 0; j < line.length; j++) {
        charCounter++;
        const char = line[j];
        
        if (openBrackets.includes(char)) {
          stack.push({ char, line: lineCounter, column: j + 1 });
        } else if (Object.values(pairs).includes(char)) {
          if (stack.length === 0) {
            console.log(`\n❌ Error: Paréntesis de cierre '${char}' sin apertura correspondiente en línea ${lineCounter}, columna ${j + 1}`);
          } else {
            const last = stack.pop();
            if (pairs[last.char] !== char) {
              console.log(`\n❌ Error: Paréntesis no coincidentes: '${last.char}' en línea ${last.line}, columna ${last.column} y '${char}' en línea ${lineCounter}, columna ${j + 1}`);
            }
          }
        }
        
        // Si estamos en la línea problemática y encontramos 'const', verificamos si hay paréntesis abiertos
        if (lineCounter === lineNumber && line.substring(j, j + 5) === 'const' && stack.length > 0) {
          console.log(`\n⚠️ Advertencia: 'const' encontrado en línea ${lineCounter}, columna ${j + 1} con paréntesis abiertos:`);
          stack.forEach(item => {
            console.log(`  - '${item.char}' abierto en línea ${item.line}, columna ${item.column}`);
          });
        }
      }
    }
    
    // Verificar si quedaron paréntesis sin cerrar
    if (stack.length > 0) {
      console.log('\n❌ Error: Paréntesis sin cerrar:');
      stack.forEach(item => {
        console.log(`  - '${item.char}' abierto en línea ${item.line}, columna ${item.column}`);
      });
      return false;
    } else {
      console.log('\n✅ Todos los paréntesis están correctamente balanceados en este segmento.');
      return true;
    }
  } catch (error) {
    console.error(`Error al analizar el archivo: ${error.message}`);
    return false;
  }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Uso: node syntax-checker.mjs <ruta-al-archivo> <número-de-línea>');
  process.exit(1);
}

const filePath = args[0];
const lineNumber = parseInt(args[1], 10);

if (isNaN(lineNumber)) {
  console.error('El número de línea debe ser un número válido');
  process.exit(1);
}

// Ejecutar el análisis
checkParenthesisBalance(filePath, lineNumber);
