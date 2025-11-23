#!/usr/bin/env npx tsx

/**
 * Force MITRE ATT&CK Sync
 * 
 * Este script força a sincronização imediata do MITRE ATT&CK
 * Útil para sincronização inicial ou testes
 * 
 * Uso: npm run import:mitre
 * 
 * Nota: A sincronização automática ocorre diariamente às 3 AM via job background
 */

import { syncMitreAttackJob } from '../src/core/modules/aegis/jobs/mitreSyncJob';

async function main() {
  console.log('🚀 Forçando sincronização do MITRE ATT&CK...');
  console.log('');

  try {
    const result = await syncMitreAttackJob();

    console.log('');
    console.log('✅ Sincronização concluída com sucesso!');
    console.log('');
    console.log('📊 Resultado:');
    console.log(`   Táticas: ${result.tactics.created} criadas, ${result.tactics.updated} atualizadas`);
    console.log(`   Técnicas: ${result.techniques.created} criadas, ${result.techniques.updated} atualizadas`);
    console.log(
      `   Sub-técnicas: ${result.subtechniques.created} criadas, ${result.subtechniques.updated} atualizadas`
    );
    console.log('');
    console.log('📚 Base de dados:');
    console.log(`   Táticas: ${result.databaseStats.tactics}`);
    console.log(`   Técnicas: ${result.databaseStats.techniques}`);
    console.log(`   Sub-técnicas: ${result.databaseStats.subtechniques}`);
    console.log(`   Tempo: ${result.duration}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na sincronização:', (error as any).message);
    console.error((error as any).stack);
    process.exit(1);
  }
}

main();

