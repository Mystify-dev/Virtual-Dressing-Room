# 👗 Virtual Fit AI - Fullstack Virtual Try-On

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Replicate](https://img.shields.io/badge/AI-IDM_VTON-black?style=for-the-badge)

Una aplicación web Full-Stack que revoluciona la experiencia de probarse ropa de manera virtual. Utiliza Inteligencia Artificial generativa para mapear prendas digitales sobre una fotografía base del usuario, calculando físicas de tela, iluminación y sombreado en tiempo real.

## ✨ Características Principales

* **Sistema CRUD Integrado:** Gestión completa de un armario digital con categorías específicas (Prendas Superiores, Inferiores, Vestidos, Calzado y Accesorios).
* **Motor de IA (IDM-VTON):** Integración con la API de Replicate para ejecutar modelos de difusión avanzados que adaptan la prenda al cuerpo del usuario respetando sus proporciones.
* **Pipeline Secuencial de Outfits:** Arquitectura de backend capaz de procesar conjuntos completos (Top + Bottom) encadenando peticiones a la IA para armar el look final sin perder contexto espacial.
* **Renderizado Híbrido:** Combinación de renderizado por IA para prendas de ropa y posicionamiento dinámico por CSS (Overlay) para accesorios y calzado, optimizando el consumo de recursos y costos de API.
* **Base de Datos en la Nube:** Conexión segura a una instancia de MySQL alojada en Oracle Cloud.

## 🛠️ Arquitectura y Tecnologías

El proyecto está dividido en dos microservicios principales:

1. **Frontend (`/armario-frontend`):**
    * Construido con **React** y **Vite**.
    * Estilizado con **Tailwind CSS** para una interfaz moderna, responsiva y de carga rápida.
    * Gestión de estados complejos para la visualización del "Carrito de Outfits".

2. **Backend (`/armario-backend`):**
    * Servidor **Node.js** con **Express**.
    * Manejo de archivos e imágenes locales usando **Multer**.
    * Comunicación segura con la base de datos **MySQL**.
    * Controlador de lógica de negocio para la orquestación del pipeline de Inteligencia Artificial.

## 🧠 Lógica del Pipeline de IA
El sistema no realiza un simple super
puesto de imágenes (sticker). Al generar un conjunto completo, el backend procesa primero la prenda superior, captura la salida Base64 generada, y alimenta esa nueva imagen como "modelo base" a una segunda instancia de la IA para aplicar la prenda inferior, asegurando que las capas de ropa interactúen correctamente.