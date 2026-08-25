/**
 * Check the current application environment.
 * @param env The environment to check against (e.g., 'development', 'production', 'test').
 * @returns {boolean} True if the current environment matches the provided env, false otherwise.
 */
export function isEnv(env: string): boolean {
  return process.env.NODE_ENV === env;
}
