/**
 * Aegis Module - MITRE ATT&CK Sync Job
 * 
 * Background job que sincroniza diariamente a base de dados MITRE ATT&CK
 * Obtém: Táticas, Técnicas, Sub-técnicas e procedimentos
 * Armazena em banco de dados para consultas rápidas no Aegis
 * 
 * Execução: Diária (3 AM) - horário de baixo uso
 * URL: https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json
 */

import { prisma } from 'wasp/server';

const MITRE_DATA_URL = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/refs/heads/master/enterprise-attack/enterprise-attack.json';

interface MitreObject {
  type: string;
  id: string;
  name: string;
  description?: string;
  external_references?: Array<{
    url?: string;
    external_id?: string;
    source_name?: string;
  }>;
  kill_chain_phases?: Array<{
    kill_chain_name: string;
    phase_name: string;
  }>;
  x_mitre_platforms?: string[];
  x_mitre_data_sources?: string[];
  created?: string;
  modified?: string;
}

interface MitreBundle {
  type: string;
  id: string;
  objects: MitreObject[];
}

/**
 * Tática ID mapping - MITRE ATT&CK Kill Chain Phases
 */
const TACTIC_ID_MAPPING: Record<string, string> = {
  'initial-access': 'TA0001',
  'execution': 'TA0002',
  'persistence': 'TA0003',
  'privilege-escalation': 'TA0004',
  'defense-evasion': 'TA0005',
  'credential-access': 'TA0006',
  'discovery': 'TA0007',
  'lateral-movement': 'TA0008',
  'collection': 'TA0009',
  'exfiltration': 'TA0010',
  'command-and-control': 'TA0011',
  'impact': 'TA0040',
  'resource-development': 'TA0042',
  'reconnaissance': 'TA0043',
};

/**
 * Parse external ID from MITRE object
 */
function getExternalId(obj: MitreObject): string | null {
  const ref = obj.external_references?.find(
    r => r.source_name === 'mitre-attack'
  );
  return ref?.external_id || null;
}

/**
 * Get tactic ID from kill chain phases
 */
function getTacticId(obj: MitreObject): string | null {
  const phase = obj.kill_chain_phases?.find(
    p => p.kill_chain_name === 'mitre-attack'
  );
  if (!phase) return null;
  return TACTIC_ID_MAPPING[phase.phase_name] || null;
}

/**
 * Sync MITRE ATT&CK data from GitHub
 */
export async function syncMitreAttackJob() {
  const startTime = Date.now();
  console.log('[MITRE] 🔄 Iniciando sincronização MITRE ATT&CK...');

  try {
    // Download data from GitHub
    console.log('[MITRE] 📥 Baixando dados de:', MITRE_DATA_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(MITRE_DATA_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SentinelIQ-Aegis/1.0',
      },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`GitHub retornou ${response.status}: ${response.statusText}`);
    }

    const bundle: MitreBundle = await response.json();
    console.log(`[MITRE] ✅ Dados baixados (${bundle.objects.length} objetos)`);

    // Extract different object types
    const tactics = bundle.objects.filter(obj => obj.type === 'x-mitre-tactic');
    const techniques = bundle.objects.filter(obj => obj.type === 'attack-pattern');

    console.log(`[MITRE] 📊 Estatísticas:`);
    console.log(`   - Táticas: ${tactics.length}`);
    console.log(`   - Técnicas: ${techniques.length}`);

    // Sync tactics
    console.log('[MITRE] 📋 Sincronizando táticas...');
    let tacticsCreated = 0;
    let tacticsUpdated = 0;

    for (const tacticObj of tactics) {
      const externalId = getExternalId(tacticObj);
      if (!externalId) {
        console.warn(`[MITRE] ⚠️  Tática sem external_id: ${tacticObj.name}`);
        continue;
      }

      const result = await prisma.mitreTactic.upsert({
        where: { id: externalId },
        create: {
          id: externalId,
          name: tacticObj.name,
          description: tacticObj.description || '',
          url: tacticObj.external_references?.[0]?.url,
        },
        update: {
          name: tacticObj.name,
          description: tacticObj.description || '',
          url: tacticObj.external_references?.[0]?.url,
          updatedAt: new Date(),
        },
      });

      // Check if was created or updated
      const wasCreated = result.createdAt === result.updatedAt;
      if (wasCreated) {
        tacticsCreated++;
      } else {
        tacticsUpdated++;
      }
    }

    console.log(`[MITRE] ✅ Táticas: ${tacticsCreated} novas, ${tacticsUpdated} atualizadas`);

    // Sync techniques
    console.log('[MITRE] 🔧 Sincronizando técnicas e sub-técnicas...');
    let techniquesCreated = 0;
    let techniquesUpdated = 0;
    let subtechniquesCreated = 0;
    let subtechniquesUpdated = 0;

    for (const techniqueObj of techniques) {
      const externalId = getExternalId(techniqueObj);
      if (!externalId) {
        console.warn(`[MITRE] ⚠️  Técnica sem external_id: ${techniqueObj.name}`);
        continue;
      }

      // Determine if sub-technique (contains .)
      const isSubTechnique = externalId.includes('.');
      const parentId = isSubTechnique ? externalId.split('.')[0] : null;

      // Get tactic ID
      const tacticId = getTacticId(techniqueObj);
      if (!tacticId && !isSubTechnique) {
        console.warn(
          `[MITRE] ⚠️  Técnica sem tática: ${externalId} - ${techniqueObj.name}`
        );
        continue;
      }

      try {
        const result = await prisma.mitreTechnique.upsert({
          where: { id: externalId },
          create: {
            id: externalId,
            name: techniqueObj.name,
            description: techniqueObj.description || '',
            url: techniqueObj.external_references?.[0]?.url,
            tacticId: tacticId || 'TA0001', // Fallback
            parentId,
            platforms: techniqueObj.x_mitre_platforms || [],
            dataSources: techniqueObj.x_mitre_data_sources || [],
            defenses: [],
          },
          update: {
            name: techniqueObj.name,
            description: techniqueObj.description || '',
            url: techniqueObj.external_references?.[0]?.url,
            platforms: techniqueObj.x_mitre_platforms || [],
            dataSources: techniqueObj.x_mitre_data_sources || [],
            updatedAt: new Date(),
          },
        });

        const wasCreated = result.createdAt === result.updatedAt;
        if (isSubTechnique) {
          if (wasCreated) subtechniquesCreated++;
          else subtechniquesUpdated++;
        } else {
          if (wasCreated) techniquesCreated++;
          else techniquesUpdated++;
        }
      } catch (error) {
        console.error(
          `[MITRE] ❌ Erro ao upsert ${externalId}:`,
          (error as any).message
        );
      }
    }

    console.log(`[MITRE] ✅ Técnicas: ${techniquesCreated} novas, ${techniquesUpdated} atualizadas`);
    console.log(
      `[MITRE] ✅ Sub-técnicas: ${subtechniquesCreated} novas, ${subtechniquesUpdated} atualizadas`
    );

    // Get final counts
    const tacticCount = await prisma.mitreTactic.count();
    const techniqueCount = await prisma.mitreTechnique.count({
      where: { parentId: null },
    });
    const subtechniqueCount = await prisma.mitreTechnique.count({
      where: { parentId: { not: null } },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[MITRE] 🎉 Sincronização concluída em ${duration}s`);
    console.log(`[MITRE] 📊 Dados no banco:`);
    console.log(`   - Táticas: ${tacticCount}`);
    console.log(`   - Técnicas: ${techniqueCount}`);
    console.log(`   - Sub-técnicas: ${subtechniqueCount}`);
    console.log(`   - Total: ${tacticCount + techniqueCount + subtechniqueCount}`);

    return {
      success: true,
      tactics: { created: tacticsCreated, updated: tacticsUpdated },
      techniques: { created: techniquesCreated, updated: techniquesUpdated },
      subtechniques: {
        created: subtechniquesCreated,
        updated: subtechniquesUpdated,
      },
      databaseStats: {
        tactics: tacticCount,
        techniques: techniqueCount,
        subtechniques: subtechniqueCount,
      },
      duration: `${duration}s`,
    };
  } catch (error) {
    console.error('[MITRE] ❌ Erro na sincronização:', (error as any).message);
    console.error((error as any).stack);
    throw error;
  }
}

/**
 * Query helpers para Aegis
 */

export async function getMitreStats() {
  const tactics = await prisma.mitreTactic.count();
  const techniques = await prisma.mitreTechnique.count({
    where: { parentId: null },
  });
  const subtechniques = await prisma.mitreTechnique.count({
    where: { parentId: { not: null } },
  });

  return {
    tactics,
    techniques,
    subtechniques,
    total: tactics + techniques + subtechniques,
    lastUpdate: new Date(),
  };
}
