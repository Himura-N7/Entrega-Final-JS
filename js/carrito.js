// Clase para manejar el carrito de compras
class CarritoCompras {
    constructor() {
        this.items = [];
        this.cargarDesdeStorage();
    }

    // Agregar producto al carrito
    agregarProducto(producto, cantidad = 1) {
        try {
            // Verificar stock disponible
            if (!gestorProductos.verificarStock(producto.id, cantidad)) {
                throw new Error(`Stock insuficiente. Solo quedan ${producto.stock} unidades`);
            }

            const itemExistente = this.items.find(item => item.id === producto.id);
            
            if (itemExistente) {
                // Si ya existe, aumentar cantidad
                const nuevaCantidad = itemExistente.cantidad + cantidad;
                if (!gestorProductos.verificarStock(producto.id, nuevaCantidad)) {
                    throw new Error(`No puedes agregar más unidades. Stock disponible: ${producto.stock}`);
                }
                itemExistente.cantidad = nuevaCantidad;
            } else {
                // Si no existe, agregar nuevo item
                this.items.push({
                    ...producto,
                    cantidad: cantidad
                });
            }

            this.guardarEnStorage();
            this.actualizarContador();
            
            // Mostrar notificación de éxito
            this.mostrarNotificacion(`✅ ${producto.nombre} agregado al carrito`, 'success');
            
            return true;
        } catch (error) {
            this.mostrarNotificacion(`❌ ${error.message}`, 'error');
            return false;
        }
    }

    // Eliminar producto del carrito
    eliminarProducto(id) {
        const index = this.items.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            const producto = this.items[index];
            this.items.splice(index, 1);
            this.guardarEnStorage();
            this.actualizarContador();
            this.mostrarNotificacion(`🗑️ ${producto.nombre} eliminado del carrito`, 'info');
        }
    }

    // Actualizar cantidad de un producto
    actualizarCantidad(id, nuevaCantidad) {
        const item = this.items.find(item => item.id === parseInt(id));
        if (item) {
            if (nuevaCantidad <= 0) {
                this.eliminarProducto(id);
            } else {
                // Verificar stock disponible
                const producto = gestorProductos.obtenerProductoPorId(id);
                if (producto && nuevaCantidad <= producto.stock) {
                    item.cantidad = nuevaCantidad;
                    this.guardarEnStorage();
                    this.actualizarContador();
                } else {
                    this.mostrarNotificacion(`❌ Stock insuficiente. Máximo ${producto.stock} unidades`, 'error');
                }
            }
        }
    }

    // Vaciar carrito
    vaciarCarrito() {
        this.items = [];
        this.guardarEnStorage();
        this.actualizarContador();
        this.mostrarNotificacion('🧹 Carrito vaciado', 'info');
    }

    // Obtener total del carrito
    obtenerTotal() {
        return this.items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }

    // Obtener cantidad total de items
    obtenerCantidadTotal() {
        return this.items.reduce((total, item) => total + item.cantidad, 0);
    }

    // Verificar si el carrito está vacío
    estaVacio() {
        return this.items.length === 0;
    }

    // Guardar en localStorage
    guardarEnStorage() {
        try {
            localStorage.setItem('carritoOfficeStore', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error guardando carrito:', error);
        }
    }

    // Cargar desde localStorage
    cargarDesdeStorage() {
        try {
            const carritoGuardado = localStorage.getItem('carritoOfficeStore');
            if (carritoGuardado) {
                this.items = JSON.parse(carritoGuardado);
            }
        } catch (error) {
            console.error('Error cargando carrito:', error);
            this.items = [];
        }
    }

    // Actualizar contador en el header
    actualizarContador() {
        const contador = document.getElementById('contador-carrito');
        if (contador) {
            contador.textContent = this.obtenerCantidadTotal();
        }
    }

    // Mostrar notificación con Toastify
    mostrarNotificacion(mensaje, tipo = 'info') {
        const colores = {
            success: 'linear-gradient(to right, #00b09b, #96c93d)',
            error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
            info: 'linear-gradient(to right, #667eea, #764ba2)'
        };

        Toastify({
            text: mensaje,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: colores[tipo] || colores.info,
            },
            stopOnFocus: true
        }).showToast();
    }

    // Renderizar carrito en modal
    renderizarCarrito() {
        const contenido = document.getElementById('carrito-contenido');
        const total = document.getElementById('carrito-total');
        
        if (this.estaVacio()) {
            contenido.innerHTML = `
                <div class="carrito-vacio">
                    <div class="icono-vacio">🛒</div>
                    <h3>Tu carrito está vacío</h3>
                    <p>¡Agrega algunos productos para comenzar!</p>
                </div>
            `;
            total.innerHTML = '';
            return;
        }

        let html = '';
        this.items.forEach(item => {
            html += `
                <div class="carrito-item" data-id="${item.id}">
                    <div class="item-info">
                        <span class="item-emoji">${item.imagen}</span>
                        <div class="item-detalles">
                            <h4>${item.nombre}</h4>
                            <p>${item.tipo}</p>
                            <span class="item-precio">$${item.precio.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="item-controles">
                        <div class="cantidad-controles">
                            <button class="btn-cantidad" onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                            <span class="cantidad">${item.cantidad}</span>
                            <button class="btn-cantidad" onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                        </div>
                        <div class="item-subtotal">$${(item.precio * item.cantidad).toLocaleString()}</div>
                        <button class="btn-eliminar" onclick="carrito.eliminarProducto(${item.id})" title="Eliminar producto">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });

        contenido.innerHTML = html;
        total.innerHTML = `
            <div class="total-info">
                <div class="total-items">Total de productos: ${this.obtenerCantidadTotal()}</div>
                <div class="total-precio">Total: $${this.obtenerTotal().toLocaleString()}</div>
            </div>
        `;
    }

    // Finalizar compra
    async finalizarCompra() {
        if (this.estaVacio()) {
            this.mostrarNotificacion('❌ El carrito está vacío', 'error');
            return;
        }

        try {
            const resultado = await Swal.fire({
                title: '¿Confirmar compra?',
                html: `
                    <div class="resumen-compra">
                        <p><strong>Total de productos:</strong> ${this.obtenerCantidadTotal()}</p>
                        <p><strong>Total a pagar:</strong> $${this.obtenerTotal().toLocaleString()}</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, comprar',
                cancelButtonText: 'Cancelar'
            });

            if (resultado.isConfirmed) {
                // Simular procesamiento de compra
                await this.procesarCompra();
            }
        } catch (error) {
            console.error('Error en la compra:', error);
            this.mostrarNotificacion('❌ Error procesando la compra', 'error');
        }
    }

    // Simular procesamiento de compra
    async procesarCompra() {
        try {
            // Mostrar loading
            Swal.fire({
                title: 'Procesando compra...',
                html: 'Por favor espera mientras procesamos tu pedido',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Simular tiempo de procesamiento
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simular reducción de stock
            for (const item of this.items) {
                gestorProductos.reducirStock(item.id, item.cantidad);
            }

            // Generar número de pedido
            const numeroPedido = Math.floor(Math.random() * 1000000);

            // Vaciar carrito
            this.vaciarCarrito();

            // Mostrar confirmación
            await Swal.fire({
                title: '¡Compra exitosa! 🎉',
                html: `
                    <div class="compra-exitosa">
                        <p><strong>Número de pedido:</strong> #${numeroPedido}</p>
                        <p>¡Gracias por tu compra!</p>
                        <p>Recibirás un email con los detalles de tu pedido.</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Entendido'
            });

            // Cerrar modal del carrito
            document.getElementById('carrito-modal').classList.add('hidden');

        } catch (error) {
            console.error('Error procesando compra:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema procesando tu compra. Inténtalo nuevamente.',
                icon: 'error'
            });
        }
    }
}

// Instancia global del carrito
const carrito = new CarritoCompras();