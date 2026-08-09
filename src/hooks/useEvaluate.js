import { supabase } from '../lib/supabase'
import { evaluateSkill } from '../utils/skillService'

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
    
    // Evaluación directa desde el Frontend (GitHub API + IA API)
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

    // ── 4. Evaluar IA y guardar en Supabase vía skillService ──
    return await evaluateSkill(
      { name: repoName, stars },
      readmeContent,
      {
        bypassMinStars,
        owner,
        repoName,
        language,
        updatedAt,
        original_url: `https://github.com/${owner}/${repoName}`
      }
    );
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
