# Directorio de Skills IA - MVP (Versión 1.0)

Este documento detalla el plan de implementación para la versión inicial (MVP) del directorio colaborativo de Skills, dejando la integración de IA automatizada para una futura versión (V2.0).

## ⚠️ User Review Required

> [!IMPORTANT]
> **Aclaración sobre el Backend (Node.js vs Supabase):** 
> Has mencionado **Node.js** y **Supabase** en el stack. Supabase incluye su propia API (PostgREST) que permite que React se conecte directamente a la base de datos sin necesidad de un backend intermedio en Node.js para operaciones CRUD básicas (leer y guardar Skills). 
> 
> **Propuesta:** Usar Node.js exclusivamente para los scripts de recolección de datos (web scraping de repositorios GitHub) y usar la conexión directa React -> Supabase para la aplicación web. Esto simplifica la arquitectura y acelera el desarrollo. ¿Estás de acuerdo con este enfoque?

## Stack Tecnológico y Diseño

*   **Frontend:** React (empaquetado con Vite para mayor velocidad).
*   **Estilos:** Tailwind CSS.
*   **Base de Datos y Autenticación:** Supabase.
*   **Scripts (Recolección):** Node.js.
*   **Sistema de Diseño (Apple Style):** 
    *   Fondos claros/blancos predominantes o grises muy sutiles (`#f5f5f7`).
    *   Tarjetas con esquinas redondeadas suaves y sombras difuminadas.
    *   Tipografía limpia sin serifas (tipo *Inter* o *San Francisco*).
    *   Efectos sutiles de translucidez (*glassmorphism* tipo macOS/iOS).
    *   Mucho espacio en blanco (negativo) para una lectura relajada.

## Proposed Changes

A continuación se detalla la estructura del proyecto y los componentes a desarrollar.

---

### Configuración del Proyecto y Backend

*   **Supabase:**
    *   Creación de proyecto en Supabase.
    *   Diseño de la tabla `skills` con campos: `id`, `name`, `description_es`, `original_url`, `install_command`, `category`, `status` (pending/approved), `created_at`.
    *   Configuración de Row Level Security (RLS) para que cualquier usuario pueda enviar (insertar) pero solo el admin pueda aprobar/modificar.
*   **Node.js (Scripts):**
    *   `scripts/fetch_github.js`: Script opcional para popular la base de datos inicial leyendo archivos `SKILL.md` de repositorios conocidos.

---

### Aplicación Web (React + Tailwind)

La estructura principal del frontend será una Single Page Application (SPA) dividida en componentes reutilizables.

#### Vistas Principales (Pages)
*   **Home (`/`):** La *landing page* principal. Contendrá el "Hero" (título principal y barra de búsqueda) y la cuadrícula de tarjetas de Skills aprobadas.
*   **Submit (`/submit`):** Formulario público y minimalista para que los usuarios peguen enlaces de GitHub y sugieran nuevas Skills.
*   **Admin Dashboard (`/admin`):** Ruta protegida con contraseña donde revisarás las Skills en estado "pending" para aprobarlas, editarlas o rechazarlas.

#### Componentes (Components)
*   `Navbar`: Menú superior translúcido (estilo Apple) con enlaces rápidos.
*   `SearchBar`: Barra de búsqueda grande, centrada y redondeada con iconos limpios.
*   `CategoryFilter`: Botones estilo "píldora" para filtrar (Ej. *Bases de Datos, Frontend, Testing*).
*   `SkillCard`: Tarjeta que muestra el nombre y resumen de la Skill.
*   `SkillModal`: Ventana emergente que se abre al hacer clic en una tarjeta, mostrando la descripción completa y el botón de **"Copiar Comando"**.

## Verification Plan

### Manual Verification
1.  **UI/UX:** Verificar que el diseño cumple con los estándares estéticos "Apple" en monitores y dispositivos móviles.
2.  **Flujo de Usuario:** Enviar una Skill falsa desde `/submit` y verificar que llega a la base de datos de Supabase en estado "pending".
3.  **Flujo de Admin:** Iniciar sesión en el dashboard de Supabase (o el `/admin`), cambiar el estado de la Skill a "approved" y verificar que aparece instantáneamente en la página de inicio.
4.  **Acción:** Probar el botón "Copiar Comando" para asegurar que el portapapeles recibe el formato correcto.
