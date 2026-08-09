import { supabase } from '../lib/supabase'

export function useEvaluate() {
  // Helper: Envolver un fetch con timeout para evitar cuelgues
  const fetchWithTimeout = (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  const evaluate = async (url, bypassMinStars = false) => {
    console.log('[Store Skills] Iniciando evaluación para:', url, 'bypassMinStars:', bypassMinStars);
    
    try {
      // 1. Intentar Edge Function con timeout de 8 segundos
      const edgePromise = supabase.functions.invoke('evaluate-skill', {
        body: { url, bypassMinStars },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Edge Function timeout')), 8000)
      );
      
      const { data, error } = await Promise.race([edgePromise, timeoutPromise]);

      if (!error && data) {
        console.log('[Store Skills] Evaluación exitosa mediante Edge Function.');
        return data;
      }
      
      console.warn('[Store Skills] Edge Function no disponible. Ejecutando evaluación directa...');
    } catch (e) {
      console.warn('[Store Skills] Edge Function inaccesible. Ejecutando evaluación directa...', e.message);
    }

    // 2. Evaluación directa desde el Frontend (GitHub API + IA API)
    return await evaluateLocally(url, bypassMinStars);
  }

  const evaluateLocally = async (url, bypassMinStars = false) => {
    // ── Validar formato de URL ────────────────────────────
    const match = url.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
    if (!match) {
      throw new Error('URL inválida. Solo se aceptan repositorios de GitHub.');
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, '');

    // ── 1. Fetch metadata de GitHub API (timeout 10s) ────
    console.log(`[Store Skills] Consultando GitHub API para ${owner}/${repoName}...`);
    let repoRes;
    try {
      repoRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repoName}`,
        {},
        10000
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('GitHub API no respondió a tiempo. Intenta de nuevo más tarde.');
      }
      throw new Error(`No se pudo conectar con GitHub: ${err.message}`);
    }
    
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return {
          approved: false,
          reason: 'Repositorio no encontrado. Puede ser privado o haber sido eliminado.',
        };
      }
      if (repoRes.status === 403) {
        throw new Error('Límite de peticiones de GitHub excedido (60/hora). Espera unos minutos e intenta de nuevo.');
      }
      throw new Error(`Error al consultar GitHub (HTTP ${repoRes.status}). Intenta de nuevo.`);
    }
    
    const repoData = await repoRes.json();
    console.log(`[Store Skills] GitHub respondió: ${repoData.stargazers_count} estrellas`);

    const stars = repoData.stargazers_count;
    const forks = repoData.forks_count;
    const language = repoData.language || 'Desconocido';
    const updatedAt = repoData.updated_at
      ? new Date(repoData.updated_at).toLocaleDateString('es-ES')
      : 'Desconocido';

    // ── 2. Validar estrellas mínimas (Removido el bloqueo temprano para evaluación holística) ──
    // Se procesarán los pros y cons de todos los repositorios sin importar las estrellas.

    // ── 3. Descargar README (timeout 8s, no bloquea si falla) ────
    let readmeContent = '';
    try {
      const readmeRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repoName}/readme`,
        { headers: { Accept: 'application/vnd.github.raw' } },
        8000
      );
      if (readmeRes.ok) {
        readmeContent = await readmeRes.text();
        readmeContent = readmeContent.substring(0, 3000);
      }
    } catch {
      readmeContent = '(README no disponible)';
    }

    // ── 4. Prompt compartido para todos los proveedores de IA ──
    const aiPrompt = `Eres un curador senior, evangelista técnico y auditor de seguridad de herramientas para desarrolladores.
Analiza minuciosamente el repositorio de GitHub y su README. Genera un análisis profundo, didáctico y extremadamente práctico para un desarrollador hispanohablante.
Además, realiza una AUDITORÍA DE SALUD Y SEGURIDAD del repositorio.

DATOS DEL REPOSITORIO:
- Nombre: ${repoName}
- Owner: ${owner}
- Stars: ${stars.toLocaleString()}
- Forks: ${forks.toLocaleString()}
- Lenguaje: ${language}
- Licencia detectada por GitHub: ${repoData.license?.spdx_id || 'No detectada'}
- Última actualización: ${updatedAt}
- Fecha ISO última actualización: ${repoData.updated_at || 'Desconocida'}
- README (primeros 3000 caracteres):
${readmeContent}

AUDITORÍA DE SEGURIDAD — INSTRUCCIONES:
1. LICENCIA: Identifica la licencia de código abierto del proyecto (MIT, Apache-2.0, GPL-3.0, BSD, ISC, etc.). Si no se detecta, indica "No especificada".
2. MANTENIMIENTO: Evalúa si el proyecto está "Activo" (actualizado en los últimos 6 meses), "Mantenimiento" (actualizado entre 6-18 meses) o "Inactivo" (más de 18 meses sin actualización).
3. RIESGO DE INTEGRACIÓN: Evalúa el nivel de riesgo/complejidad al integrar esta herramienta como "Bajo" (plug & play, pocas dependencias), "Medio" (requiere configuración moderada) o "Alto" (setup complejo, muchas dependencias, breaking changes frecuentes).

REGLAS OBLIGATORIAS DE COHERENCIA EN EVALUACIÓN:
1. Los elementos incluidos en el array "pros" y en el array "cons" deben ser estrictamente MUTUAMENTE EXCLUYENTES y no pueden contradecirse entre sí.
2. Si evalúas que el repositorio tiene "comunidad activa" o "mantenimiento regular" en los Pros, queda ESTRICTAMENTE PROHIBIDO mencionar "poca actividad", "mantenimiento deficiente" o "poca comunidad" en los Contras.
3. Sé preciso, objetivo y coherente en la evaluación de la actividad, comunidad y soporte técnico del repositorio.

INSTRUCCIONES DE RESPUESTA:
Responde ÚNICAMENTE con un objeto JSON válido (sin etiquetas markdown, sin bloque de código markdown, ni texto extra):
{
  "name": "Nombre claro y reconocible de la herramienta",
  "description": "Explicación detallada, clara y profunda en español sobre qué es exactamente esta herramienta, qué problema resuelve en el desarrollo moderno y sus características o ventajas principales (150 a 250 palabras).",
  "use_case": "Escenario específico de cuándo usarla, para quién es ideal y qué alternativa o problema ahorra (50 a 100 palabras).",
  "example_usage": "Ejemplo práctico de código (o comandos explicados) listo para copiar y entender cómo se implementa de forma real en un proyecto.",
  "category": "una de: Frontend | Backend | DevOps | Data Science | Testing | Database | Security | AI/ML | API & Integration | Mobile | CLI Tools",
  "install_command": "comando principal de instalación (npm install X, pip install X, etc.)",
  "license": "Identificador SPDX de la licencia (ej: MIT, Apache-2.0, GPL-3.0) o 'No especificada'",
  "maintenance_status": "Activo | Mantenimiento | Inactivo",
  "risk_level": "Bajo | Medio | Alto",
  "agent_prompt": "Instrucción de Sistema lista para copiar y pegar en un Agente de IA (Claude, ChatGPT, Gemini, Antigravity, etc.). Debe indicar: qué skill tiene habilitada el agente, cuándo debe usarla, qué patrones o APIs emplear, y un ejemplo mínimo de cómo responder. Escríbelo en español, en tono profesional e imperativo, de 2 a 4 oraciones.",
  "agent_reasoning_trace": [
    "Paso 1: Validación del repositorio (ej: 'Verificación de repositorio: X estrellas.')",
    "Paso 2: Análisis del README y tecnología (ej: 'Análisis de README: Documentación completa con soporte TS.')",
    "Paso 3: Categorización automática (ej: 'Clasificación automática: Categoría Backend.')",
    "Paso 4: Dictamen final (ej: 'Dictamen: Aprobado sin observaciones.')"
  ],
  "pros": [
    "Punto fuerte 1 (ej: soporte para TypeScript, buena documentación, etc.)",
    "Punto fuerte 2..."
  ],
  "cons": [
    "Punto a considerar 1 (ej: estrellas por debajo del umbral normal de 10k, poca actividad, etc.)",
    "Punto a considerar 2..."
  ],
  "agent_recommendation": "Recomendación o dictamen cualitativo y detallado redactado por ti sobre si se aconseja integrar la herramienta en proyectos y, si procede, la sugerencia de aprobación manual por excepción (de 2 a 4 oraciones).",
  "rating": 5,
  "approved": true,
  "reason": ""
}`;

    // ── Helper: Llamar a un proveedor de IA compatible con OpenAI Chat Completions ──
    const callAIProvider = async (providerName, apiUrl, apiKey, model, timeoutMs) => {
      console.log(`[Store Skills] Consultando a ${providerName} (${model})...`);
      const response = await fetchWithTimeout(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'user', content: aiPrompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          }),
        },
        timeoutMs
      );

      if (!response.ok) {
        const status = response.status;
        throw new Error(`${providerName} API respondió con HTTP ${status} ${response.statusText}`);
      }

      const resData = await response.json();
      const responseText = resData.choices?.[0]?.message?.content || '';
      console.log(`[Store Skills] ${providerName} respondió correctamente.`);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`${providerName} no devolvió un JSON válido.`);
      }

      return JSON.parse(jsonMatch[0]);
    };

    // ── 5. Cadena de evaluación con fallback: Cerebras → Groq → Demo ──
    let evaluation = null;
    let providerUsed = 'ninguno';

    // ── Intento 1: Cerebras API (llama-3.3-70b) ──
    const cerebrasApiKey = import.meta.env.VITE_CEREBRAS_API_KEY;
    const cerebrasBaseUrl = import.meta.env.VITE_CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1';
    const cerebrasModel = import.meta.env.VITE_CEREBRAS_MODEL || 'llama-3.3-70b';

    if (cerebrasApiKey) {
      try {
        evaluation = await callAIProvider(
          'Cerebras',
          `${cerebrasBaseUrl}/chat/completions`,
          cerebrasApiKey,
          cerebrasModel,
          15000
        );
        providerUsed = 'Cerebras';
      } catch (err) {
        console.warn(`[Store Skills] Cerebras falló: ${err.message}. Intentando Groq como fallback...`);
      }
    } else {
      console.warn('[Store Skills] VITE_CEREBRAS_API_KEY no configurada. Saltando Cerebras...');
    }

    // ── Intento 2: Groq API (llama-3.3-70b-versatile) ──
    if (!evaluation) {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (groqApiKey) {
        try {
          evaluation = await callAIProvider(
            'Groq',
            'https://api.groq.com/openai/v1/chat/completions',
            groqApiKey,
            'llama-3.3-70b-versatile',
            20000
          );
          providerUsed = 'Groq';
        } catch (err) {
          console.warn(`[Store Skills] Groq falló: ${err.message}.`);
        }
      } else {
        console.warn('[Store Skills] VITE_GROQ_API_KEY no configurada. Saltando Groq...');
      }
    }

    // ── Si ningún proveedor de IA respondió, lanzar error transparente ──
    if (!evaluation) {
      console.error('[Store Skills] Todos los proveedores de IA fallaron. No se generará evaluación sintética.');
      throw new Error('No se pudo conectar con el servicio de IA. Por favor, verifica tu conexión o las variables de entorno e intenta de nuevo.');
    }

    console.log(`[Store Skills] Evaluación completada con proveedor: ${providerUsed}`);

    // ── 6. Validar rating asignado por la IA ─────────────
    const rating = Number(evaluation.rating) || 0;
    if (rating < 3) {
      return {
        approved: false,
        reason: `Rechazado por la IA: Rating ${rating}/5 (mínimo requerido: 3/5). ${evaluation.reason || ''}`,
      };
    }

    // ── 7. Guardar en Supabase ───────────────────────────
    const skillData = {
      name: evaluation.name || repoName,
      description: evaluation.description || '',
      use_case: evaluation.use_case || '',
      example_usage: evaluation.example_usage || '',
      category: evaluation.category || 'Otros',
      install_command: evaluation.install_command || '',
      license: evaluation.license || repoData.license?.spdx_id || 'No especificada',
      maintenance_status: evaluation.maintenance_status || 'Activo',
      risk_level: evaluation.risk_level || 'Medio',
      agent_prompt: evaluation.agent_prompt || '',
      agent_reasoning_trace: evaluation.agent_reasoning_trace || [],
      pros: evaluation.pros || [],
      cons: evaluation.cons || [],
      agent_recommendation: evaluation.agent_recommendation || '',
      is_exception: bypassMinStars,
      language: language,
      stars: stars,
      rating: rating,
      original_url: `https://github.com/${owner}/${repoName}`,
      repo_owner: owner,
      repo_name: repoName,
      last_updated: updatedAt,
      approved: (stars >= 10001 && evaluation.risk_level !== 'Alto') || bypassMinStars,
      reason: null,
    };

    // ── 8. Retornar resultado condicionado por estrellas o riesgo (Human-in-the-Loop) ──
    if ((stars < 10001 || evaluation.risk_level === 'Alto') && !bypassMinStars) {
      console.log('[Store Skills] Repositorio calificado pero requiere revisión o bloqueo por riesgo.');
      return {
        approved: false,
        requires_human_review: true,
        skill: { ...skillData, id: `temp-${Date.now()}` },
      };
    }

    const { data: savedSkill, error: saveError } = await supabase
      .from('skills')
      .upsert(skillData, { onConflict: 'original_url' })
      .select()
      .single();

    if (saveError) {
      console.warn('[Store Skills] No se pudo guardar en Supabase, devolviendo datos locales:', saveError.message);
      return {
        approved: true,
        skill: { ...skillData, id: `loc-${Date.now()}` },
      };
    }

    console.log('[Store Skills] Skill guardada exitosamente:', savedSkill.name);
    return {
      approved: true,
      skill: savedSkill,
    };
  }

  const saveException = async (skillData) => {
    console.log('[Store Skills] Guardando excepción para:', skillData.name);
    const dataToSave = {
      ...skillData,
      approved: true,
      is_exception: true,
      // Ensure all AI-generated fields are persisted
      license: skillData.license || 'No especificada',
      maintenance_status: skillData.maintenance_status || 'Activo',
      risk_level: skillData.risk_level || 'Bajo',
      agent_prompt: skillData.agent_prompt || null,
      agent_reasoning_trace: skillData.agent_reasoning_trace || [],
      pros: skillData.pros || [],
      cons: skillData.cons || [],
      agent_recommendation: skillData.agent_recommendation || null,
    };
    
    // Quitar prefijos de ID temporales para que Postgres genere el UUID real
    if (dataToSave.id && (dataToSave.id.startsWith('temp-') || dataToSave.id.startsWith('loc-'))) {
      delete dataToSave.id;
    }

    const { data: savedSkill, error: saveError } = await supabase
      .from('skills')
      .upsert(dataToSave, { onConflict: 'original_url' })
      .select()
      .single();

    if (saveError) {
      console.error('[Store Skills] Error al guardar excepción en Supabase:', saveError.message);
      // Fallback local en memoria si falla la BD
      return { ...dataToSave, id: `loc-exc-${Date.now()}` };
    }

    return savedSkill;
  };

  return { evaluate, saveException }
}
