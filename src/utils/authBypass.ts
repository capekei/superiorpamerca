// Función temporal para pruebas que siempre devuelve autenticado = true
export async function isAuthenticated(request: Request): Promise<boolean> {
  return true;
}
