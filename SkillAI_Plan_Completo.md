# 🎯 SkillAI - Plan Completo del Proyecto
> Directorio Colaborativo de Skills para Agentes IA  
> Enfocado en la Comunidad Hispana de Desarrolladores

---

## 📋 Resumen Ejecutivo

**SkillAI** es un "App Store" de Skills para Agentes de Inteligencia Artificial, diseñado específicamente para eliminar la barrera del idioma para desarrolladores hispanohablantes. Las skills son evaluadas automáticamente por IA antes de ser publicadas, garantizando calidad y relevancia.

---

## 🎓 Contexto Académico

- **Tipo:** Proyecto Académico con visión de escalabilidad real
- **Entrega:** Martes (próxima semana)
- **Presentación:** Video demostración + App web en vivo
- **Evaluadores:** Profesores que validarán el sistema en tiempo real

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | React + Vite + Tailwind CSS | Interfaz de usuario responsiva y premium |
| Backend | Supabase Edge Functions (Deno) | Evaluación IA serverless |
| Base de Datos | Supabase (PostgreSQL) | Almacenamiento persistente + RLS |
| IA Evaluadora | Groq API (Llama 3.3 70B) | Evaluación y curación automática |
| Datos Externos | GitHub API | Extracción de metadatos y README |
| Control de Versiones | GitHub | Repositorio del código |
| Deploy Frontend | Vercel | Hosting + CI/CD desde GitHub |
| Deploy Backend | Supabase Edge Functions | Runtime Deno integrado |

---

## 🔑 Credenciales y Configuración

```
GITHUB REPO:       glucena1918-tech/store_skills
GITHUB URL:        https://github.com/glucena1918-tech/store_skills
PRODUCCION URL:    https://store-skills.vercel.app
SUPABASE URL:      https://tlhbpzwzqmcrutwxomqy.supabase.co
SUPABASE REGIÓN:   East US
GROQ API:          Groq Cloud (Llama 3.3 70B Versatile)
NODE VERSION:      v22.18.0
NPM VERSION:       11.6.3
```

> ⚠️ Las API keys van SOLO en el archivo `.env` local. Nunca en GitHub.

---

## 🤖 Sistema de Evaluación IA (Core del Proyecto)

### Criterios de Aprobación (Dual)
```
CRITERIO 1: GitHub Stars > 10,001
CRITERIO 2: Rating > 3 estrellas

LÓGICA:
IF stars > 10001 AND rating > 3:
    APROBADO → Se publica en el directorio
ELSE:
    RECHAZADO → Se descarta con motivo
```

### ¿Cómo Evalúa la IA?
1. Usuario ingresa URL de GitHub
2. Sistema descarga README via GitHub API
3. Extrae: stars, forks, lenguaje, última actualización, licencia
4. Envía datos a Groq (Llama 3.3 70B) con prompt estructurado de alta precisión
5. La IA retorna JSON con evaluación completa incluyendo pros, contras y recomendación
6. Sistema guarda en Supabase si es aprobado (o muestra dictamen holístico si es rechazado)
7. Aparece en el directorio automáticamente con actualización optimista del estado React

### Categorías (Dinámicas - IA las Deduce)
La IA asigna automáticamente la categoría según el contenido del README:
- Frontend
- Backend
- DevOps
- Data Science
- Testing
- Database
- Security
- AI / ML
- API & Integration
- Mobile
- CLI Tools

> **Ventaja:** Si aparece una categoría nueva, la IA la crea automáticamente. No hay categorías hardcodeadas.

### Prompt del Sistema IA
```
Eres un curador de Skills para desarrolladores hispanohablantes.
Analiza este repositorio y responde SOLO con JSON válido.

CRITERIOS DE APROBACIÓN:
- GitHub Stars: debe tener más de 10,000
- Debe ser herramienta, librería o framework útil
- README debe ser claro y descriptivo

RESPONDE CON ESTE JSON:
{
  "name": "nombre de la skill",
  "description": "descripción en español (150-250 palabras)",
  "use_case": "cuándo y para quién usarla (50-100 palabras)",
  "example_usage": "ejemplo práctico de código",
  "category": "categoría deducida automáticamente",
  "install_command": "comando de instalación principal",
  "language": "lenguaje principal",
  "license": "MIT / Apache-2.0 / etc.",
  "maintenance_status": "Activo | Mantenimiento | Inactivo",
  "risk_level": "Bajo | Medio | Alto",
  "agent_prompt": "Instrucción de Sistema para Agentes IA",
  "agent_reasoning_trace": ["Paso 1...", "Paso 2...", "Paso 3...", "Paso 4..."],
  "pros": ["Punto fuerte 1", "Punto fuerte 2"],
  "cons": ["Punto a considerar 1", "Punto a considerar 2"],
  "agent_recommendation": "Recomendación cualitativa",
  "approved": true/false,
  "reason": "motivo si es rechazado"
}
```

---

## 🗄️ Base de Datos (Supabase)

### Tabla: `skills`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | TEXT | Nombre de la skill |
| description | TEXT | Descripción en español |
| use_case | TEXT | Cuándo usarla |
| category | TEXT | Categoría (dinámica) |
| install_command | TEXT | Comando de instalación |
| language | TEXT | Lenguaje principal |
| stars | INTEGER | GitHub stars al momento de evaluación |
| original_url | TEXT | URL del repositorio original |
| approved | BOOLEAN | true = aprobada, false = rechazada |
| reason | TEXT | Motivo de rechazo (si aplica) |
| license | TEXT | Licencia (MIT, Apache-2.0, etc.) |
| maintenance_status | TEXT | Estado del mantenimiento (Activo/Mantenimiento/Inactivo) |
| risk_level | TEXT | Nivel de riesgo (Bajo/Medio/Alto) |
| agent_prompt | TEXT | Prompt de integración para agente de IA |
| agent_reasoning_trace | TEXT[] | Traza de razonamiento/dictamen de evaluación |
| created_at | TIMESTAMP | Fecha de evaluación |

### Configuración RLS (Row Level Security)
- **Lectura:** Pública (cualquier usuario puede ver skills aprobadas)
- **Escritura:** Solo via `service_role` key desde Edge Functions o cliente admin
- **Eliminación:** Permitida desde Edge Function y frontend admin
- **Actualización:** Permitida desde Edge Function con `WITH CHECK (true)`

---

## 📁 Estructura del Proyecto

```
hackathon_big_school/
│
├── .gitignore
├── .env                              ← Credenciales (NO subir a GitHub)
├── .env.example                      ← Plantilla de variables de entorno
├── Skill_Hackathon.md                ← Ficha técnica del hackathon
├── SkillAI_Plan_Completo.md          ← Plan maestro del proyecto
├── package.json
├── vite.config.js
├── tailwind.config.js
│
├── src/
│   ├── App.jsx                       ← Componente raíz + orquestador principal
│   ├── index.css                     ← CSS global + design tokens Apple-style
│   ├── main.jsx                      ← Entry point de React
│   ├── components/
│   │   ├── Navbar.jsx                ← Barra superior glassmorphism
│   │   ├── Hero.jsx                  ← Hero section + Stats Ribbon + Búsqueda + Ctrl+K
│   │   ├── FilterBar.jsx             ← Filtros: categoría, rating, orden, stars
│   │   ├── SkillCard.jsx             ← Tarjeta de cada skill (con auditoría y badges)
│   │   ├── SkillModal.jsx            ← Modal con detalle completo + pros/contras
│   │   ├── SkillGrid.jsx             ← Grid responsivo de cards
│   │   ├── AddSkillForm.jsx          ← Formulario de evaluación + bypass stars
│   │   ├── ConfirmModal.jsx          ← Confirmación de eliminación doble factor
│   │   └── Toast.jsx                 ← Notificaciones flotantes
│   ├── services/
│   │   ├── supabase.js               ← Cliente Supabase (anon + service_role)
│   │   └── skillService.js           ← CRUD completo: fetch, save, update, delete
│   └── utils/
│       └── format.js                 ← formatNumberLatino, formatStarsK
│
└── supabase/
    ├── setup.sql                     ← Esquema de tabla + políticas RLS
    └── functions/
        └── evaluate-skill/
            └── index.ts                  ← Edge Function (Deno) para evaluación IA
```

---

## 🎨 Diseño (Apple Style)

### Paleta de Colores
```css
--bg-primary:    #ffffff    /* Fondo principal */
--bg-secondary:  #f5f5f7    /* Fondo secciones */
--text-primary:  #1d1d1d    /* Texto principal */
--text-secondary:#666666    /* Texto secundario */
--accent:        #0071e3    /* Azul Apple */
--success:       #34c759    /* Verde - Aprobado */
--error:         #ff3b30    /* Rojo - Rechazado */
--border:        #e0e0e0    /* Bordes suaves */
```

### Tipografía
```css
Font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif
Headlines:   32px, weight 600
Subheading:  20px, weight 600
Body:        16px, weight 400
Caption:     14px, weight 400
```

### Cards (Skill Cards)
```css
background:    #ffffff
border-radius: 12px
box-shadow:    0 2px 8px rgba(0,0,0,0.08)
hover-shadow:  0 8px 24px rgba(0,0,0,0.12)
transition:    all 0.3s ease
```

---

## 🖥️ Pantallas de la Aplicación

### 1. Landing Page (Home `/`)
- **Hero Section:** Título grande + barra de búsqueda central
- **Featured Skills:** 6 skills trending destacadas
- **Categorías:** Pills clickeables para filtrar
- **Grid Principal:** Todas las skills aprobadas

### 2. Sistema de Filtros
- 🔍 Búsqueda por nombre o descripción
- 📁 Filtro por categoría (dinámico)
- ⭐ Filtro por rating (3+, 4+, 5 estrellas)
- 📊 Filtro por stars (10k+, 50k+, 100k+)
- 🔃 Ordenamiento: Trending / Nuevas / Top Rated / Más Stars

### 3. Skill Card
Cada tarjeta muestra:
- Nombre de la skill
- Rating visual (⭐⭐⭐⭐⭐)
- Número de GitHub stars
- Descripción breve en español (2 líneas)
- Tags de categoría (pills)
- Botones: `Ver Detalles` + `Copiar Comando`

### 4. Modal de Detalle
Al hacer click en una card:
- Descripción completa en español
- Sección "¿Cuándo usarla?"
- Ejemplo de uso / código práctico
- Cuadro tripartito de auditoría: Licencia • Mantenimiento • Riesgo
- **Puntos Fuertes (Pros)** y **Puntos a Considerar (Contras)** con chips
- **Recomendación Sugerida** por la IA
- Comando de instalación (con botón copiar)
- Lenguaje principal
- Última actualización
- Link directo a GitHub
- **Prompt de Integración para tu Agente IA** (copiable con un clic)
- **Traza de Razonamiento** desplegable (4 pasos del dictamen del Agente)
- Botón **"Actualizar con IA"** para re-evaluación en tiempo real

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check del servidor |
| POST | `/api/skills/evaluate` | Evalúa una URL de GitHub |
| GET | `/api/skills` | Retorna todas las skills aprobadas |
| GET | `/api/skills/:id` | Retorna una skill por ID |

### Ejemplo: POST `/api/skills/evaluate`
```json
// Request
{
  "url": "https://github.com/vuejs/vue"
}

// Response (Aprobada)
{
  "success": true,
  "approved": true,
  "skill": {
    "name": "Vue.js",
    "description": "Framework progresivo de JavaScript...",
    "category": "Frontend",
    "stars": 207000,
    "install_command": "npm install vue"
  }
}

// Response (Rechazada)
{
  "success": true,
  "approved": false,
  "reason": "Repositorio tiene 8,500 stars (mínimo requerido: 10,001)"
}
```

---

## 📊 MVP - Datos de Demostración

### Skills Aprobadas (15-20)
URLs sugeridas para evaluación inicial:

**Frontend:**
1. https://github.com/vuejs/vue
2. https://github.com/facebook/react
3. https://github.com/angular/angular
4. https://github.com/sveltejs/svelte
5. https://github.com/vercel/next.js

**Backend:**
6. https://github.com/expressjs/express
7. https://github.com/django/django
8. https://github.com/pallets/flask
9. https://github.com/nestjs/nest
10. https://github.com/rails/rails

**Data Science:**
11. https://github.com/pandas-dev/pandas
12. https://github.com/scikit-learn/scikit-learn
13. https://github.com/numpy/numpy

**DevOps:**
14. https://github.com/kubernetes/kubernetes
15. https://github.com/grafana/grafana

**AI/ML:**
16. https://github.com/tensorflow/tensorflow
17. https://github.com/pytorch/pytorch

**Database:**
18. https://github.com/redis/redis
19. https://github.com/mongodb/mongo
20. https://github.com/prometheus/prometheus

### Casos de Rechazo (4-5 para demostración)
Buscar repos con:
- Stars entre 5,000 - 9,999 (falla criterio 1)
- Stars altos pero rating < 3 (falla criterio 2)
- README incompleto o vacío

---

## 🚀 Roadmap (Versiones)

### V0 - MVP Académico (COMPLETADO ✅)
- [x] Definición del proyecto
- [x] Stack tecnológico definido
- [x] Diseño Apple-style implementado
- [x] Backend: GitHub API + Groq (Llama 3.3 70B) + Supabase (Híbrido Edge Function + Fallback local)
- [x] Frontend: Landing + Filtros + Cards + Modal (con Auditoría, Prompt, Pros/Contras, Protocolo de Seguridad)
- [x] Hero Section premium: Stats Ribbon + Ctrl+K + Mesh Glow
- [x] Formato numérico latino (separador de miles con punto)
- [x] 6 skills evaluadas y funcionando con datos reales en Supabase
- [x] Evaluación holística agéntica con dictamen cualitativo
- [x] Protocolo de bloqueo crítico por riesgo de seguridad
- [x] Deploy completo en Vercel (CI/CD desde GitHub master)
- [x] Base de datos Supabase activa y conectada
- [x] Documentación actualizada
- [ ] Video demostración

### V1 - Post Entrega (Monitoreo)
- [ ] Cron job semanal (revisa stars actualizadas)
- [ ] Auto-elimina skills que bajan de 10k stars
- [ ] Notificaciones de cambios
- [ ] Dashboard de administrador

### V2 - Escalabilidad (Futuro)
- [ ] Web scraping automático de nuevos repos
- [ ] Sistema de sugerencias de usuarios
- [ ] Rating de comunidad (likes propios)
- [ ] Integración Ollama/Gemma (modelo local privado)
- [ ] Multi-idioma (portugués, francés)

### V3 - Monetización (Futuro)
- [ ] Ads no intrusivos (Google AdSense)
- [ ] Plan Premium (sin ads, acceso anticipado)
- [ ] API pública para terceros
- [ ] Skills verificadas por expertos (badge especial)

---

## 🚨 Manejo de Errores

| Situación | Respuesta del Sistema |
|-----------|----------------------|
| URL inválida (no es GitHub) | "URL inválida. Solo se aceptan repositorios de GitHub" |
| Repo privado o eliminado | "Repositorio no accesible (privado o eliminado)" |
| Stars insuficientes | "Rechazado: X stars (mínimo requerido: 10,001)" |
| Rating insuficiente | "Rechazado: rating X (mínimo requerido: 3 estrellas)" |
| README vacío | "Rechazado: README insuficiente para evaluar" |
| Gemini API caída | "IA no disponible. Intenta en 5 minutos" |
| GitHub API rate limit | "Límite de consultas alcanzado. Intenta en 1 hora" |

---

## 📦 Dependencias del Proyecto

### Backend (Node.js)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "@supabase/supabase-js": "^2.38.0",
    "@google/generative-ai": "^0.1.3",
    "cors": "^2.8.5"
  }
}
```

### Frontend (React)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## 📝 Variables de Entorno (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://tlhbpzwzqmcrutwxomqy.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Groq (Motor de IA)
VITE_GROQ_API_KEY=tu_groq_api_key_aqui

# GitHub (opcional pero recomendado para más requests)
GITHUB_TOKEN=tu_github_token_aqui
```

---

## 🎬 Plan de Presentación (Martes)

### Slides Sugeridas (8-10)
1. **Portada:** SkillAI - Logo + Tagline
2. **El Problema:** Skills dispersas, en inglés, difíciles de encontrar
3. **La Solución:** Directorio curado por IA en español
4. **Arquitectura:** Diagrama técnico del sistema
5. **Demo en Vivo:** Landing page + búsqueda + filtros
6. **Evaluación IA:** Demostración de aprobación en tiempo real
7. **Casos de Rechazo:** 4-5 ejemplos con motivos claros
8. **Resultados:** 15-20 skills evaluadas, métricas
9. **Escalabilidad:** Roadmap V1 → V2 → V3
10. **Q&A:** Preguntas

### Checklist Pre-Presentación
- [ ] App corriendo en Vercel (link disponible)
- [ ] Video de respaldo grabado (3 minutos)
- [ ] 15-20 skills en BD y visibles en app
- [ ] 4-5 casos de rechazo documentados con screenshots
- [ ] Código subido a GitHub (limpio y comentado)
- [ ] README del repo explicando el proyecto
- [ ] Slides listas

---

## 💡 Diferenciadores del Proyecto

1. **IA Real:** No es un directorio manual, la IA evalúa automáticamente
2. **Criterios Objetivos:** Stars + Rating = sistema determinístico y auditable
3. **En Español:** Primera barrera eliminada para hispanos
4. **Categorías Dinámicas:** La IA categoriza sin límites predefinidos
5. **Fricción Cero:** "Copiar comando" con un click
6. **Escalable:** Arquitectura lista para V2 con monitoreo automático

---

## 👨‍💻 Autor

- **Nombre:** Gonzalo Lucena
- **GitHub:** https://github.com/glucena1918-tech
- **Proyecto:** SkillAI v1.0
- **Institución:** BIG SCHOOL - Curso IA
- **Producción:** https://store-skills.vercel.app

---

*Documento generado como plan de referencia para el desarrollo de SkillAI*  
*Última actualización: Agosto 2026*
