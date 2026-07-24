import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const DEMO_SKILLS = [
  {
    id: 'demo-1',
    name: 'React',
    description: 'Biblioteca líder de JavaScript orientada a la creación de interfaces de usuario declarativas, eficientes y basadas en componentes reutilizables. Permite manejar el estado interno de la aplicación mediante Virtual DOM para ofrecer actualizaciones ultrarrápidas en pantalla sin recargas completas.',
    use_case: 'Esencial para desarrollar aplicaciones web de una sola página (SPA), paneles de control interactivos, aplicaciones SaaS y plataformas complejas donde la interfaz responde en tiempo real a los datos del usuario.',
    example_usage: `import { useState } from 'react'

export function ContadorInteractivo() {
  const [contador, setContador] = useState(0)

  return (
    <div className="p-4 flex flex-col gap-2">
      <p>Has hecho clic {contador} veces</p>
      <button 
        onClick={() => setContador(contador + 1)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Incrementar
      </button>
    </div>
  )
}`,
    category: 'Frontend',
    install_command: 'npx create-react-app my-app',
    language: 'JavaScript',
    stars: 221500,
    rating: 5,
    original_url: 'https://github.com/facebook/react',
    repo_owner: 'facebook',
    repo_name: 'react',
    last_updated: '23/07/2026',
    approved: true
  },
  {
    id: 'demo-2',
    name: 'NestJS',
    description: 'Framework progresivo de Node.js diseñado para construir aplicaciones del lado del servidor empresariales, modulares y altamente escalables. Utiliza TypeScript por defecto y combina conceptos de Programación Orientada a Objetos, Funcional y Reactiva.',
    use_case: 'Perfecto para equipos que necesitan construir arquitecturas backend robustas, microservicios REST o GraphQL, con inyección de dependencias estructurada al estilo de Angular o Spring Boot.',
    example_usage: `import { Controller, Get, Param } from '@nestjs/common';

@Controller('usuarios')
export class UsuariosController {
  @Get(':id')
  obtenerUsuario(@Param('id') id: string) {
    return { id, nombre: 'Gonzalo', rol: 'Administrador' };
  }
}`,
    category: 'Backend',
    install_command: 'npm i -g @nestjs/cli',
    language: 'TypeScript',
    stars: 67300,
    rating: 5,
    original_url: 'https://github.com/nestjs/nest',
    repo_owner: 'nestjs',
    repo_name: 'nest',
    last_updated: '22/07/2026',
    approved: true
  },
  {
    id: 'demo-3',
    name: 'PyTorch',
    description: 'Ecosistema de aprendizaje profundo open-source líder en la industria para cómputo de tensores con aceleración por GPU. Proporciona diferenciación automática (Autograd) y construcción dinámica de gráficos de procesamiento computacional.',
    use_case: 'Utilizado mundialmente por investigadores de IA y científicos de datos para entrenar modelos de Visión por Computadora, Procesamiento de Lenguaje Natural (LLMs) y Redes Generativas.',
    example_usage: `import torch
import torch.nn as nn

# Crear un tensor con seguimiento de gradientes
x = torch.tensor([3.0], requires_grad=True)
y = x**2 + 2*x + 5

# Calcular gradiente backward
y.backward()
print("Gradiente dy/dx en x=3:", x.grad.item())  # 2*(3) + 2 = 8.0`,
    category: 'AI/ML',
    install_command: 'pip install torch torchvision',
    language: 'Python',
    stars: 78200,
    rating: 5,
    original_url: 'https://github.com/pytorch/pytorch',
    repo_owner: 'pytorch',
    repo_name: 'pytorch',
    last_updated: '20/07/2026',
    approved: true
  },
  {
    id: 'demo-4',
    name: 'Tailwind CSS',
    description: 'Framework de CSS enfocado en clases de utilidad atómicas que permite construir interfaces personalizadas y responsivas sin salir del HTML o archivo de componentes, eliminando hojas de estilo gigantestas.',
    use_case: 'Ideal para crear sistemas de diseño altamente consistentes, prototipar rápidamente pantallas complejas y mantener un paquete CSS ultra pequeño gracias al purgado automático de clases no utilizadas.',
    example_usage: `<div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:max-w-2xl p-6">
  <div className="flex items-center gap-4">
    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
      PREMIUM
    </span>
    <h3 className="text-lg font-semibold text-gray-900">Diseño Moderno</h3>
  </div>
</div>`,
    category: 'Frontend',
    install_command: 'npm install -D tailwindcss',
    language: 'CSS',
    stars: 83500,
    rating: 5,
    original_url: 'https://github.com/tailwindlabs/tailwindcss',
    repo_owner: 'tailwindlabs',
    repo_name: 'tailwindcss',
    last_updated: '21/07/2026',
    approved: true
  },
  {
    id: 'demo-5',
    name: 'Supabase',
    description: 'Plataforma BaaS (Backend as a Service) de código abierto construida sobre PostgreSQL. Integra autenticación de usuarios, suscripciones a datos en tiempo real mediante WebSockets, almacenamiento de archivos y Edge Functions.',
    use_case: 'Alternativa perfecta a Firebase para desarrolladores que desean el poder completo de relaciones SQL, migraciones tipo Postgres y API auto-generada sin tener que configurar servidores.',
    example_usage: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://xyz.supabase.co', 'PUBLIC_ANON_KEY')

// Consultar habilidades aprobadas en tiempo real
const { data: skills, error } = await supabase
  .from('skills')
  .select('*')
  .eq('approved', true)
  .order('stars', { ascending: false })`,
    category: 'Database',
    install_command: 'npm install @supabase/supabase-js',
    language: 'TypeScript',
    stars: 72100,
    rating: 4,
    original_url: 'https://github.com/supabase/supabase',
    repo_owner: 'supabase',
    repo_name: 'supabase',
    last_updated: '23/07/2026',
    approved: true
  },
  {
    id: 'demo-6',
    name: 'FastAPI',
    description: 'Framework web de Python ultra rápido para construir APIs RESTful basado en Type Hints estándar de Python 3.8+ y Pydantic. Genera documentación interactiva automática en Swagger UI.',
    use_case: 'La herramienta estándar en la industria para servir modelos de Inteligencia Artificial, conectores de microservicios y endpoints de alta velocidad con soporte asíncrono nativo (async/await).',
    example_usage: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class SkillItem(BaseModel):
    nombre: str
    stars: int

@app.post("/skills/")
async def crear_skill(skill: SkillItem):
    return {"status": "creado", "data": skill}`,
    category: 'Backend',
    install_command: 'pip install fastapi[all]',
    language: 'Python',
    stars: 71400,
    rating: 5,
    original_url: 'https://github.com/fastapi/fastapi',
    repo_owner: 'fastapi',
    repo_name: 'fastapi',
    last_updated: '19/07/2026',
    approved: true
  }
];

export function useSkills() {
  const [skills, setSkills] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todas')

  // Fetch skills from Supabase
  const fetchSkills = async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('skills')
        .select('*')
        .eq('approved', true)
        .order('stars', { ascending: false })

      if (fetchError) throw fetchError
      
      if (!data || data.length === 0) {
        console.log('Base de datos vacía o no inicializada. Cargando demo data...');
        setSkills(DEMO_SKILLS);
      } else {
        setSkills(data);
        
        // Cargar las 3 recién agregadas basadas en la fecha de creación real
        const sortedByDate = [...data].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const absoluteRecent = sortedByDate.slice(0, 3);
        setRecentlyAdded(absoluteRecent);
      }
    } catch (err) {
      console.warn('Fallo al cargar base de datos Supabase, cargando demo data como fallback...', err)
      setError(err.message)
      setSkills(DEMO_SKILLS);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  // Filtered + searched skills
  const filteredSkills = useMemo(() => {
    let result = skills

    if (activeCategory && activeCategory !== 'Todas') {
      result = result.filter((s) => s.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.category?.toLowerCase().includes(query) ||
          s.language?.toLowerCase().includes(query)
      )
    }

    return result
  }, [skills, searchQuery, activeCategory])

  const addSkill = (newSkill) => {
    // Avoid duplicates in general list
    setSkills((prev) => {
      const exists = prev.some((s) => s.original_url === newSkill.original_url);
      if (exists) return prev;
      return [newSkill, ...prev];
    });

    // Add to recentlyAdded session state at the top
    setRecentlyAdded((prev) => {
      const exists = prev.some((s) => s.original_url === newSkill.original_url);
      if (exists) return prev;
      return [newSkill, ...prev].slice(0, 4); // Guardar máximo 4 en recientes
    });
  }

  const deleteSkill = async (skillId) => {
    // Remove from local state immediately
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    setRecentlyAdded((prev) => prev.filter((s) => s.id !== skillId));

    // Delete from Supabase if it's a persisted DB record
    if (typeof skillId === 'string' && !skillId.startsWith('demo-') && !skillId.startsWith('loc-') && !skillId.startsWith('sim-')) {
      try {
        const { error: deleteErr } = await supabase
          .from('skills')
          .delete()
          .eq('id', skillId);

        if (deleteErr) {
          console.warn('[Store Skills] Error al eliminar en Supabase:', deleteErr.message);
        } else {
          console.log('[Store Skills] Skill eliminada de Supabase:', skillId);
        }
      } catch (err) {
        console.warn('[Store Skills] Excepción al eliminar en Supabase:', err.message);
      }
    }
  }

  return {
    skills: filteredSkills,
    allSkills: skills,
    recentlyAdded,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    addSkill,
    deleteSkill,
    refetch: fetchSkills,
  }
}
