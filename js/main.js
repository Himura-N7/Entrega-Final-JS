// Variables globales
let productosContador = {};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await inicializarApp();
    } catch (error) {
        console.error('Error inicializando aplicación:', error);
        mostrarError('Error cargando la aplicación. Usando datos de respaldo.');
    }
});

// Función principal de inicialización
async function inicializarApp() {
    mostrarCargando(true);
    
    try {
        // Cargar productos
        await gestorProductos.cargarProductos();
        
        // Configurar event listeners
        configurarEventListeners();
        
        // Renderizar productos iniciales (todos)
        renderizarProductos(gestorProductos.obtenerProductosFiltrados());
        
        // Actualizar contador del carrito
        carrito.actualizarContador();
        
        // Ocultar loading
        mostrarCargando(false);
        
        // Mensaje de bienvenida
        mostrarBienvenida();
        
    } catch (error) {
        mostrarCargando(false);
        throw error;
    }
}

// Configurar todos los event listeners
function configurarEventListeners() {
    // Navegación por categorías
    document.getElementById('btn-todos-productos').addEventListener('click', () => {
        cambiarCategoria('todos');
    });
    
    document.getElementById('btn-mostrar-papeleria').addEventListener('click', () => {
        cambiarCategoria('papeleria');
    });
    
    document.getElementById('btn-mostrar-tecnologia').addEventListener('click', () => {
        cambiarCategoria('tecnologia');
    });
    
    document.getElementById('btn-mostrar-mobiliario').addEventListener('click', () => {
        cambiarCategoria('mobiliario');
    });

    // Carrito
    document.getElementById('btn-carrito').addEventListener('click', abrirModalCarrito);
    document.getElementById('cerrar-modal').addEventListener('click', cerrarModalCarrito);
    
    // Filtros
    document.getElementById('buscar').addEventListener('input', (e) => {
        gestorProductos.buscarProductos(e.target.value);
        renderizarProductos(gestorProductos.obtenerProductosFiltrados());
    });
    
    document.getElementById('precio-max').addEventListener('input', (e) => {
        const valor = parseInt(e.target.value);
        document.getElementById('valor-precio').textContent = valor.toLocaleString();
        gestorProductos.filtrarPorPrecio(valor);
        renderizarProductos(gestorProductos.obtenerProductosFiltrados());
    });

    // Acciones del carrito
    document.getElementById('vaciar-carrito').addEventListener('click', () => {
        if (!carrito.estaVacio()) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Se eliminarán todos los productos del carrito',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, vaciar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    carrito.vaciarCarrito();
                    carrito.renderizarCarrito();
                }
            });
        }
    });
    
    document.getElementById('finalizar-compra').addEventListener('click', () => {
        carrito.finalizarCompra();
    });

    // Cerrar modal al hacer clic fuera
    document.getElementById('carrito-modal').addEventListener('click', (e) => {
        if (e.target.id === 'carrito-modal') {
            cerrarModalCarrito();
        }
    });

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('carrito-modal');
            if (!modal.classList.contains('hidden')) {
                cerrarModalCarrito();
            }
        }
    });

    // Verificar scroll periódicamente (fallback de seguridad)
    setInterval(() => {
        const modal = document.getElementById('carrito-modal');
        if (modal && modal.classList.contains('hidden')) {
            // Si el modal está cerrado pero el scroll está bloqueado, restaurarlo
            if (document.body.style.overflow === 'hidden') {
                document.body.style.overflow = 'auto';
            }
        }
    }, 1000);
}

// Cambiar categoría activa
function cambiarCategoria(categoria) {
    // Actualizar botones activos
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if (categoria === 'todos') {
        document.getElementById('btn-todos-productos').classList.add('active');
    } else {
        document.getElementById(`btn-mostrar-${categoria}`).classList.add('active');
    }
    
    // Filtrar y mostrar productos
    gestorProductos.filtrarPorCategoria(categoria);
    renderizarProductos(gestorProductos.obtenerProductosFiltrados());
}

// Renderizar productos en el DOM
function renderizarProductos(productos) {
    const contenedor = document.getElementById('productos-container');
    
    if (productos.length === 0) {
        contenedor.innerHTML = `
            <div class="no-productos">
                <div class="icono-no-productos">🔍</div>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }
    
    // Resetear contadores
    productosContador = {};
    
    const html = productos.map(producto => {
        productosContador[producto.id] = 0;
        return `
            <div class="producto-card" data-id="${producto.id}">
                <div class="producto-imagen">
                    <span class="emoji-producto">${producto.imagen}</span>
                    <div class="producto-stock">Stock: ${producto.stock}</div>
                </div>
                <div class="producto-info">
                    <h3 class="producto-nombre">${producto.nombre}</h3>
                    <p class="producto-tipo">${producto.tipo}</p>
                    <p class="producto-descripcion">${producto.descripcion}</p>
                    <div class="producto-precio">${producto.precio.toLocaleString()}</div>
                </div>
                <div class="producto-acciones">
                    <div class="cantidad-selector">
                        <button class="btn-cantidad btn-disminuir" data-id="${producto.id}">-</button>
                        <span class="cantidad-display" data-id="${producto.id}">0</span>
                        <button class="btn-cantidad btn-aumentar" data-id="${producto.id}">+</button>
                    </div>
                    <button class="btn-agregar ${producto.stock === 0 ? 'btn-agotado' : ''}" 
                            data-id="${producto.id}" 
                            ${producto.stock === 0 ? 'disabled' : ''}>
                        ${producto.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    contenedor.innerHTML = html;
    
    // Asignar event listeners a los productos
    asignarEventListenersProductos();
}

// Hacer la función global para que sea accesible desde carrito.js
window.renderizarProductos = renderizarProductos;

// Asignar event listeners a los elementos de productos
function asignarEventListenersProductos() {
    // Botones de cantidad
    document.querySelectorAll('.btn-disminuir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            cambiarCantidad(id, -1);
        });
    });
    
    document.querySelectorAll('.btn-aumentar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            cambiarCantidad(id, 1);
        });
    });
    
    // Botones agregar al carrito
    document.querySelectorAll('.btn-agregar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            agregarProductoAlCarrito(id);
        });
    });
}

// Cambiar cantidad en el selector
function cambiarCantidad(id, cambio) {
    const cantidadActual = productosContador[id] || 0;
    const nuevaCantidad = Math.max(0, cantidadActual + cambio);
    
    // Verificar límite de stock disponible
    const producto = gestorProductos.obtenerProductoPorId(id);
    if (producto) {
        // Calcular stock disponible (stock original - cantidad ya en carrito)
        const itemEnCarrito = carrito.items.find(item => item.id === producto.id);
        const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
        const stockDisponible = producto.stock - cantidadEnCarrito;
        
        if (nuevaCantidad <= stockDisponible) {
            productosContador[id] = nuevaCantidad;
            document.querySelector(`.cantidad-display[data-id="${id}"]`).textContent = nuevaCantidad;
        }
    }
}

// Agregar producto al carrito
function agregarProductoAlCarrito(id) {
    const cantidad = productosContador[id] || 0;
    
    if (cantidad === 0) {
        carrito.mostrarNotificacion('⚠️ Selecciona una cantidad primero', 'error');
        return;
    }
    
    const producto = gestorProductos.obtenerProductoPorId(id);
    if (producto) {
        const exito = carrito.agregarProducto(producto, cantidad);
        
        if (exito) {
            // Resetear contador
            productosContador[id] = 0;
            document.querySelector(`.cantidad-display[data-id="${id}"]`).textContent = '0';
            
            // Actualizar la visualización inmediatamente
            renderizarProductos(gestorProductos.obtenerProductosFiltrados());
        }
    }
}

// Abrir modal del carrito
function abrirModalCarrito() {
    carrito.renderizarCarrito();
    document.getElementById('carrito-modal').classList.remove('hidden');
    document.body.classList.add('no-scroll'); // Usar clase CSS
}

// Cerrar modal del carrito
function cerrarModalCarrito() {
    document.getElementById('carrito-modal').classList.add('hidden');
    document.body.classList.remove('no-scroll'); // Usar clase CSS
    // Forzar restauración del scroll
    document.body.style.overflow = 'auto';
}

// Función auxiliar para restaurar scroll de manera segura
function restaurarScroll() {
    document.body.classList.remove('no-scroll');
    document.body.style.overflow = 'auto';
    // Forzar reflow para asegurar que el cambio se aplique
    document.body.offsetHeight;
}

// Función para prevenir scroll
function prevenirScroll() {
    document.body.classList.add('no-scroll');
}

// Mostrar/ocultar indicador de carga
function mostrarCargando(mostrar) {
    const spinner = document.getElementById('loading-spinner');
    if (mostrar) {
        spinner.style.display = 'flex';
    } else {
        spinner.style.display = 'none';
    }
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    Swal.fire({
        title: 'Error',
        text: mensaje,
        icon: 'error',
        confirmButtonText: 'Entendido'
    });
}

// Mostrar mensaje de bienvenida
function mostrarBienvenida() {
    const mensajes = [
        '¡Bienvenido a OfficeStore! 🏢',
        '¿Listo para equipar tu oficina? 💼',
        '¡Encuentra todo lo que necesitas! 📎',
        '¡Ofertas especiales te esperan! 🎯'
    ];
    
    const mensajeAleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];
    
    setTimeout(() => {
        carrito.mostrarNotificacion(mensajeAleatorio, 'info');
    }, 1000);
}

// Manejo de errores globales
window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
});

// Manejo de errores de promesas no capturadas
window.addEventListener('unhandledrejection', (e) => {
    console.error('Promesa rechazada:', e.reason);
    e.preventDefault();
});