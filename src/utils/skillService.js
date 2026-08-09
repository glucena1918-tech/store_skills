import { supabase } from '../lib/supabase'

export const evaluateWithCerebras = async (repoMetadata, readmeText) => {
  const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY;

  if (!apiKey) {
    throw new Error("La variable VITE_CEREBRAS_API_KEY no está configurada.");
  }

  const systemPrompt = `Eres un curador de Skills de IA para desarrolladores hispanohablantes.
Analiza el repositorio y responde ÚNICAMENTE con un objeto JSON válido sin bloques de código Markdown ni texto extra.
JSON con los campos: name, description, use_case, example_usage, category, install_command, license, maintenance_status, risk_level, agent_prompt, agent_reasoning_trace, pros, cons, agent_recommendation, rating, approved.`;

  const userPrompt = `Analiza este repositorio:
Nombre: ${repoMetadata.name}
Estrellas: ${repoMetadata.stars}
README: ${readmeText.slice(0, 3000)}`;

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_CEREBRAS_MODEL || "llama-3.3-70b",
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
    throw new Error(`Error Cerebras API (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const rawJson = data.choices[0].message.content;
  return JSON.parse(rawJson);
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

  // 1. Evaluar directamente llamando a evaluateWithCerebras
  const evaluation = await evaluateWithCerebras(repoMetadata, readmeText);

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
    console.warn('[Store Skills] No se pudo guardar en Supabase, devolviendo datos locales:', saveError.message);
    return {
      approved: true,
      skill: { ...skillData, id: `loc-${Date.now()}` },
    };
  }

  console.log('[Store Skills] Skill guardada en Supabase exitosamente:', savedSkill.name);
  return {
    approved: true,
    skill: savedSkill,
  };
};
