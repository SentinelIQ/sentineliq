import type { BrandMonitor } from 'wasp/entities';
import { enqueueMonitoringTask } from '../queue/producer';

/**
 * Job para agendar tarefas de monitoramento
 * Roda a cada 6 horas
 */
export const scheduleMonitoringTasks = async (args: any, context: any) => {
  console.log('🔍 Starting Eclipse monitoring job...');
  
  try {
    const now = new Date();
    
    // Busca todos os monitores ativos que devem ser executados
    const dueMonitors = await context.entities.BrandMonitor.findMany({
      where: {
        status: 'active',
        isAutomated: true,
        OR: [
          { nextCheckAt: null }, // Nunca executado
          { nextCheckAt: { lte: now } }, // Próxima execução já passou
        ],
      },
      include: {
        brand: true,
      },
    });

    console.log(`📊 Found ${dueMonitors.length} monitors due for execution`);

    if (dueMonitors.length === 0) {
      return { success: true, monitorsScheduled: 0 };
    }

    // Enfileira tarefas para o Python Engine
    let successCount = 0;
    let errorCount = 0;

    for (const monitor of dueMonitors) {
      try {
        await enqueueMonitoringTask(monitor);
        
        // Atualiza timestamps
        const nextCheck = calculateNextCheckTime(monitor.checkFrequency);
        await context.entities.BrandMonitor.update({
          where: { id: monitor.id },
          data: {
            lastCheckAt: now,
            nextCheckAt: nextCheck,
          },
        });

        successCount++;
      } catch (error) {
        console.error(`❌ Failed to enqueue monitor ${monitor.id}:`, error);
        
        // Registra erro no monitor
        await context.entities.BrandMonitor.update({
          where: { id: monitor.id },
          data: {
            failedRuns: { increment: 1 },
            lastErrorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        errorCount++;
      }
    }

    console.log(`✅ Scheduled ${successCount} monitors, ${errorCount} errors`);

    return {
      success: true,
      monitorsScheduled: successCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error('❌ Eclipse monitoring job failed:', error);
    throw error;
  }
};

/**
 * Calcula o próximo horário de verificação baseado na frequência
 */
function calculateNextCheckTime(frequency: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
