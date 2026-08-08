// Supabase Edge Function: evaluate-skill
// Evalúa un repositorio de GitHub usando Gemini AI
// Deploy: supabase functions deploy evaluate-skill
// O: pegar directamente en el Dashboard de Supabase > Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, bypassMinStars } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL es requerida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. Parse GitHub URL ──────────────────────────────────
    const match = url.match(
      /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
    );
    if (!match) {
      return new Response(
        JSON.stringify({ error: "URL inválida. Solo se aceptan repositorios de GitHub." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, "");

    // ── 2. Fetch repo metadata from GitHub API ───────────────
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const githubHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "StoreSkills/1.0",
    };
    if (githubToken) {
      githubHeaders["Authorization"] = `Bearer ${githubToken}`;
    }

    const repoRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`,
      { headers: githubHeaders }
    );

    if (!repoRes.ok) {
      const status = repoRes.status;
      if (status === 404) {
        return new Response(
          JSON.stringify({
            approved: false,
            reason: "Repositorio no encontrado (privado o eliminado)",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`GitHub API error: ${status}`);
    }

    const repoData = await repoRes.json();
    const stars = repoData.stargazers_count;
    const forks = repoData.forks_count;
    const language = repoData.language || "Desconocido";
    const updatedAt = repoData.updated_at
      ? new Date(repoData.updated_at).toLocaleDateString("es-ES")
      : "Desconocido";

    // ── 3. Check minimum stars requirement ───────────────────
    if (stars < 10001 && !bypassMinStars) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: `Rechazado: ${stars.toLocaleString("es-ES")} estrellas (mínimo requerido: 10,001)`,
          canBypass: true,
          stars: stars
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Fetch README ──────────────────────────────────────
    let readmeContent = "";
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/readme`,
        {
          headers: {
            ...githubHeaders,
            Accept: "application/vnd.github.raw",
          },
        }
      );
      if (readmeRes.ok) {
        readmeContent = await readmeRes.text();
        // Limit to 3000 characters to fit in prompt
        readmeContent = readmeContent.substring(0, 3000);
      }
    } catch {
      readmeContent = "(README no disponible)";
    }

    // ── 5. Call Groq API for evaluation ─────────────────────
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY no configurada");
    }

    const prompt = `Eres un curador senior, evangelista técnico y auditor de seguridad de herramientas para desarrolladores.
Analiza minuciosamente el repositorio de GitHub y su README. Genera un análisis profundo, didáctico y extremadamente práctico para un desarrollador hispanohablante.
Además, realiza una AUDITORÍA DE SALUD Y SEGURIDAD del repositorio.

DATOS DEL REPOSITORIO:
- Nombre: ${repoName}
- Owner: ${owner}
- Stars: ${stars.toLocaleString()}
- Forks: ${forks.toLocaleString()}
- Lenguaje: ${language}
- Licencia detectada por GitHub: ${repoData.license?.spdx_id || "No detectada"}
- Última actualización: ${updatedAt}
- Fecha ISO última actualización: ${repoData.updated_at || "Desconocida"}
- README (primeros 3000 caracteres):
${readmeContent}

AUDITORÍA DE SEGURIDAD — INSTRUCCIONES:
1. LICENCIA: Identifica la licencia de código abierto del proyecto (MIT, Apache-2.0, GPL-3.0, BSD, ISC, etc.). Si no se detecta, indica "No especificada".
2. MANTENIMIENTO: Evalúa si el proyecto está "Activo" (actualizado en los últimos 6 meses), "Mantenimiento" (actualizado entre 6-18 meses) o "Inactivo" (más de 18 meses sin actualización).
3. RIESGO DE INTEGRACIÓN: Evalúa el nivel de riesgo/complejidad al integrar esta herramienta como "Bajo" (plug & play, pocas dependencias), "Medio" (requiere configuración moderada) o "Alto" (setup complejo, muchas dependencias, breaking changes frecuentes).

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
  "rating": 5,
  "approved": true,
  "reason": ""
}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const status = groqRes.status;
      if (status === 429) {
        throw new Error("Límite de cuota de Groq API excedido. Espera unos minutos e intenta de nuevo.");
      }
      throw new Error(`Error de Groq API (HTTP ${status})`);
    }

    const groqData = await groqRes.json();
    const responseText = groqData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle potential markdown wrapping)
    let evaluation;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      evaluation = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("La IA no retornó un JSON válido");
    }

    // ── 6. Verify AI rating ──────────────────────────────────
    const rating = Number(evaluation.rating) || 0;
    if (rating < 3) {
      return new Response(
        JSON.stringify({
          approved: false,
          reason: `Rechazado: Rating IA ${rating}/5 (mínimo requerido: 3/5). ${evaluation.reason || ""}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 7. Save to Supabase ──────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const skillData = {
      name: evaluation.name || repoName,
      description: evaluation.description || "",
      use_case: evaluation.use_case || "",
      example_usage: evaluation.example_usage || "",
      category: evaluation.category || "Otros",
      install_command: evaluation.install_command || "",
      license: evaluation.license || repoData.license?.spdx_id || "No especificada",
      maintenance_status: evaluation.maintenance_status || "Activo",
      risk_level: evaluation.risk_level || "Medio",
      agent_prompt: evaluation.agent_prompt || "",
      agent_reasoning_trace: evaluation.agent_reasoning_trace || [],
      language: language,
      stars: stars,
      rating: rating,
      original_url: `https://github.com/${owner}/${repoName}`,
      repo_owner: owner,
      repo_name: repoName,
      last_updated: updatedAt,
      approved: true,
      reason: null,
    };

    const { data: savedSkill, error: saveError } = await supabase
      .from("skills")
      .upsert(skillData, { onConflict: "original_url" })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving skill:", saveError);
      // Still return the evaluation even if save fails
      return new Response(
        JSON.stringify({
          approved: true,
          skill: { ...skillData, id: crypto.randomUUID() },
          warning: "Evaluada pero no se pudo guardar en la base de datos",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        approved: true,
        skill: savedSkill,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as any;
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
