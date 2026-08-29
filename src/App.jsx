import { useState, useEffect } from 'react'

function App() {
    const [prendas, setPrendas] = useState([])
    const [nuevaPrenda, setNuevaPrenda] = useState({
        nombre_descriptivo: '',
        categoria_id: '1',
        color_principal: ''
    })

    const [archivoImagen, setArchivoImagen] = useState(null)
    const [cargandoIA, setCargandoIA] = useState(false)
    const [editandoId, setEditandoId] = useState(null)

    // ESTADOS: Modo Oscuro y Pestañas
    const [darkMode, setDarkMode] = useState(false)
    const [vistaActiva, setVistaActiva] = useState('armario') // 'dashboard', 'armario', 'probador'

    // SISTEMA DE OUTFIT
    const [imagenFinalIA, setImagenFinalIA] = useState(null)
    const [topSeleccionado, setTopSeleccionado] = useState(null)
    const [bottomSeleccionado, setBottomSeleccionado] = useState(null)
    const [zapatosActivos, setZapatosActivos] = useState(null)
    const [bolsaActiva, setBolsaActiva] = useState(null)

    // Efecto para Modo Oscuro en HTML
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const cargarPrendas = () => {
        fetch('http://localhost:3000/')
            .then(res => res.json())
            .then(data => setPrendas(data))
            .catch(err => console.error(err))
    }

    useEffect(() => { cargarPrendas() }, [])

    // Filtros de base de datos
    const prendasArmario = prendas.filter(p => !p.es_wishlist || p.es_wishlist === 0)
    const prendasWishlist = prendas.filter(p => p.es_wishlist === 1)

    const handleSubmit = (e) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('nombre_descriptivo', nuevaPrenda.nombre_descriptivo)
        formData.append('categoria_id', nuevaPrenda.categoria_id)
        formData.append('color_principal', nuevaPrenda.color_principal)

        // LÓGICA DINÁMICA: Si está en probador va a wishlist(1), si está en armario va directo(0)
        if (!editandoId) {
            const vaAWishlist = vistaActiva === 'probador' ? 1 : 0;
            formData.append('es_wishlist', vaAWishlist);
        }

        if (archivoImagen) formData.append('imagen', archivoImagen)

        const url = editandoId ? `http://localhost:3000/prendas/${editandoId}` : 'http://localhost:3000/prendas'
        const method = editandoId ? 'PUT' : 'POST'

        fetch(url, { method: method, body: formData })
            .then(res => res.json())
            .then(() => {
                cargarPrendas()
                cancelarEdicion()
            })
    }

    const eliminarPrenda = (id) => {
        if (window.confirm('¿Confirmas que quieres borrar/descartar esta prenda?')) {
            fetch(`http://localhost:3000/prendas/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (!res.ok) throw new Error('Error al borrar');
                    return res.json();
                })
                .then(() => {
                    cargarPrendas()
                    if (zapatosActivos?.id === id) setZapatosActivos(null)
                    if (bolsaActiva?.id === id) setBolsaActiva(null)
                    if (topSeleccionado?.id === id) setTopSeleccionado(null)
                    if (bottomSeleccionado?.id === id) setBottomSeleccionado(null)
                    if (editandoId === id) cancelarEdicion()
                })
                .catch(err => alert('No se pudo borrar.'))
        }
    }

    // BOTÓN DE COMPRA: Lo mueve de Wishlist a Armario
    const confirmarCompra = (id) => {
        fetch(`http://localhost:3000/prendas/${id}/comprar`, { method: 'PUT' })
            .then(res => res.json())
            .then(() => {
                cargarPrendas()
                setVistaActiva('armario') // La mandamos a ver su armario actualizado
            })
    }

    const iniciarEdicion = (prenda) => {
        setEditandoId(prenda.id)
        setNuevaPrenda({
            nombre_descriptivo: prenda.nombre_descriptivo,
            categoria_id: String(prenda.categoria_id),
            color_principal: prenda.color_principal || ''
        })
        setArchivoImagen(null)
        document.getElementById('input-foto').value = ''
    }

    const cancelarEdicion = () => {
        setEditandoId(null)
        setNuevaPrenda({ nombre_descriptivo: '', categoria_id: '1', color_principal: '' })
        setArchivoImagen(null)
        if (document.getElementById('input-foto')) document.getElementById('input-foto').value = ''
    }

    // LÓGICA DE OUTFITS
    const togglePrendaEnOutfit = (prenda) => {
        const catStr = String(prenda.categoria_id);
        if (catStr === '1') setTopSeleccionado(topSeleccionado?.id === prenda.id ? null : prenda);
        else if (catStr === '2') setBottomSeleccionado(bottomSeleccionado?.id === prenda.id ? null : prenda);
        else if (catStr === '3') {
            if (topSeleccionado?.categoria_id === 3) {
                setTopSeleccionado(null);
                setBottomSeleccionado(null);
            } else {
                setTopSeleccionado(prenda);
                setBottomSeleccionado(prenda);
            }
        }
        else if (catStr === '4') setZapatosActivos(zapatosActivos?.id === prenda.id ? null : prenda);
        else if (catStr === '5') setBolsaActiva(bolsaActiva?.id === prenda.id ? null : prenda);
    }

    const generarOutfitConIA = async () => {
        if (!topSeleccionado && !bottomSeleccionado) return alert("Elige ropa para que la IA diseñe el outfit.");
        setImagenFinalIA(null);
        setCargandoIA(true);

        try {
            const response = await fetch('http://localhost:3000/generar-outfit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    top_url: topSeleccionado?.imagen_url,
                    top_des: topSeleccionado?.nombre_descriptivo,
                    bottom_url: bottomSeleccionado?.imagen_url,
                    bottom_des: bottomSeleccionado?.nombre_descriptivo
                })
            });
            const data = await response.json();
            if (data?.imagen_generada) setImagenFinalIA(Array.isArray(data.imagen_generada) ? data.imagen_generada[0] : data.imagen_generada);
        } catch (error) {
            console.error(error);
        } finally {
            setCargandoIA(false);
        }
    }

    const limpiarProbador = () => {
        setImagenFinalIA(null); setZapatosActivos(null); setBolsaActiva(null); setTopSeleccionado(null); setBottomSeleccionado(null);
    }

    // ===============================================
    // COMPONENTES REUTILIZABLES (UI)
    // ===============================================

    // FORMULARIO DINÁMICO: Se adapta según la pestaña activa
    const renderFormulario = () => (
        <div className={`bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border transition-all mb-6 ${editandoId ? 'border-yellow-400 shadow-md' : 'border-gray-100 dark:border-gray-700'}`}>
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">
                {editandoId ? '✏️ Editando Prenda' : (vistaActiva === 'armario' ? '＋ Añadir al Armario Físico' : '＋ Subir Ropa de Internet')}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder={vistaActiva === 'armario' ? "Nombre (Ej. Blusa favorita)" : "Nombre (Ej. Blusa Shein)"} className="p-2 text-sm border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-pink-200" value={nuevaPrenda.nombre_descriptivo} onChange={e => setNuevaPrenda({...nuevaPrenda, nombre_descriptivo: e.target.value})} required/>
                <select className="p-2 text-sm border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-pink-200" value={nuevaPrenda.categoria_id} onChange={e => setNuevaPrenda({...nuevaPrenda, categoria_id: e.target.value})}>
                    <option value="1">Blusas</option>
                    <option value="2">Pantalones / Shorts / Faldas</option>
                    <option value="3">Vestidos</option>
                    <option value="4">Zapatos</option>
                    <option value="5">Bolsas / Accesorios</option>
                </select>
                <input type="text" placeholder="Color" className="p-2 text-sm border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-pink-200" value={nuevaPrenda.color_principal} onChange={e => setNuevaPrenda({...nuevaPrenda, color_principal: e.target.value})} required/>
                <input id="input-foto" type="file" accept="image/png, image/jpeg" className="p-1 text-sm border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg outline-pink-200 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" onChange={e => setArchivoImagen(e.target.files[0])}/>

                <div className="md:col-span-2 flex gap-2">
                    <button type="submit" className={`flex-1 text-white font-bold py-2 px-3 rounded-lg text-sm shadow-sm transition-colors ${editandoId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-pink-500 hover:bg-pink-600'}`}>
                        {editandoId ? 'Guardar Cambios' : (vistaActiva === 'armario' ? 'Guardar en Armario' : 'Añadir a Evaluación Temporal')}
                    </button>
                    {editandoId && <button type="button" onClick={cancelarEdicion} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 text-sm shadow-sm">Cancelar</button>}
                </div>
            </form>
        </div>
    );

    // GRID DE ROPA: Se adapta si es Tienda (Muestra Comprar) o Armario (Muestra Editar)
    const renderGridPrendas = (lista, esModoTienda = false) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-10">
            {lista.map(prenda => {
                const catStr = String(prenda.categoria_id);
                const estaEnOutfit =
                    (catStr === '1' && topSeleccionado?.id === prenda.id) ||
                    (catStr === '2' && bottomSeleccionado?.id === prenda.id) ||
                    (catStr === '3' && topSeleccionado?.id === prenda.id) ||
                    (catStr === '4' && zapatosActivos?.id === prenda.id) ||
                    (catStr === '5' && bolsaActiva?.id === prenda.id);

                return (
                    <div key={prenda.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border transition-all flex flex-col ${estaEnOutfit ? 'border-pink-500 shadow-lg scale-[1.02]' : 'border-gray-100 dark:border-gray-700'}`}>
                        <div className="h-40 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                            {estaEnOutfit && (
                                <div className="absolute top-2 right-2 bg-pink-500 text-white p-1.5 rounded-full z-10 shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            {prenda.imagen_url ? (
                                <img src={prenda.imagen_url} alt={prenda.nombre_descriptivo} className="w-full h-full object-contain p-2 transition-transform" />
                            ) : (
                                <span className="text-gray-400 text-xs">📷 Sin foto</span>
                            )}
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                            <span className="text-[10px] font-bold text-pink-400 dark:text-pink-500 uppercase">{prenda.categoria || 'Accesorio'}</span>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate mb-3">{prenda.nombre_descriptivo}</h4>

                            <div className="mt-auto pt-2 border-t border-gray-50 dark:border-gray-600 flex flex-col gap-2">
                                <button
                                    onClick={() => togglePrendaEnOutfit(prenda)}
                                    disabled={cargandoIA && ['1','2','3'].includes(catStr)}
                                    className={`w-full text-xs py-1.5 rounded-full transition-colors font-medium ${
                                        estaEnOutfit ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                    }`}>
                                    {estaEnOutfit ? 'Quitar del Probador' : 'Añadir al Probador'}
                                </button>

                                {esModoTienda ? (
                                    <div className="flex gap-1 mt-1">
                                        <button onClick={() => confirmarCompra(prenda.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold text-[11px] py-1.5 rounded transition">✅ Compré</button>
                                        <button onClick={() => eliminarPrenda(prenda.id)} className="flex-1 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-900/40 dark:text-red-400 font-bold text-[11px] py-1.5 rounded transition">🗑️ Descartar</button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center mt-1">
                                        <button onClick={() => iniciarEdicion(prenda)} className="text-gray-400 hover:text-yellow-500 text-xs font-bold px-2 py-1 rounded">✏️ Editar</button>
                                        <button onClick={() => eliminarPrenda(prenda.id)} className="text-gray-400 hover:text-red-500 text-xs font-bold px-2 py-1 rounded">✕ Borrar</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-pink-50 dark:bg-gray-900 transition-colors duration-300 p-6 font-sans text-gray-900 dark:text-gray-100">
            {/* Navegación Principal */}
            <nav className="max-w-7xl mx-auto flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl font-extrabold text-pink-500">Virtual Fit ✨</h1>
                <div className="flex gap-4 items-center mt-4 sm:mt-0 overflow-x-auto">
                    <button onClick={() => setVistaActiva('dashboard')} className={`font-medium px-4 py-2 rounded-full transition ${vistaActiva === 'dashboard' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Inspiración</button>
                    <button onClick={() => setVistaActiva('armario')} className={`font-medium px-4 py-2 rounded-full transition ${vistaActiva === 'armario' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Mi Armario</button>
                    <button onClick={() => setVistaActiva('probador')} className={`font-medium px-4 py-2 rounded-full transition ${vistaActiva === 'probador' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Tienda / Wishlist</button>
                    <button onClick={() => setDarkMode(!darkMode)} className="ml-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </nav>

            <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
                {/* LADO IZQUIERDO: PROBADOR FIJO */}
                <div className="w-full lg:w-2/5 lg:sticky lg:top-6 lg:h-[calc(100vh-120px)] bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold dark:text-white">📍 Probador IA</h2>
                        {(topSeleccionado || bottomSeleccionado || zapatosActivos || bolsaActiva) && (
                            <button onClick={limpiarProbador} className="text-xs text-pink-500 font-bold px-3 py-1 bg-pink-50 dark:bg-pink-900/30 rounded-full hover:bg-pink-100">🔄 Limpiar</button>
                        )}
                    </div>

                    <div className="relative w-full h-full bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        <img src={imagenFinalIA || "/modelo.jpg"} alt="Amairany Modelo" className="w-full h-full p-2 z-10" style={{ objectFit: 'contain' }} />

                        {bolsaActiva && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center items-center z-20">
                                <img src={bolsaActiva.imagen_url} alt="Bolsa" className="absolute top-[40%] right-[15%] w-[25%] object-contain drop-shadow-2xl" />
                            </div>
                        )}
                        {zapatosActivos && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center items-end pb-12 z-20">
                                <img src={zapatosActivos.imagen_url} alt="Zapatos" className="w-[45%] object-contain drop-shadow-2xl translate-y-8" />
                            </div>
                        )}
                        {cargandoIA && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                                <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                                <span className="font-bold text-pink-600 dark:text-pink-400">Diseñando...</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={generarOutfitConIA}
                        disabled={cargandoIA || (!topSeleccionado && !bottomSeleccionado)}
                        className="mt-4 w-full bg-gray-900 dark:bg-pink-600 text-white font-bold py-3 px-6 rounded-2xl hover:bg-pink-500 dark:hover:bg-pink-500 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 shadow-md">
                        ✨ {cargandoIA ? 'Generando imagen...' : 'Vestir con IA'}
                    </button>
                </div>

                {/* LADO DERECHO: PESTAÑAS DINÁMICAS */}
                <div className="w-full lg:w-3/5 space-y-6">

                    {vistaActiva === 'dashboard' && (
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
                            <h2 className="text-3xl font-bold mb-2">¡Hola Amairany! ✨</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">Aquí aparecerán tus combinaciones guardadas pronto.</p>
                            <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                <span className="text-gray-400">Outfits Recomendados en construcción...</span>
                            </div>
                        </section>
                    )}

                    {vistaActiva === 'armario' && (
                        <section className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-4 ml-2">👗 Tu Armario Físico</h2>
                            {renderFormulario()}
                            {renderGridPrendas(prendasArmario, false)}
                        </section>
                    )}

                    {vistaActiva === 'probador' && (
                        <section className="animate-fade-in space-y-6">
                            {renderFormulario()}
                            <h2 className="text-2xl font-bold mb-4 ml-2">🛒 En Evaluación Temporal</h2>
                            {renderGridPrendas(prendasWishlist, true)}
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App