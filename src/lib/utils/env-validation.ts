/**
 * Environment Validation Utility
 * Checks for required environment variables during startup
 */
export function validateEnv() {
  const required = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
    } else {
      console.warn(`[EnvValidation] Warning: Missing variables ${missing.join(', ')}`);
    }
  }

  // Provider keys (at least one should be present for partial functionality)
  const providers = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'REPLICATE_API_TOKEN',
  ];
  const activeProviders = providers.filter((key) => process.env[key]);

  if (activeProviders.length === 0) {
    console.warn('[EnvValidation] No AI provider API keys found. Most features will be disabled.');
  }

  return {
    valid: missing.length === 0,
    missing,
    activeProviders,
  };
}
