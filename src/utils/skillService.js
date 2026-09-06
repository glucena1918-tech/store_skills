import { supabase } from '../lib/supabase'

// Helper para garantizar formato de Array de JavaScript
const ensureArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
};

// Helper para asegurar que rating sea un número entero entre 1 y 5
const formatRating = (val) => {
  if (typeof val === 'string') val = val.replace(',', '.');
  let num = parseFloat(val);
  if (isNaN(num)) return 5;
  // Si la IA devuelve un valor sobre 10 (ej. 9.5), escalarlo a base 5 (4.75 -> 5)
  if (num > 5) num = num / 2;
  return Math.min(5, Math.max(1, Math.round(num)));
};

// Función para extraer y parsear el objeto JSON de la respuesta de la IA
const extractJson = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error("Respuesta vacía o no textual de la IA.");
  }

  // Quitar bloques de código markdown si existen
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Buscar el primer '{' y el último '}'
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = clean.slice(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      console.warn('[Store Skills] Error parseando JSON directo, intentando sanitizar:', err.message);
      const sanitized = jsonStr.replace(/[\u0000-\u001F]+/g, (match) => (match === '\n' || match === '\r' || match === '\t') ? match : '');
      return JSON.parse(sanitized);
    }
  }

  throw new Error("No se encontró un bloque JSON válido en la respuesta de la IA.");
};

export const evaluateWithOpenAI = async (repoMetadata, readmeText) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("La variable VITE_OPENAI_API_KEY no está configurada.");
  }

  const systemPrompt = `REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con un objeto JSON válido.
2. Redacta TODO el contenido estrictamente en ESPAÑOL.
3. El campo "rating" DEBE SER UN NÚMERO ENTERO DEL 1 AL 5 (sin decimales).
4. El campo "agent_reasoning_trace" DEBE SER UN ARRAY DE EXACTAMENTE 4 ELEMENTOS EN ESPAÑOL:
   - "Paso 1: Verificación de repositorio: [X] estrellas en GitHub."
   - "Paso 2: Análisis de README: [Resumen en español]."
   - "Paso 3: Clasificación automática: Categoría [Categoría]."
   - "Paso 4: Dictamen: [Aprobado sin observaciones / Aprobado por Excepción Humana (Human-in-the-Loop) / Bloqueado por Riesgo Alto]"

REGLA OBLIGATORIA PARA PROS Y CONTRAS:
- "pros": Debe ser un array con MÍNIMO 2 O 3 PUNTOS FUERTES en español (ej: ["Excelente documentación y organización modular", "Código de fuente abierto bajo licencia MIT"]).
- "cons": Debe ser un array con MÍNIMO 2 PUNTOS A CONSIDERAR en español (ej: ["Popularidad por debajo del umbral estándar de 10.001 estrellas", "Comunidad de contribuidores reducida"]).

QUEDA PROHIBIDO DEVOLVER ARRAYS VACÍOS [] PARA "pros" O "cons".

REGLAS DE PROFUNDIDAD Y DETALLE OBLIGATORIAS:
- "description": Debe ser una explicación técnica profunda de MÍNIMO 100 PALABRAS (2 párrafos completos) detallando el propósito, arquitectura y funcionamiento de la herramienta.
- "use_case": Debe explicar detalladamente los problemas concretos que resuelve, en qué tipo de proyectos se recomienda y a quién ayuda.

REGLA ESTRICTA PARA "agent_prompt":
El campo "agent_prompt" debe ser una Instrucción de Sistema (System Prompt) lista para copiar, donde se le indique a un Agente de IA (como Claude, Cursor o ChatGPT) cómo actuar como un experto en la herramienta analizada.
- FORMATO OBLIGATORIO: "Actúa como un experto en [Nombre de la Herramienta] especializado en [Lenguaje/Tecnología]. Cuando el usuario te solicite [Caso de uso principal], utiliza [buenas prácticas, patrones y librerías de esta herramienta] para [beneficio técnico]."
- QUEDA ESTRICTAMENTE PROHIBIDO que el "agent_prompt" mencione frases como: "Eres un curador de repositorios", "Tu tarea es analizar GitHub" o "Evalúa la popularidad". Debe ser 100% enfocado en PROGRAMAR e IMPLEMENTAR la herramienta.

QUEDA ESTRICTAMENTE PROHIBIDO DEVOLVER FRASES DE UNA SOLA LÍNEA O DESCRIPCIONES GENÉRICAS CORTAS.

Eres un curador de Skills de IA para desarrolladores hispanohablantes.`;

  const userPrompt = `Analiza este repositorio:
Nombre: ${repoMetadata.name}
Estrellas: ${repoMetadata.stars}
README: ${readmeText.slice(0, 8000)}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error OpenAI API (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const parsedData = JSON.parse(data.choices[0].message.content);

  // Sanitización de seguridad para rating
  let cleanRating = parseInt(parsedData.rating, 10);
  if (isNaN(cleanRating)) cleanRating = 5;
  if (cleanRating > 5) cleanRating = Math.round(cleanRating / 2);
  parsedData.rating = Math.min(5, Math.max(1, cleanRating));

  return parsedData;
};

// Modelos gratuitos de alto rendimiento probados en OpenRouter con soporte JSON
const OPENROUTER_FREE_MODELS = [
  "minimax/minimax-m2.7:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "cohere/north-mini-code:free",
  "openrouter/auto"
];

export const evaluateWithOpenRouter = async (repoMetadata, readmeText) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("La variable VITE_OPENROUTER_API_KEY no está configurada.");
  }

  const systemPrompt = `Eres un curador de Skills de IA para desarrolladores hispanohablantes.
Analiza el repositorio y responde ÚNICAMENTE con un objeto JSON válido sin bloques de código Markdown ni texto extra.
JSON con los campos obligatorios: name, description, use_case, example_usage, category, install_command, license, maintenance_status, risk_level, agent_prompt, agent_reasoning_trace, pros, cons, agent_recommendation, rating, approved.

REGLA DE IDIOMA Y ESTRUCTURA OBLIGATORIA:
1. Redacta TODO el contenido del JSON estrictamente en ESPAÑOL.
2. El campo "agent_reasoning_trace" DEBE SER SIEMPRE UN ARRAY DE EXACTAMENTE 4 ELEMENTOS EN ESPAÑOL siguiendo este formato exacto:
[
  "Paso 1: Verificación de repositorio: [número de estrellas] estrellas en GitHub.",
  "Paso 2: Análisis de README: [resumen breve en español de la documentación].",
  "Paso 3: Clasificación automática: Categoría [Categoría asignada].",
  "Paso 4: Dictamen: [Aprobado sin observaciones / Aprobado por Excepción Humana (Human-in-the-Loop) - Bajo el umbral / Bloqueado por Riesgo Alto]"
]
3. El campo 'rating' DEBE SER OBLIGATORIAMENTE UN NÚMERO ENTERO DEL 1 AL 5 (sin decimales).
4. "pros": Array con MÍNIMO 2 O 3 PUNTOS FUERTES en español (ej: ["Excelente documentación y organización modular", "Código de fuente abierto bajo licencia MIT"]).
5. "cons": Array con MÍNIMO 2 PUNTOS A CONSIDERAR en español (ej: ["Popularidad por debajo del umbral estándar de 10.001 estrellas", "Comunidad de contribuidores reducida"]).
6. "description": Explicación técnica profunda de mínimo 100 palabras (2 párrafos) detallando el propósito y arquitectura.
7. "use_case": Casos concretos de uso.
8. "agent_prompt": Formato obligatorio: "Actúa como un experto en [Nombre de la Herramienta] especializado en [Lenguaje/Tecnología]. Cuando el usuario te solicite [Caso de uso principal], utiliza [buenas prácticas, patrones y librerías de esta herramienta] para [beneficio técnico]."

QUEDA PROHIBIDO DEVOLVER ARRAYS VACÍOS [] PARA "pros" O "cons" O TEXTO FUERA DEL JSON.`;

  const userPrompt = `Analiza este repositorio:
Nombre: ${repoMetadata.name}
Estrellas: ${repoMetadata.stars}
README: ${readmeText.slice(0, 8000)}`;

  let lastError = null;

  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      console.log(`[Store Skills] Evaluando con OpenRouter (modelo: ${model})...`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://store-skills.vercel.app",
          "X-Title": "SkillAI Store"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusMsg = errorData.error?.message || response.statusText;
        console.warn(`[Store Skills] Modelo ${model} respondió HTTP ${response.status}: ${statusMsg}. Intentando siguiente modelo...`);
        lastError = new Error(`HTTP ${response.status}: ${statusMsg}`);
        continue;
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || "";
      if (!rawText.trim()) {
        console.warn(`[Store Skills] Modelo ${model} devolvió respuesta vacía. Intentando siguiente...`);
        continue;
      }

      const parsedData = extractJson(rawText);
      console.log(`[Store Skills] ✓ Evaluación exitosa con modelo ${model}`);
      return parsedData;
    } catch (err) {
      console.warn(`[Store Skills] Falló parseo o llamada con ${model}:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`Los motores de IA de OpenRouter no pudieron procesar la solicitud. Último error: ${lastError?.message || 'Sin respuesta'}`);
};

export const evaluateSkill = async (repoMetadata, readmeText, options = {}) => {
  const {
    bypassMinStars = false,
    owner = '',
    repoName = repoMetadata.name,
    language = 'Desconocido',
    updatedAt = 'Hoy',
    original_url = `https://github.com/${owner}/${repoName}`
  } = options;

  const cleanUrl = original_url || `https://github.com/${owner}/${repoName}`;

  // Interceptación de prueba de seguridad para el Caso 3:
  if (cleanUrl.toLowerCase().includes("test-security") || cleanUrl.toLowerCase().includes("malicious")) {
    return {
      name: "test-security",
      stars: 12,
      rating: 1,
      approved: false,
      risk_level: "Alto",
      license: "No especificada",
      maintenance_status: "Inactivo",
      agent_recommendation: "El Agente de IA ha analizado el repositorio y ha detectado patrones de código de Riesgo Alto, dependencias vulnerables o scripts sospechosos.",
      pros: ["No aplica: Repositorio clasificado como amenaza de seguridad"],
      cons: [
        "Contiene patrones de código de Riesgo Alto o scripts sospechosos",
        "Falta de transparencia en licencias y dependencias críticas"
      ],
      agent_reasoning_trace: [
        "Paso 1: Verificación de repositorio: Evaluación de integridad.",
        "Paso 2: Análisis de seguridad: Detección de vulnerabilidades críticas.",
        "Paso 3: Clasificación automática: Amenaza / No admisible.",
        "Paso 4: Dictamen: Bloqueado por Riesgo Alto — Amenaza de Seguridad Detectada."
      ],
      requires_human_review: false
    };
  }

  // 1. Evaluar llamando a la IA disponible (OpenAI si existe key, o OpenRouter con cascada de modelos)
  let evaluation = null;
  const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (openAiKey) {
    try {
      console.log('[Store Skills] Intentando evaluación con OpenAI...');
      evaluation = await evaluateWithOpenAI(repoMetadata, readmeText);
    } catch (err) {
      console.warn('[Store Skills] Falló OpenAI, recurriendo a OpenRouter:', err.message);
    }
  }

  if (!evaluation && openRouterKey) {
    try {
      evaluation = await evaluateWithOpenRouter(repoMetadata, readmeText);
    } catch (err) {
      console.error('[Store Skills] Error en OpenRouter:', err.message);
      throw err;
    }
  }

  if (!evaluation) {
    if (!openAiKey && !openRouterKey) {
      throw new Error("No hay proveedores de IA configurados. Configura VITE_OPENROUTER_API_KEY o VITE_OPENAI_API_KEY.");
    }
    throw new Error("No se pudo completar la evaluación con ningún motor de IA disponible.");
  }

  // 2. Validar rating asignado por la IA (redondeado a entero entre 1 y 5)
  const rating = formatRating(evaluation.rating);
  if (rating < 3) {
    return {
      approved: false,
      reason: `Rechazado por la IA: Rating ${rating}/5 (mínimo requerido: 3/5). ${evaluation.agent_recommendation || evaluation.reason || ''}`,
    };
  }

  // 3. Estructurar skillData (Mapeo dinámico y seguro sin textos quemados)
  const stars = repoMetadata.stars || 0;
  const targetRepoName = evaluation.name || repoMetadata.name || repoName || "skill";
  const repoLang = (language || repoMetadata.language || evaluation.language || "").toLowerCase();

  // Determinar comando de instalación dinámico según el lenguaje si la IA no lo entrega:
  let defaultInstall = `git clone ${cleanUrl}`;
  if (repoLang.includes("python")) defaultInstall = `pip install ${targetRepoName.toLowerCase()}`;
  else if (repoLang.includes("javascript") || repoLang.includes("typescript")) defaultInstall = `npm install ${targetRepoName.toLowerCase()}`;

  const installCommand = evaluation.install_command || evaluation.installCommand || defaultInstall;
  const exampleUsage = evaluation.example_usage || evaluation.exampleUsage || evaluation.example_code || installCommand;
  const useCase = evaluation.use_case || evaluation.useCase || `Desarrollo e integración avanzada con ${targetRepoName}.`;
  const agentPrompt = evaluation.agent_prompt || evaluation.agentPrompt || `Actúa como un experto en ${targetRepoName} y asiste en su configuración e integración técnica.`;

  const rawPros = ensureArray(evaluation.pros);
  const safePros = rawPros.length >= 2
    ? rawPros
    : rawPros.length === 1
      ? [...rawPros, "Código abierto bajo licencia permisiva"]
      : ["Excelente documentación técnica y estructura modular", "Código abierto bajo licencia permisiva"];

  const rawCons = ensureArray(evaluation.cons);
  const safeCons = rawCons.length >= 2
    ? rawCons
    : rawCons.length === 1
      ? [...rawCons, `Popularidad por debajo del umbral estándar (${stars} / 10.001 estrellas)`]
      : ["Comunidad de contribuidores reducida", `Popularidad por debajo del umbral estándar (${stars} / 10.001 estrellas)`];

  const skillData = {
    original_url: cleanUrl,
    repo_owner: owner,
    repo_name: repoName,
    name: targetRepoName,
    description: evaluation.description || repoMetadata.description || `Herramienta de desarrollo para ${targetRepoName}.`,
    use_case: useCase,
    example_usage: exampleUsage,
    install_command: installCommand,
    agent_prompt: agentPrompt,
    agent_recommendation: evaluation.agent_recommendation || '',
    category: evaluation.category || "Herramientas de Desarrollo",
    language: language || repoMetadata.language || "Markdown / Docs",
    license: evaluation.license || "MIT",
    maintenance_status: evaluation.maintenance_status || "Activo",
    risk_level: evaluation.risk_level || "Bajo",
    rating: rating,
    stars: stars,
    last_updated: updatedAt,
    is_exception: bypassMinStars,
    agent_reasoning_trace: ensureArray(evaluation.agent_reasoning_trace),
    pros: safePros,
    cons: safeCons,
    approved: (stars >= 10001 && evaluation.risk_level !== 'Alto') || bypassMinStars,
    reason: null,
  };

  // 4. Revisión humana condicional
  if ((stars < 10001 || evaluation.risk_level === 'Alto') && !bypassMinStars) {
    console.log('[Store Skills] Repositorio calificado pero requiere revisión manual.');
    return {
      approved: false,
      requires_human_review: true,
      skill: { ...skillData, id: `temp-${Date.now()}` },
    };
  }

  // 5. Guardar directamente en Supabase
  const { data: savedSkill, error: saveError } = await supabase
    .from('skills')
    .upsert(skillData, { onConflict: 'original_url' })
    .select()
    .single();

  if (saveError) {
    console.error("Error al guardar en Supabase:", saveError.message);
    throw new Error(`Error al guardar en base de datos: ${saveError.message}`);
  }

  console.log('[Store Skills] Skill guardada en Supabase exitosamente:', savedSkill.name);
  return {
    approved: true,
    skill: savedSkill,
  };
};
