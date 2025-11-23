/**
 * SentinelIQ Feature Definitions
 * 
 * This file contains all feature definitions for the platform.
 * Features are CODE-DRIVEN for easier maintenance and consistency.
 * No database seeding is needed - all features are defined here.
 */

export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  module: string;
  category: string;
  availableInFree: boolean;
  availableInHobby: boolean;
  availableInPro: boolean;
}

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // ============================================
  // AEGIS SECURITY MODULE FEATURES
  // ============================================
  {
    key: 'aegis.alert_creation',
    name: 'Alert Creation',
    description: 'Create and manage security alerts',
    module: 'aegis',
    category: 'security',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.alert_management',
    name: 'Alert Management',
    description: 'Full alert lifecycle management with assignment and escalation',
    module: 'aegis',
    category: 'security',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.incident_management',
    name: 'Incident Management',
    description: 'Full incident lifecycle management and investigation',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.case_management',
    name: 'Case Management',
    description: 'Forensic investigation case management',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.sla_tracking',
    name: 'SLA Tracking',
    description: 'Track response and resolution SLAs with breach alerts',
    module: 'aegis',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.auto_escalation',
    name: 'Auto Escalation',
    description: 'Automatic incident escalation based on rules and SLA breaches',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'aegis.evidence_management',
    name: 'Evidence Management',
    description: 'Digital evidence collection with chain of custody',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.observables_ioc',
    name: 'Observables & IOCs',
    description: 'Indicators of Compromise tracking and enrichment',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.task_automation',
    name: 'Task Automation',
    description: 'Automated task creation and playbook execution',
    module: 'aegis',
    category: 'security',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'aegis.advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Comprehensive security analytics and reporting',
    module: 'aegis',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.timeline_tracking',
    name: 'Timeline Tracking',
    description: 'Chronological event tracking for incidents and cases',
    module: 'aegis',
    category: 'security',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'aegis.investigation_notes',
    name: 'Investigation Notes',
    description: 'Collaborative notes for incidents and cases',
    module: 'aegis',
    category: 'security',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },

  // ============================================
  // ECLIPSE BRAND PROTECTION MODULE FEATURES
  // ============================================
  {
    key: 'eclipse.brand_monitoring',
    name: 'Brand Monitoring',
    description: 'Monitor brand mentions and potential infringements',
    module: 'eclipse',
    category: 'security',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.brand_protection',
    name: 'Brand Protection',
    description: 'Comprehensive brand protection capabilities',
    module: 'eclipse',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.analytics_reports',
    name: 'Analytics Reports',
    description: 'Brand protection analytics and reporting',
    module: 'eclipse',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.domain_monitoring',
    name: 'Domain Monitoring',
    description: 'Monitor suspicious domain registrations and typosquatting',
    module: 'eclipse',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.social_media_monitoring',
    name: 'Social Media Monitoring',
    description: 'Monitor social media platforms for brand abuse',
    module: 'eclipse',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.visual_detection',
    name: 'Visual Detection',
    description: 'Screenshot-based visual brand detection using OCR',
    module: 'eclipse',
    category: 'security',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'eclipse.automated_takedowns',
    name: 'Automated Takedowns',
    description: 'Automated takedown request processing and tracking',
    module: 'eclipse',
    category: 'integration',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'eclipse.infringement_management',
    name: 'Infringement Management',
    description: 'Comprehensive IP infringement case management',
    module: 'eclipse',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'eclipse.yara_rules',
    name: 'YARA Rules',
    description: 'Custom YARA rule detection for brand protection',
    module: 'eclipse',
    category: 'security',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'eclipse.aegis_integration',
    name: 'Aegis Integration',
    description: 'Automatic sync of brand infringements to Aegis incidents',
    module: 'eclipse',
    category: 'integration',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },

  // ============================================
  // MITRE ATT&CK MODULE FEATURES
  // ============================================
  {
    key: 'mitre.attack_mapping',
    name: 'ATT&CK Mapping',
    description: 'Map security events to MITRE ATT&CK framework',
    module: 'mitre',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'mitre.ttp_tracking',
    name: 'TTP Tracking',
    description: 'Track Tactics, Techniques, and Procedures across resources',
    module: 'mitre',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'mitre.threat_intelligence',
    name: 'Threat Intelligence',
    description: 'Advanced threat intelligence integration with ATT&CK',
    module: 'mitre',
    category: 'integration',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'mitre.attack_analytics',
    name: 'ATT&CK Analytics',
    description: 'Comprehensive analytics based on MITRE ATT&CK data',
    module: 'mitre',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'mitre.technique_recommendations',
    name: 'Technique Recommendations',
    description: 'AI-powered technique mapping recommendations',
    module: 'mitre',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'mitre.attack_simulation',
    name: 'ATT&CK Simulation',
    description: 'Attack simulation and testing based on ATT&CK techniques',
    module: 'mitre',
    category: 'security',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },

  // ============================================
  // CORE PLATFORM FEATURES
  // ============================================
  {
    key: 'core.multi_workspace',
    name: 'Multi-Workspace Support',
    description: 'Create and manage multiple workspaces',
    module: 'core',
    category: 'workspace',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'core.team_collaboration',
    name: 'Team Collaboration',
    description: 'Invite team members and manage roles',
    module: 'core',
    category: 'workspace',
    availableInFree: true,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'core.advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Comprehensive analytics and reporting dashboard',
    module: 'core',
    category: 'analytics',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'core.api_access',
    name: 'API Access',
    description: 'Full REST API access for integrations',
    module: 'core',
    category: 'integration',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'core.custom_notifications',
    name: 'Custom Notifications',
    description: 'Advanced notification customization and routing',
    module: 'core',
    category: 'notification',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'core.audit_logging',
    name: 'Audit Logging',
    description: 'Comprehensive audit trail and compliance logging',
    module: 'core',
    category: 'security',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'core.sso_integration',
    name: 'SSO Integration',
    description: 'Single Sign-On integration with enterprise providers',
    module: 'core',
    category: 'integration',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'core.custom_branding',
    name: 'Custom Branding',
    description: 'White-label workspace branding and customization',
    module: 'core',
    category: 'workspace',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  },
  {
    key: 'core.data_export',
    name: 'Data Export',
    description: 'Export data in multiple formats for backup and compliance',
    module: 'core',
    category: 'integration',
    availableInFree: false,
    availableInHobby: true,
    availableInPro: true
  },
  {
    key: 'core.priority_support',
    name: 'Priority Support',
    description: 'Priority technical support with dedicated channels',
    module: 'core',
    category: 'support',
    availableInFree: false,
    availableInHobby: false,
    availableInPro: true
  }
];

/**
 * Get features by module
 */
export function getFeaturesByModule(module?: string): FeatureDefinition[] {
  return module 
    ? FEATURE_DEFINITIONS.filter(f => f.module === module)
    : FEATURE_DEFINITIONS;
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category?: string): FeatureDefinition[] {
  return category 
    ? FEATURE_DEFINITIONS.filter(f => f.category === category)
    : FEATURE_DEFINITIONS;
}

/**
 * Get features available in a specific plan
 */
export function getFeaturesByPlan(plan: 'free' | 'hobby' | 'pro'): FeatureDefinition[] {
  const planField = `availableIn${plan.charAt(0).toUpperCase() + plan.slice(1)}` as keyof FeatureDefinition;
  return FEATURE_DEFINITIONS.filter(feature => feature[planField] === true);
}

/**
 * Check if a feature exists
 */
export function featureExists(featureKey: string): boolean {
  return FEATURE_DEFINITIONS.some(f => f.key === featureKey);
}

/**
 * Get feature by key
 */
export function getFeature(featureKey: string): FeatureDefinition | undefined {
  return FEATURE_DEFINITIONS.find(f => f.key === featureKey);
}
