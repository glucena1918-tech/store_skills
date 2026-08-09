import { supabase } from '../lib/supabase'

// Función para extraer solo el objeto JSON entre llaves { ... }
const extractJson = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error("No se encontró un bloque JSON válido en la respuesta de la IA.");
};

export const evaluateWithOpenRouter = async (repoMetadata, readmeText) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("La variable VITE_OPENROUTER_API_KEY no está configurada.");
  }

  const systemPrompt = `Eres un curador de Skills de IA para desarrolladores hispanohablantes.
Analiza el repositorio y responde ÚNICAMENTE con un objeto JSON válido sin bloques de código Markdown ni texto extra.
JSON con los campos: name, description, use_case, example_usage, category, install_command, license, maintenance_status, risk_level, agent_prompt, agent_reasoning_trace, pros, cons, agent_recommendation, rating, approved.`;

  const userPrompt = `Analiza este repositorio:
Nombre: ${repoMetadata.name}
Estrellas: ${repoMetadata.stars}
README: ${readmeText.slice(0, 3000)}`;

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

  // 1. Evaluar llamando a OpenRouter API (Llama 3.3 70B Free)
  const evaluation = await evaluateWithOpenRouter(repoMetadata, readmeText);

  // 2. Validar rating asignado por la IA
  const rating = Number(evaluation.rating) || 0;
  if (rating < 3) {
    return {
      approved: false,
      reason: `Rechazado por la IA: Rating ${rating}/5 (mínimo requerido: 3/5). ${evaluation.reason || ''}`,
    };
  }

  // 3. Estructurar skillData
  const stars = repoMetadata.stars || 0;
  const skillData = {
    name: evaluation.name || repoName,
    description: evaluation.description || '',
    use_case: evaluation.use_case || '',
    example_usage: evaluation.example_usage || '',
    category: evaluation.category || 'Otros',
    install_command: evaluation.install_command || '',
    license: evaluation.license || 'No especificada',
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
    original_url: original_url,
    repo_owner: owner,
    repo_name: repoName,
    last_updated: updatedAt,
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
