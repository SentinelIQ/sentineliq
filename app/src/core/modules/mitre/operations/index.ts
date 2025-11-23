/**
 * MITRE Module - Operations Index
 * 
 * Central export point for all MITRE operations
 */

// Reference Data Operations (Read-only MITRE ATT&CK data)
export {
  getMitreTactics,
  getMitreTechniques,
  getMitreSubtechniques,
  searchMitreTechniques,
  getMitreByPlatform,
  getMitreByDataSource,
  getMitreStats,
  getMitreTechniqueDetails,
} from './referenceData';

// TTP Management Operations (Polymorphic - works with any resource)
export {
  getTTPs,
  linkTTP,
  unlinkTTP,
  updateTTPOccurrence,
} from './ttpManagement';

export type {
  GetTTPsArgs,
  LinkTTPArgs,
  UnlinkTTPArgs,
  UpdateTTPOccurrenceArgs,
  SupportedResourceType,
} from './ttpManagement';
