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

// Función para extraer solo el objeto JSON entre llaves { ... }
const extractJson = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
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
      model: "gpt-4o",
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

export const evaluateWithOpenRouter = async (repoMetadata, readmeText) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("La variable VITE_OPENROUTER_API_KEY no está configurada.");
  }

  const systemPrompt = `Eres un curador de Skills de IA para desarrolladores hispanohablantes.
Analiza el repositorio y responde ÚNICAMENTE con un objeto JSON válido sin bloques de código Markdown ni texto extra.
JSON con los campos: name, description, use_case, example_usage, category, install_command, license, maintenance_status, risk_level, agent_prompt, agent_reasoning_trace, pros, cons, agent_recommendation, rating, approved.

REGLA DE IDIOMA Y ESTRUCTURA OBLIGATORIA:
1. Redacta TODO el contenido del JSON estrictamente en ESPAÑOL.
2. El campo "agent_reasoning_trace" DEBE SER SIEMPRE UN ARRAY DE EXACTAMENTE 4 ELEMENTOS EN ESPAÑOL siguiendo este formato exacto:

"agent_reasoning_trace": [
  "Paso 1: Verificación de repositorio: [número de estrellas] estrellas en GitHub.",
  "Paso 2: Análisis de README: [resumen breve en español de la documentación].",
  "Paso 3: Clasificación automática: Categoría [Categoría asignada].",
  "Paso 4: Dictamen: [Aprobado sin observaciones / Aprobado por Excepción Humana (Human-in-the-Loop) - Bajo el umbral / Bloqueado por Riesgo Alto]"
]

3. El campo 'rating' DEBE SER OBLIGATORIAMENTE UN NÚMERO ENTERO DEL 1 AL 5 (ejemplo: 1, 2, 3, 4 o 5). No uses decimales ni escalas de 10.

QUEDA PROHIBIDO DEVOLVER "agent_reasoning_trace" COMO UN TEXTO PLANO ÚNICO O EN INGLÉS.`;

  const userPrompt = `Analiza este repositorio:
Nombre: ${repoMetadata.name}
Estrellas: ${repoMetadata.stars}
README: ${readmeText.slice(0, 8000)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://store-skills.vercel.app",
      "X-Title": "SkillAI Store"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error OpenRouter API (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.choices[0]?.message?.content || "";
  const parsedData = extractJson(rawText);
  return parsedData;
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

  // 1. Evaluar llamando a OpenAI API (gpt-4o)
  const evaluation = await evaluateWithOpenAI(repoMetadata, readmeText);

  // 2. Validar rating asignado por la IA (redondeado a entero entre 1 y 5)
  const rating = formatRating(evaluation.rating);
  if (rating < 3) {
    return {
      approved: false,
      reason: `Rechazado por la IA: Rating ${rating}/5 (mínimo requerido: 3/5). ${evaluation.reason || ''}`,
    };
  }

  // 3. Estructurar skillData
  const stars = repoMetadata.stars || 0;
  const skillData = {
    original_url: original_url,
    repo_owner: owner,
    repo_name: repoName,
    name: evaluation.name || repoName,
    description: evaluation.description || repoMetadata.description || "Colección de habilidades para Agentes de IA.",
    use_case: evaluation.use_case || "Optimizar la ingeniería de software con agentes de IA.",
    example_usage: evaluation.example_usage || "claude plugins install mattpocock-skills",
    install_command: evaluation.install_command || "claude plugins install mattpocock-skills",
    agent_prompt: evaluation.agent_prompt || "Actúa como un experto en habilidades de ingeniería de IA.",
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
    pros: ensureArray(evaluation.pros),
    cons: ensureArray(evaluation.cons),
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
