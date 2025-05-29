// Clase para manejar productos
class GestorProductos {
    constructor() {
        this.productos = [];
        this.productosFiltrados = [];
        this.categoriaActual = 'todos';
        this.precioMaximo = 100000;
        this.terminoBusqueda = '';
    }

    // Cargar productos desde JSON
    async cargarProductos() {
        try {
            const response = await fetch('./data/productos.json');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            this.productos = data.productos;
            this.productosFiltrados = [...this.productos];
            return this.productos;
        } catch (error) {
            // Fallback con datos locales si falla la carga
            console.error('Error cargando productos:', error);
            this.cargarProductosLocal();
            throw error;
        }
    }

    // Datos de respaldo en caso de error
    cargarProductosLocal() {
        this.productos = [
            {
                id: 1,
                nombre: "Papel Bond A4",
                categoria: "papeleria",
                tipo: "Resma 500 hojas",
                precio: 6000,
                imagen: "📄",
                descripcion: "Papel bond de alta calidad para impresión y escritura",
                stock: 50
            },
            {
                id: 6,
                nombre: "Teclado Inalámbrico",
                categoria: "tecnologia",
                tipo: "Bluetooth ergonómico",
                precio: 8000,
                imagen: "⌨️",
                descripcion: "Teclado inalámbrico con diseño ergonómico",
                stock: 15
            },
            {
                id: 11,
                nombre: "Silla Escritorio",
                categoria: "mobiliario",
                tipo: "Ergonómica con respaldo",
                precio: 50000,
                imagen: "🪑",
                descripcion: "Silla ergonómica ajustable para oficina",
                stock: 8
            }
        ];
        this.productosFiltrados = [...this.productos];
    }

    // Filtrar productos por categoría
    filtrarPorCategoria(categoria) {
        this.categoriaActual = categoria;
        this.aplicarFiltros();
    }

    // Filtrar productos por precio
    filtrarPorPrecio(precioMax) {
        this.precioMaximo = precioMax;
        this.aplicarFiltros();
    }

    // Buscar productos por nombre
    buscarProductos(termino) {
        this.terminoBusqueda = termino.toLowerCase();
        this.aplicarFiltros();
    }

    // Aplicar todos los filtros
    aplicarFiltros() {
        this.productosFiltrados = this.productos.filter(producto => {
            const cumpleCategoria = this.categoriaActual === 'todos' || producto.categoria === this.categoriaActual;
            const cumplePrecio = producto.precio <= this.precioMaximo;
            const cumpleBusqueda = producto.nombre.toLowerCase().includes(this.terminoBusqueda);
            
            return cumpleCategoria && cumplePrecio && cumpleBusqueda;
        });
    }

    // Obtener productos filtrados
    obtenerProductosFiltrados() {
        return this.productosFiltrados;
    }

    // Obtener producto por ID
    obtenerProductoPorId(id) {
        return this.productos.find(producto => producto.id === parseInt(id));
    }

    // Obtener productos por categoría
    obtenerPorCategoria(categoria) {
        return this.productos.filter(producto => producto.categoria === categoria);
    }

    // Verificar stock disponible
    verificarStock(id, cantidad) {
        const producto = this.obtenerProductoPorId(id);
        return producto && producto.stock >= cantidad;
    }

    // Reducir stock (simulación)
    reducirStock(id, cantidad) {
        const producto = this.obtenerProductoPorId(id);
        if (producto && producto.stock >= cantidad) {
            producto.stock -= cantidad;
            return true;
        }
        return false;
    }
}

// Instancia global del gestor
const gestorProductos = new GestorProductos();