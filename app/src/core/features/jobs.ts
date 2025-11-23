/**
 * Feature Management Background Jobs
 * Handles cleanup and maintenance of feature flags
 */
import { prisma } from 'wasp/server';
import type { CleanupDeprecatedFeaturesJob } from 'wasp/server/jobs';

export const cleanupDeprecatedFeatures: CleanupDeprecatedFeaturesJob<{}, void> = async () => {
  console.log('🧹 Starting cleanup of deprecated features...');

  try {
    // Find deprecated features past their removal date
    const deprecatedFeatures = await prisma.featureFlag.findMany({
      where: {
        deprecated: true,
        removalDate: {
          lte: new Date()
        }
      },
      include: {
        workspaceOverrides: true
      }
    });

    console.log(`Found ${deprecatedFeatures.length} deprecated features to clean up`);

    for (const feature of deprecatedFeatures) {
      // Remove workspace overrides first
      await prisma.workspaceFeatureOverride.deleteMany({
        where: {
          featureFlagId: feature.id
        }
      });

      // Remove the feature flag
      await prisma.featureFlag.delete({
        where: {
          id: feature.id
        }
      });

      console.log(`✅ Cleaned up deprecated feature: ${feature.key}`);
    }

    console.log('✅ Feature cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during feature cleanup:', error);
    throw error;
  }
};