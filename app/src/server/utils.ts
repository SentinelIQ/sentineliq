export function requireNodeEnvVar(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Env var ${name} is undefined`);
  } else {
    return value;
  }
}

/**
 * Validates that all critical environment variables are set
 * Should be called during application startup
 */
export function validateCriticalEnvVars(): void {
  const criticalVars = [
    'JWT_SECRET',
    'ADMIN_EMAILS',
    'SENDER_EMAIL',
    'STRIPE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'DATABASE_URL',
  ];

  const missingVars: string[] = [];
  
  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // Special validation for ADMIN_EMAILS
  if (process.env.ADMIN_EMAILS) {
    const adminEmails = process.env.ADMIN_EMAILS.split(',').map(e => e.trim()).filter(e => e);
    if (adminEmails.length === 0) {
      missingVars.push('ADMIN_EMAILS (must contain at least one valid email)');
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 See .env.server.example for required configuration');
    throw new Error(`Missing critical environment variables: ${missingVars.join(', ')}`);
  }

  // Validate optional but recommended vars
  const recommendedVars = [
    'GOOGLE_ANALYTICS_MEASUREMENT_ID',
    'PLAUSIBLE_SITE_ID',
  ];
  
  const missingRecommended = recommendedVars.filter(v => !process.env[v]);
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Warning: Missing recommended environment variables:');
    missingRecommended.forEach(v => console.warn(`   - ${v}`));
    console.warn('   Analytics features may not work properly');
  }

  console.log('✅ All critical environment variables validated successfully');
}
