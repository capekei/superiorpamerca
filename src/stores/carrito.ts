// src/stores/carrito.ts
// Store para gestionar el estado del carrito de compras
// Nota: En un proyecto real, instalaría nanostores con: npm install nanostores

interface ProductoCarrito {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
}

interface CarritoState {
  items: Record<string, ProductoCarrito>;
  total: number;
}

// Simulación básica de un store (en un proyecto real usaría nanostores)
class CarritoStore {
  private state: CarritoState = {
    items: {},
    total: 0
  };
  
  private listeners: Array<(state: CarritoState) => void> = [];
  
  // Obtener el estado actual
  get() {
    return { ...this.state };
  }
  
  // Suscribirse a cambios
  subscribe(callback: (state: CarritoState) => void) {
    this.listeners.push(callback);
    callback(this.state);
    
    // Devolver función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Notificar a todos los suscriptores
  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  // Calcular el total
  private calcularTotal() {
    return Object.values(this.state.items).reduce(
      (total, item) => total + (item.precio * item.cantidad),
      0
    );
  }
  
  // Agregar producto al carrito
  agregarProducto(producto: Omit<ProductoCarrito, 'cantidad'>, cantidad = 1) {
    const { id } = producto;
    const items = { ...this.state.items };
    
    if (items[id]) {
      // Si ya existe, incrementar cantidad
      items[id] = {
        ...items[id],
        cantidad: items[id].cantidad + cantidad
      };
    } else {
      // Si no existe, agregarlo
      items[id] = {
        ...producto,
        cantidad
      };
    }
    
    this.state = {
      items,
      total: this.calcularTotal()
    };
    
    this.notify();
    this.guardarEnLocalStorage();
  }
  
  // Actualizar cantidad de un producto
  actualizarCantidad(id: string, cantidad: number) {
    if (!this.state.items[id] || cantidad < 1) return;
    
    const items = { ...this.state.items };
    items[id] = {
      ...items[id],
      cantidad
    };
    
    this.state = {
      items,
      total: this.calcularTotal()
    };
    
    this.notify();
    this.guardarEnLocalStorage();
  }
  
  // Eliminar producto del carrito
  eliminarProducto(id: string) {
    if (!this.state.items[id]) return;
    
    const items = { ...this.state.items };
    delete items[id];
    
    this.state = {
      items,
      total: this.calcularTotal()
    };
    
    this.notify();
    this.guardarEnLocalStorage();
  }
  
  // Vaciar carrito
  vaciarCarrito() {
    this.state = {
      items: {},
      total: 0
    };
    
    this.notify();
    this.guardarEnLocalStorage();
  }
  
  // Guardar en localStorage
  private guardarEnLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('carrito', JSON.stringify(this.state));
    }
  }
  
  // Cargar desde localStorage
  cargarDeLocalStorage() {
    if (typeof window !== 'undefined') {
      const carritoGuardado = localStorage.getItem('carrito');
      
      if (carritoGuardado) {
        try {
          this.state = JSON.parse(carritoGuardado);
          this.notify();
        } catch (error) {
          console.error('Error al cargar carrito desde localStorage:', error);
        }
      }
    }
  }
}

// Exportar una instancia única
export const carrito = new CarritoStore();

// Inicializar carrito desde localStorage cuando se carga en el cliente
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    carrito.cargarDeLocalStorage();
  });
}
