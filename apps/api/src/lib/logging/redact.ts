const SENSITIVE_KEY_PATTERN = /^(password|passwordhash|token|authorization|cookie)$/i;
const REDACTED = '[REDACTED]';

export function redactSensitive<T>(value: T): T {
  return redactValue(value) as T;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactValue(val);
    }
    return result;
  }

  return value;
}
