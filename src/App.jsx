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

    // SISTEMA NUEVO DE OUTFIT (EL "CARRITO DE COMPRAS")
    const [imagenFinalIA, setImagenFinalIA] = useState(null)
    const [topSeleccionado, setTopSeleccionado] = useState(null) // ID 1
    const [bottomSeleccionado, setBottomSeleccionado] = useState(null) // ID 2

    // Accesorios (CSS Overlay)
    const [zapatosActivos, setZapatosActivos] = useState(null) // ID 4
    const [bolsaActiva, setBolsaActiva] = useState(null) // ID 5

    const cargarPrendas = () => {
        fetch('http://localhost:3000/')
            .then(res => res.json())
            .then(data => setPrendas(data))
            .catch(err => console.error(err))
    }

    useEffect(() => { cargarPrendas() }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('nombre_descriptivo', nuevaPrenda.nombre_descriptivo)
        formData.append('categoria_id', nuevaPrenda.categoria_id)
        formData.append('color_principal', nuevaPrenda.color_principal)
        if (archivoImagen) {
            formData.append('imagen', archivoImagen)
        }

        const url = editandoId
            ? `http://localhost:3000/prendas/${editandoId}`
            : 'http://localhost:3000/prendas';

        const method = editandoId ? 'PUT' : 'POST';

        fetch(url, { method: method, body: formData })
            .then(res => res.json())
            .then(() => {
                cargarPrendas()
                cancelarEdicion()
            })
    }

    const eliminarPrenda = (id) => {
        if (window.confirm('¿Segura que quieres borrar esta prenda?')) {
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

    const iniciarEdicion = (prenda) => {
        setEditandoId(prenda.id)
        setNuevaPrenda({
            nombre_descriptivo: prenda.nombre_descriptivo,
            categoria_id: String(prenda.categoria_id),
            color_principal: prenda.color_principal || ''
        })
        setArchivoImagen(null)
        document.getElementById('input-foto').value = ''
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelarEdicion = () => {
        setEditandoId(null)
        setNuevaPrenda({ nombre_descriptivo: '', categoria_id: '1', color_principal: '' })
        setArchivoImagen(null)
        document.getElementById('input-foto').value = ''
    }

    // ===============================================
    // LÓGICA DE OUTFITS (NUEVA)
    // ===============================================
    const togglePrendaEnOutfit = (prenda) => {
        const catStr = String(prenda.categoria_id);

        if (catStr === '1') { // Blusa
            setTopSeleccionado(topSeleccionado?.id === prenda.id ? null : prenda);
        } else if (catStr === '2') { // Pantalón
            setBottomSeleccionado(bottomSeleccionado?.id === prenda.id ? null : prenda);
        } else if (catStr === '3') { // Vestido (ocupa top y bottom en el probador)
            if (topSeleccionado?.categoria_id === 3) {
                setTopSeleccionado(null);
                setBottomSeleccionado(null);
            } else {
                setTopSeleccionado(prenda);
                setBottomSeleccionado(prenda);
            }
        } else if (catStr === '4') { // Zapatos (CSS)
            setZapatosActivos(zapatosActivos?.id === prenda.id ? null : prenda);
        } else if (catStr === '5') { // Bolsa (CSS)
            setBolsaActiva(bolsaActiva?.id === prenda.id ? null : prenda);
        }
    }

    const generarOutfitConIA = async () => {
        // Validación: Necesitamos al menos una prenda para la IA
        if (!topSeleccionado && !bottomSeleccionado) {
            alert("Elige una blusa, pantalón o vestido para que la IA diseñe el outfit.");
            return;
        }

        setImagenFinalIA(null);
        setCargandoIA(true);

        try {
            const response = await fetch('http://localhost:3000/generar-outfit', { // Nueva ruta del backend
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

            if (data && data.imagen_generada) {
                const urlReal = Array.isArray(data.imagen_generada)
                    ? data.imagen_generada[0]
                    : data.imagen_generada;
                setImagenFinalIA(urlReal);
            } else {
                alert("Uy, la IA no devolvió la imagen. Revisa la consola.");
            }
        } catch (error) {
            console.error("❌ Error en petición IA:", error);
            alert("Error al conectar con tu servidor de IA.");
        } finally {
            setCargandoIA(false);
        }
    }

    const limpiarProbador = () => {
        setImagenFinalIA(null);
        setZapatosActivos(null);
        setBolsaActiva(null);
        setTopSeleccionado(null);
        setBottomSeleccionado(null);
    }

    return (
        <div className="min-h-screen bg-pink-50 p-6 font-sans">
            <header className="mb-6 text-center border-b border-pink-100 pb-4 max-w-7xl mx-auto flex justify-between items-center px-4 gap-4">
                <div className="flex-1 flex gap-2">
                    {/* BOTÓN NUEVO: Generar Outfit */}
                    <button
                        onClick={generarOutfitConIA}
                        disabled={cargandoIA || (!topSeleccionado && !bottomSeleccionado)}
                        className="bg-gray-900 text-white font-bold py-2.5 px-6 rounded-full hover:bg-pink-500 transition-colors disabled:bg-gray-300 shadow-md text-sm flex items-center gap-2">
                        ✨ {cargandoIA ? 'Diseñando...' : 'Generar Outfit Completo (IA)'}
                    </button>
                    {(topSeleccionado || bottomSeleccionado || zapatosActivos || bolsaActiva) && (
                        <button onClick={limpiarProbador} className="bg-white border border-pink-200 text-pink-500 font-bold py-2.5 px-6 rounded-full hover:bg-pink-100 transition-colors text-sm shadow-sm">
                            🔄 Limpiar
                        </button>
                    )}
                </div>
                <div className="flex-1 text-center">
                    <h1 className="text-3xl font-extrabold text-pink-500">Virtual Fit de Amairany ✨</h1>
                    <p className="text-gray-500">Combina y diseña outfits completos al instante</p>
                </div>
                <div className="flex-1 flex justify-end"></div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">

                <div className="w-full lg:w-2/5 lg:sticky lg:top-6 lg:h-[calc(100vh-120px)] bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">📍 Probador IA</h2>
                    <div className="relative w-full h-full bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">

                        {imagenFinalIA ? (
                            <img src={imagenFinalIA} alt="Amairany con Outfit" className="absolute inset-0 w-full h-full object-contain p-2 drop-shadow-xl z-10" key={imagenFinalIA} />
                        ) : (
                            <img src="/modelo.jpg" alt="Amairany Modelo" className="absolute inset-0 w-full h-full object-contain p-2 z-10" />
                        )}

                        {bolsaActiva && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center items-center z-20">
                                <img src={bolsaActiva.imagen_url} alt="Bolsa" className="absolute top-[40%] right-[15%] w-[25%] object-contain drop-shadow-2xl transition-all duration-300" />
                            </div>
                        )}

                        {zapatosActivos && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center items-end pb-12 z-20">
                                <img src={zapatosActivos.imagen_url} alt="Zapatos" className="w-[45%] object-contain drop-shadow-2xl transition-all duration-300 translate-y-8" />
                            </div>
                        )}

                        {cargandoIA && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-30 transition-all">
                                <div className="w-14 h-14 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                                <span className="font-bold text-pink-600 animate-pulse text-center px-4">
                                    La IA está diseñando tu conjunto...<br/>
                                    <span className="text-xs font-normal text-gray-500 mt-2 block">Casi listo ✨</span>
                                </span>
                            </div>
                        )}

                    </div>
                </div>

                <div className="w-full lg:w-3/5 space-y-6">
                    <section className={`bg-white p-5 rounded-3xl shadow-sm border transition-all ${editandoId ? 'border-yellow-400 shadow-md' : 'border-gray-100'}`}>
                        <h3 className="font-bold text-gray-700 mb-3">
                            {editandoId ? '✏️ Editando Prenda' : '＋ Nueva Prenda'}
                        </h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input type="text" placeholder="Nombre (Ej. Falda mezclilla)" className="p-2 text-sm border rounded-lg outline-pink-200" value={nuevaPrenda.nombre_descriptivo} onChange={e => setNuevaPrenda({...nuevaPrenda, nombre_descriptivo: e.target.value})} required/>

                            <select className="p-2 text-sm border rounded-lg outline-pink-200" value={nuevaPrenda.categoria_id} onChange={e => setNuevaPrenda({...nuevaPrenda, categoria_id: e.target.value})}>
                                <option value="1">Blusas</option>
                                <option value="2">Pantalones / Shorts / Faldas</option>
                                <option value="3">Vestidos</option>
                                <option value="4">Zapatos</option>
                                <option value="5">Bolsas / Accesorios</option>
                            </select>

                            <input type="text" placeholder="Color" className="p-2 text-sm border rounded-lg outline-pink-200" value={nuevaPrenda.color_principal} onChange={e => setNuevaPrenda({...nuevaPrenda, color_principal: e.target.value})} required/>

                            <input
                                id="input-foto"
                                type="file"
                                accept="image/png, image/jpeg"
                                className="p-1 text-sm border rounded-lg outline-pink-200 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                                onChange={e => setArchivoImagen(e.target.files[0])}
                            />

                            <div className="md:col-span-2 flex gap-2">
                                <button type="submit" className={`flex-1 text-white font-bold py-2 px-3 rounded-lg text-sm shadow-sm transition-colors ${editandoId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-pink-500 hover:bg-pink-600'}`}>
                                    {editandoId ? 'Guardar Cambios' : 'Subir al Armario'}
                                </button>

                                {editandoId && (
                                    <button type="button" onClick={cancelarEdicion} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 text-sm shadow-sm transition-colors">
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-10">
                        {prendas.map(prenda => {
                            const catStr = String(prenda.categoria_id);
                            // Verificamos si esta prenda es parte del outfit seleccionado
                            const estaEnOutfit =
                                (catStr === '1' && topSeleccionado?.id === prenda.id) ||
                                (catStr === '2' && bottomSeleccionado?.id === prenda.id) ||
                                (catStr === '3' && topSeleccionado?.id === prenda.id) ||
                                (catStr === '4' && zapatosActivos?.id === prenda.id) ||
                                (catStr === '5' && bolsaActiva?.id === prenda.id);

                            return (
                                <div key={prenda.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all ${estaEnOutfit ? 'border-pink-500 shadow-lg scale-[1.02]' : 'border-gray-100'}`}>
                                    <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                                        {estaEnOutfit && (
                                            <div className="absolute top-2 right-2 bg-pink-500 text-white p-1.5 rounded-full z-10 shadow-md">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}

                                        {prenda.imagen_url ? (
                                            <img src={prenda.imagen_url} alt={prenda.nombre_descriptivo} className="w-full h-full object-contain p-2 drop-shadow-sm transition-transform" />
                                        ) : (
                                            <span className="text-gray-400 text-xs">📷 Sin foto</span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <span className="text-xs font-bold text-pink-400 uppercase">{prenda.categoria || 'Accesorio'}</span>
                                        <h4 className="font-bold text-gray-800 text-sm truncate">{prenda.nombre_descriptivo}</h4>

                                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">

                                            {/* EL BOTÓN AHORA ES "AGREGAR AL OUTFIT" */}
                                            <button
                                                onClick={() => togglePrendaEnOutfit(prenda)}
                                                disabled={cargandoIA && (catStr === '1' || catStr === '2' || catStr === '3')}
                                                className={`text-[11px] py-1.5 px-3 rounded-full transition-colors disabled:bg-gray-300 font-medium flex items-center gap-1 ${
                                                    estaEnOutfit
                                                        ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}>
                                                ➕ {estaEnOutfit ? 'Quitar' : (catStr === '4' || catStr === '5' ? 'Accesorio' : 'Añadir')}
                                            </button>

                                            <div className="flex gap-1">
                                                <button onClick={() => iniciarEdicion(prenda)} className="text-gray-400 hover:text-yellow-500 text-sm font-bold px-1.5 py-1 rounded hover:bg-yellow-50 transition-colors" title="Editar">
                                                    ✏️
                                                </button>
                                                <button onClick={() => eliminarPrenda(prenda.id)} className="text-gray-300 hover:text-red-500 text-sm font-bold px-1.5 py-1 rounded hover:bg-red-50 transition-colors" title="Borrar">
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )})}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
