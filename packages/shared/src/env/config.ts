// Ambient declaration so TypeScript accepts process.env without @types/node.
// The typeof guard below ensures it is safe in browser environments too.
declare const process: { env?: Record<string, string | undefined> } | undefined;

export type AppEnv = 'local' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Config {
  readonly env: AppEnv;
  readonly logLevel: LogLevel;
}

const VALID_ENVS: readonly AppEnv[] = ['local', 'staging', 'production'];
const LOG_LEVEL_MAP: Record<AppEnv, LogLevel> = {
  local: 'debug',
  staging: 'warn',
  production: 'error',
};

export function loadConfig(): Config {
  // typeof guard: process is undefined in browser environments without a polyfill
  const raw = typeof process !== 'undefined'
    ? (process.env?.['APP_ENV'] ?? 'local')
    : 'local';
  const env: AppEnv = (VALID_ENVS as readonly string[]).includes(raw)
    ? (raw as AppEnv)
    : 'local';
  return { env, logLevel: LOG_LEVEL_MAP[env] };
}

export function isValidAppEnv(value: string): value is AppEnv {
  return (VALID_ENVS as readonly string[]).includes(value);
}
